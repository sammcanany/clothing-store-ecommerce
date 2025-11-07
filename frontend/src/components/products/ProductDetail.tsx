import { useState } from 'react'
import Image from 'next/image'
import { useCart } from '@/lib/context/cart-context'
import { formatPrice } from '@/lib/utils/format'
import ShippingCalculator from '@/components/shipping/ShippingCalculator'

interface ProductDetailProps {
  product: any
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart()
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0])
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    if (!selectedVariant) return
    setIsAdding(true)
    try {
      await addToCart(selectedVariant.id, quantity)
      alert('Added to cart!')
    } catch (error) {
      alert('Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const calculatedPrice = selectedVariant?.calculated_price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image */}
        <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              No Image
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">{product.title}</h1>
          {product.subtitle && (
            <p className="text-lg text-neutral-600 mb-4">{product.subtitle}</p>
          )}
          {calculatedPrice && (
            <p className="text-3xl font-bold text-neutral-900 mb-6">
              {formatPrice(calculatedPrice.calculated_amount, calculatedPrice.currency_code)}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <p className="text-neutral-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Options */}
          {product.options && product.options.length > 0 && (
            <div className="mb-6">
              {product.options.map((option: any) => (
                <div key={option.id} className="mb-4">
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    {option.title}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant: any) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 border-2 rounded-md transition-colors ${
                          selectedVariant?.id === variant.id
                            ? 'border-neutral-900 bg-neutral-900 text-white'
                            : 'border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        {variant.title}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-neutral-300 rounded-md hover:bg-neutral-50"
              >
                -
              </button>
              <span className="text-lg font-medium w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-neutral-300 rounded-md hover:bg-neutral-50"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding || !selectedVariant}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>

          {/* Shipping Calculator */}
          <ShippingCalculator
            weight={(selectedVariant?.weight || product.weight || 0.5) * quantity}
            dimensions={{
              length: Number(selectedVariant?.length || product.length || 10),
              width: Number(selectedVariant?.width || product.width || 8),
              height: Number(selectedVariant?.height || product.height || 2) * quantity
            }}
          />
        </div>
      </div>
    </div>
  )
}
