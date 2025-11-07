import React, { useState } from 'react'
import { useShippingCalculator, ShippingRate } from '@/lib/hooks/useShippingCalculator'

interface ShippingCalculatorProps {
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
  className?: string
}

export default function ShippingCalculator({ items, weight, dimensions, className = '' }: ShippingCalculatorProps) {
  const [zipCode, setZipCode] = useState('')
  const { calculateRates, isCalculating, error, rates } = useShippingCalculator()

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    await calculateRates({
      destinationZip: zipCode,
      items,
      weight,
      dimensions,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className={`border rounded-lg p-4 bg-white ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Estimate Shipping</h3>
      
      <form onSubmit={handleCalculate} className="space-y-3">
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            Enter ZIP Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="12345"
              maxLength={5}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isCalculating || zipCode.length !== 5}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </form>

      {rates.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Available Shipping Options:</h4>
          <div className="space-y-2">
            {rates.map((rate: ShippingRate) => (
              <div
                key={rate.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
              >
                <div>
                  <div className="font-medium text-gray-900">{rate.name}</div>
                  <div className="text-sm text-gray-500">{rate.deliveryDays}</div>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPrice(rate.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rates.length === 0 && !error && !isCalculating && zipCode.length === 5 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          Click "Calculate" to see shipping rates
        </div>
      )}
    </div>
  )
}
