/**
 * Type definitions for USPS Fulfillment Provider
 */

export type UspsEnvironment = "production" | "testing"

export type UspsMailClass = 
  | "PRIORITY_MAIL"
  | "PRIORITY_MAIL_EXPRESS"
  | "USPS_GROUND_ADVANTAGE"
  | "FIRST-CLASS_PACKAGE_SERVICE"

export type UspsPriceType = "RETAIL" | "COMMERCIAL" | "CONTRACT"

export interface UspsConfig {
  clientId: string
  clientSecret: string
  environment?: UspsEnvironment
}

export interface UspsProviderOptions extends UspsConfig {
  originZIPCode: string
  defaultMailClass?: UspsMailClass
}

export interface UspsRateRequest {
  originZIPCode: string
  destinationZIPCode: string
  weight: number // pounds
  length: number // inches
  width: number // inches
  height: number // inches
  mailClass?: UspsMailClass
  priceType?: UspsPriceType
  mailingDate?: string // YYYY-MM-DD
}

export interface UspsRateFee {
  name: string
  SKU: string
  price: number
}

export interface UspsRate {
  description: string
  priceType: string
  price: number
  weight: number
  dimWeight: number
  fees: any[]
  startDate: string
  endDate: string
  mailClass: string
  zone: string
  productName: string
  productDefinition: string
  processingCategory: string
  rateIndicator: string
  destinationEntryFacilityType: string
  SKU: string
}

export interface UspsRateOption {
  totalBasePrice: number
  rates: UspsRate[]
  extraServices: any[]
}

export interface UspsRateResponse {
  rateOptions: UspsRateOption[]
}

export interface UspsAddress {
  streetAddress: string
  secondaryAddress?: string
  city?: string
  state: string
  ZIPCode?: string
  ZIPPlus4?: string
}

export interface UspsAddressResponse {
  firm?: string
  address: {
    streetAddress: string
    streetAddressAbbreviation?: string
    secondaryAddress?: string
    city: string
    cityAbbreviation?: string
    state: string
    ZIPCode: string
    ZIPPlus4?: string
  }
  additionalInfo?: {
    deliveryPoint?: string
    carrierRoute?: string
    DPVConfirmation?: "Y" | "D" | "S" | "N"
    business?: "Y" | "N"
  }
}

export interface UspsTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface UspsErrorResponse {
  apiVersion: string
  error: {
    code: string
    message: string
    errors?: Array<{
      status: string
      code: string
      title: string
      detail: string
      source?: {
        parameter: string
        example: string
      }
    }>
  }
}
