import { useProducts } from '@/lib/hooks/useProducts'
import ProductGrid from '../products/ProductGrid'

export default function FeaturedProducts() {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      </div>
    )
  }

  const featuredProducts = products?.slice(0, 3) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-neutral-900">Featured Products</h2>
        <a href="/products" className="text-neutral-600 hover:text-neutral-900 font-medium">
          View All →
        </a>
      </div>
      <ProductGrid products={featuredProducts} />
    </div>
  )
}
