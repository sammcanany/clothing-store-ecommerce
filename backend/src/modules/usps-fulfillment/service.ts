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
   */
  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    try {
      const cart = context as any
      
      // Get shipping address from cart
      const shippingAddress = cart?.shipping_address
      if (!shippingAddress || !shippingAddress.postal_code) {
        throw new Error("Shipping address with postal code is required")
      }

      // Get package dimensions from cart items
      // You may want to calculate total weight and dimensions based on products
      const weight = this.calculateWeight(cart.items || [])
      const dimensions = this.calculateDimensions(cart.items || [])

      // Get mail class from option data
      const mailClass = (optionData as any)?.mailClass || this.options_.defaultMailClass

      // Calculate rates using USPS API
      const rateResponse = await this.client_.calculateRates({
        originZIPCode: this.options_.originZIPCode,
        destinationZIPCode: shippingAddress.postal_code,
        weight: weight,
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        mailClass: mailClass,
        priceType: "RETAIL",
      })

      // Find the matching rate for the selected mail class
      // Note: USPS API returns rateOptions[].rates[] structure
      let selectedRate: any = null
      
      for (const rateOption of rateResponse.rateOptions || []) {
        const matchingRate = rateOption.rates?.find(
          (rate: any) => rate.mailClass === mailClass
        )
        if (matchingRate) {
          selectedRate = matchingRate
          break
        }
      }

      if (!selectedRate) {
        this.logger_.error(`No rate found for mail class: ${mailClass}`)
        this.logger_.error(`Available mail classes: ${JSON.stringify(
          rateResponse.rateOptions?.flatMap((opt: any) => 
            opt.rates?.map((r: any) => r.mailClass) || []
          )
        )}`)
        throw new Error(`No rate found for mail class: ${mailClass}`)
      }

      // Return price as-is (USPS returns in dollars, Medusa expects dollars for USD)
      const calculatedAmount = selectedRate.price

      return {
        calculated_amount: calculatedAmount,
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
