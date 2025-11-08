import { AbstractFulfillmentProviderService } from "@medusajs/utils"
import {
  Logger,
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  FulfillmentOption,
  CreateShippingOptionDTO,
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  CreateFulfillmentResult,
} from "@medusajs/types"
import { UspsClient } from "./usps-client"
import { UspsConfig } from "./types"

type InjectedDependencies = {
  logger: Logger
}

export type UspsProviderOptions = UspsConfig & {
  originZIPCode: string
  defaultMailClass?: string
}

class UspsProviderService extends AbstractFulfillmentProviderService {
  static identifier = "usps"
  
  protected logger_: Logger
  protected options_: UspsProviderOptions
  protected client_: UspsClient

  constructor(
    { logger }: InjectedDependencies,
    options: UspsProviderOptions
  ) {
    super()
    
    this.logger_ = logger
    this.options_ = options
    
    // Initialize USPS client
    this.client_ = new UspsClient({
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      environment: options.environment || "testing",
    })
  }

  /**
   * Get available fulfillment options (mail classes)
   */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "usps-priority",
        name: "USPS Priority Mail",
        data: {
          mailClass: "PRIORITY_MAIL",
        },
      },
      {
        id: "usps-priority-express",
        name: "USPS Priority Mail Express",
        data: {
          mailClass: "PRIORITY_MAIL_EXPRESS",
        },
      },
      {
        id: "usps-ground-advantage",
        name: "USPS Ground Advantage",
        data: {
          mailClass: "USPS_GROUND_ADVANTAGE",
        },
      },
      {
        id: "usps-first-class",
        name: "USPS First-Class Package Service",
        data: {
          mailClass: "FIRST_CLASS_PACKAGE_SERVICE",
        },
      },
    ]
  }

  /**
   * Validate fulfillment data from cart/checkout
   */
  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return data
  }

  /**
   * Validate shipping option configuration
   */
  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    return true
  }

  /**
   * Calculate the shipping price using USPS API
   * Note: We make ONE API call without mailClass to get ALL rates, then cache them
   */
  private ratesCache: Map<string, { rates: any[], timestamp: number }> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const cart = context as any
    
    // Get mail class from option data
    const mailClass = (optionData as any)?.mailClass || this.options_.defaultMailClass
    
    if (!mailClass) {
      throw new Error("Mail class is required for USPS shipping")
    }
    
    try {
      // Get shipping address from cart
      const shippingAddress = cart?.shipping_address
      if (!shippingAddress || !shippingAddress.postal_code) {
        throw new Error("Shipping address with postal code is required")
      }

      // Create cache key
      const cacheKey = `${this.options_.originZIPCode}-${shippingAddress.postal_code}-${cart.id}`
      
      // Check cache first
      let allRates: any[] = []
      const cached = this.ratesCache.get(cacheKey)
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger_.info(`Using cached rates for ${cacheKey}`)
        allRates = cached.rates
      } else {
        // Get package dimensions from cart items
        const weight = this.calculateWeight(cart.items || [])
        const dimensions = this.calculateDimensions(cart.items || [])

        this.logger_.info(`Making USPS API call WITHOUT mailClass to get all rates`)
        
        // Try making ONE API call without mailClass parameter to get ALL rates
        try {
          const rateResponse = await this.client_.calculateRates({
            originZIPCode: this.options_.originZIPCode,
            destinationZIPCode: shippingAddress.postal_code,
            weight: weight,
            length: dimensions.length,
            width: dimensions.width,
            height: dimensions.height,
            // NOT passing mailClass - hoping API returns all available rates
            priceType: "RETAIL",
          })
          
          // Extract all rates from response
          for (const rateOption of rateResponse.rateOptions || []) {
            for (const rate of rateOption.rates || []) {
              allRates.push(rate)
            }
          }
          
          if (allRates.length > 0) {
            this.logger_.info(`Got ${allRates.length} rates from single API call!`)
            this.logger_.info(`Available mail classes: ${allRates.map(r => r.mailClass).join(', ')}`)
            // Log the FULL structure of the first rate to see available fields
            this.logger_.info(`Sample rate object: ${JSON.stringify(allRates[0], null, 2)}`)
          } else {
            this.logger_.warn(`No rates returned without mailClass, falling back to multiple calls`)
            throw new Error("No rates returned")
          }
        } catch (error) {
          // Fallback: If API requires mailClass, make 3 separate calls
          this.logger_.info(`Single API call failed, making 3 separate calls: ${error.message}`)
          
          const mailClasses = [
            "PRIORITY_MAIL",
            "PRIORITY_MAIL_EXPRESS", 
            "USPS_GROUND_ADVANTAGE"
          ]
          
          const ratePromises = mailClasses.map(async (mc) => {
            try {
              const rateResponse = await this.client_.calculateRates({
                originZIPCode: this.options_.originZIPCode,
                destinationZIPCode: shippingAddress.postal_code,
                weight: weight,
                length: dimensions.length,
                width: dimensions.width,
                height: dimensions.height,
                mailClass: mc as any,
                priceType: "RETAIL",
              })
              
              for (const rateOption of rateResponse.rateOptions || []) {
                for (const rate of rateOption.rates || []) {
                  return { ...rate, mailClass: mc }
                }
              }
              return null
            } catch (err) {
              this.logger_.warn(`Failed to get rate for ${mc}: ${err.message}`)
              return null
            }
          })
          
          const results = await Promise.all(ratePromises)
          allRates = results.filter(r => r !== null)
        }
        
        // Cache the results
        this.ratesCache.set(cacheKey, {
          rates: allRates,
          timestamp: Date.now()
        })
        
        this.logger_.info(`Cached ${allRates.length} rates for ${cacheKey}`)
      }

      // Find the rate for this specific mail class
      const selectedRate = allRates.find(rate => rate.mailClass === mailClass)

      if (!selectedRate || selectedRate.price === undefined) {
        this.logger_.warn(`No rate found for mail class: ${mailClass}`)
        this.logger_.info(`Looking for: "${mailClass}"`)
        this.logger_.info(`Available rates: ${JSON.stringify(allRates.map(r => ({ mailClass: r.mailClass, price: r.price })), null, 2)}`)
        throw new Error(`No rate available for ${mailClass}`)
      }

      this.logger_.info(`Calculated USPS ${mailClass} rate: $${selectedRate.price}`)

      return {
        calculated_amount: selectedRate.price, // Price already in cents from USPS API
        is_calculated_price_tax_inclusive: false,
      }
    } catch (error) {
      this.logger_.error(`USPS rate calculation error: ${error.message}`)
      throw error
    }
  }

  /**
   * Check if fulfillment option can be used for the cart
   */
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return true
  }

  /**
   * Create a fulfillment (called when order is placed)
   */
  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    // For now, we just return the fulfillment data
    // In a production scenario, you might create a shipment in USPS here
    return {
      data: {
        ...data,
        usps_tracking_number: null, // Would be populated if you create actual labels
      },
      labels: [],
    }
  }

  /**
   * Cancel a fulfillment
   */
  async cancelFulfillment(fulfillment: Record<string, unknown>): Promise<any> {
    return {}
  }

  /**
   * Create a return (when customer returns items)
   */
  async createReturn(returnOrder: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {}
  }

  /**
   * Get documents for a fulfillment (like shipping labels)
   */
  async getFulfillmentDocuments(data: Record<string, unknown>): Promise<any> {
    return {}
  }

  /**
   * Create a shipment
   */
  async createShipment(
    fulfillment: Record<string, unknown>,
    shipmentData: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return {}
  }

  /**
   * Retrieve a shipment's documents
   */
  async getShipmentDocuments(data: Record<string, unknown>): Promise<never[]> {
    return []
  }

  /**
   * Calculate total weight from cart items
   * You may want to customize this based on your product data model
   */
  private calculateWeight(items: any[]): number {
    // Default to 1 pound if no weight data
    // In production, you should get weight from product variants
    const totalWeight = items.reduce((total, item) => {
      const itemWeight = item.variant?.weight || 0.5 // Default 0.5 lb per item
      return total + (itemWeight * item.quantity)
    }, 0)
    
    return Math.max(totalWeight, 0.1) // Minimum 0.1 lb
  }

  /**
   * Calculate package dimensions from cart items
   * You may want to customize this based on your product data model
   */
  private calculateDimensions(items: any[]): { length: number; width: number; height: number } {
    // Default dimensions for a standard package
    // In production, you might calculate based on product dimensions
    // or use different logic for combining multiple items
    return {
      length: 12, // inches
      width: 9,
      height: 6,
    }
  }
}

export default UspsProviderService
