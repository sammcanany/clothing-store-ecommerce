import { useState } from 'react'

// Helper function to calculate package dimensions from cart items
function calculatePackageDimensions(items: any[]): {
  weight: number
  dimensions: { length: number; width: number; height: number }
} {
  if (!items || items.length === 0) {
    return {
      weight: 0.5, // default 0.5 lbs
      dimensions: { length: 10, width: 8, height: 2 } // default small package
    }
  }

  // Calculate total weight from all items
  let totalWeight = 0
  let maxLength = 0
  let maxWidth = 0
  let totalHeight = 0

  items.forEach((item: any) => {
    const variant = item.variant
    const quantity = item.quantity || 1

    // Get weight from variant or product
    const itemWeight = variant?.weight || variant?.product?.weight || 0.5
    totalWeight += itemWeight * quantity

    // Get dimensions from variant or product
    const length = variant?.length || variant?.product?.length || 10
    const width = variant?.width || variant?.product?.width || 8
    const height = variant?.height || variant?.product?.height || 2

    // Track maximum length and width (items side by side)
    maxLength = Math.max(maxLength, length)
    maxWidth = Math.max(maxWidth, width)
    
    // Stack heights (items on top of each other)
    totalHeight += height * quantity
  })

  return {
    weight: Math.max(totalWeight, 0.1), // minimum 0.1 lbs
    dimensions: {
      length: Math.max(maxLength, 10),
      width: Math.max(maxWidth, 8),
      height: Math.min(totalHeight, 20) // cap at 20 inches
    }
  }
}

export interface ShippingRate {
  id: string
  name: string
  price: number
  priceInCents: number
  deliveryDays: string
}

export interface ShippingCalculationInput {
  destinationZip: string
  items?: Array<{
    quantity: number
    weight?: number
  }>
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

export interface ShippingCalculationResult {
  destinationZip: string
  originZip: string
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  rates: ShippingRate[]
}

export function useShippingCalculator() {
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rates, setRates] = useState<ShippingRate[]>([])

  const calculateRates = async (
    input: ShippingCalculationInput
  ): Promise<ShippingCalculationResult | null> => {
    if (!input.destinationZip || input.destinationZip.length < 5) {
      setError('Please enter a valid 5-digit ZIP code')
      return null
    }

    setIsCalculating(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/usps/calculate-rates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify(input),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate shipping rates')
      }

      const result = await response.json()
      setRates(result.rates)
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping rates')
      setRates([])
      return null
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateRatesFromCart = async (
    cartId: string,
    destinationZip: string
  ): Promise<ShippingCalculationResult | null> => {
    if (!destinationZip || destinationZip.length < 5) {
      setError('Please enter a valid 5-digit ZIP code')
      return null
    }

    setIsCalculating(true)
    setError(null)

    try {
      // Fetch cart with items
      const cartResponse = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/carts/${cartId}`,
        {
          headers: {
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
        }
      )

      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart')
      }

      const cartData = await cartResponse.json()
      const cart = cartData.cart

      // Calculate dimensions from cart items
      const { weight, dimensions } = calculatePackageDimensions(cart.items || [])

      // Now calculate shipping rates
      return await calculateRates({
        destinationZip,
        weight,
        dimensions,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to calculate shipping rates')
      setRates([])
      return null
    } finally {
      setIsCalculating(false)
    }
  }

  const clearRates = () => {
    setRates([])
    setError(null)
  }

  return {
    calculateRates,
    calculateRatesFromCart,
    clearRates,
    isCalculating,
    error,
    rates,
  }
}
