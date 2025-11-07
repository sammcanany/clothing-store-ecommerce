import axios, { AxiosInstance } from "axios"
import {
  UspsConfig,
  UspsRateRequest,
  UspsRateResponse,
  UspsAddress,
  UspsAddressResponse,
  UspsTokenResponse,
} from "./types"

export class UspsClient {
  private client: AxiosInstance
  private config: UspsConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: UspsConfig) {
    this.config = config
    
    const baseURL = config.environment === "production" 
      ? "https://apis.usps.com"
      : "https://apis-tem.usps.com"

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await axios.post(
        `${this.client.defaults.baseURL}/oauth2/v3/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          // Don't specify scope - let the API key determine available scopes
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )

      const token = response.data.access_token
      this.accessToken = token
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000

      return token
    } catch (error) {
      throw new Error(`Failed to get USPS access token: ${error.message}`)
    }
  }

  /**
   * Calculate shipping rates using USPS Domestic Prices API
   */
  async calculateRates(request: UspsRateRequest): Promise<UspsRateResponse> {
    try {
      const token = await this.getAccessToken()

      const response = await this.client.post(
        "/prices/v3/total-rates/search",
        {
          originZIPCode: request.originZIPCode,
          destinationZIPCode: request.destinationZIPCode,
          weight: Number(request.weight),
          length: Number(request.length),
          width: Number(request.width),
          height: Number(request.height),
          mailClass: request.mailClass,
          priceType: request.priceType || "RETAIL",
          mailingDate: request.mailingDate || new Date().toISOString().split('T')[0],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message
        throw new Error(`USPS API Error: ${message}`)
      }
      throw error
    }
  }

  /**
   * Validate and standardize an address
   */
  async validateAddress(address: UspsAddress): Promise<UspsAddressResponse> {
    try {
      const token = await this.getAccessToken()

      const params = new URLSearchParams({
        streetAddress: address.streetAddress,
        state: address.state,
      })

      if (address.city) {
        params.append("city", address.city)
      }
      if (address.ZIPCode) {
        params.append("ZIPCode", address.ZIPCode)
      }

      const response = await this.client.get(
        `/addresses/v3/address?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message
        throw new Error(`USPS Address Validation Error: ${message}`)
      }
      throw error
    }
  }
}
