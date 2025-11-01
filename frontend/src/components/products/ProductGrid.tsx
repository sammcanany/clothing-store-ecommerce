import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils/format'

interface Product {
  id: string
  title: string
  thumbnail?: string
  variants: Array<{
    calculated_price?: {
      calculated_amount: number
      currency_code: string
    }
  }>
}

interface ProductGridProps {
  products: Product[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => {
        const calculatedPrice = product.variants?.[0]?.calculated_price
        return (
          <Link 
            key={product.id} 
            href={`/products/${product.id}`}
            className="group"
          >
            <div className="card hover:shadow-md transition-shadow duration-200">
              <div className="aspect-square bg-neutral-100 rounded-md overflow-hidden mb-4">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-neutral-600 transition-colors">
                {product.title}
              </h3>
              {calculatedPrice && (
                <p className="text-neutral-600">
                  {formatPrice(calculatedPrice.calculated_amount, calculatedPrice.currency_code)}
                </p>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
