import { useState } from 'react'
import { medusaClient } from '@/lib/config/medusa-client'

export interface AddressValidationInput {
  streetAddress: string
  secondaryAddress?: string
  city?: string
  state: string
  zipCode?: string
}

export interface ValidatedAddress {
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
    DPVConfirmation?: 'Y' | 'D' | 'S' | 'N'
    business?: 'Y' | 'N'
  }
}

export function useAddressValidation() {
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAddress = async (
    address: AddressValidationInput
  ): Promise<ValidatedAddress | null> => {
    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/usps/validate-address`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify(address),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to validate address')
      }

      const validatedAddress = await response.json()
      return validatedAddress
    } catch (err: any) {
      setError(err.message || 'Failed to validate address')
      return null
    } finally {
      setIsValidating(false)
    }
  }

  return {
    validateAddress,
    isValidating,
    error,
  }
}
