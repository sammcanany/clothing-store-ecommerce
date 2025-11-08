import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ProductGrid from '@/components/products/ProductGrid'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'

export default function ProductsPage() {
  const router = useRouter()
  const { collection_id } = router.query
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch products, optionally filtered by collection
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', collection_id],
    queryFn: async () => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
      const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || ''

      let url = `${BACKEND_URL}/store/products?region_id=${REGION_ID}&fields=+variants,+variants.calculated_price`

      // Add collection filter if collection_id is provided
      if (collection_id) {
        url += `&collection_id[]=${collection_id}`
      }

      const response = await fetch(url, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      return data.products
    },
  })

  // Fetch collection details if collection_id is provided
  const { data: collection } = useQuery({
    queryKey: ['collection', collection_id],
    queryFn: async () => {
      if (!collection_id) return null

      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

      const response = await fetch(`${BACKEND_URL}/store/collections/${collection_id}`, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.collection
    },
    enabled: !!collection_id,
  })

  // Fetch all collections for filter
  const { data: collections } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

      const response = await fetch(`${BACKEND_URL}/store/collections`, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.collections
    },
  })

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return []
    
    let filtered = [...products]

    // Filter by price range
    filtered = filtered.filter(product => {
      const price = product.variants?.[0]?.calculated_price?.calculated_amount || 0
      const priceInDollars = price / 100
      return priceInDollars >= priceRange[0] && priceInDollars <= priceRange[1]
    })

    // Sort products
    filtered.sort((a, b) => {
      const priceA = a.variants?.[0]?.calculated_price?.calculated_amount || 0
      const priceB = b.variants?.[0]?.calculated_price?.calculated_amount || 0

      switch (sortBy) {
        case 'price-low':
          return priceA - priceB
        case 'price-high':
          return priceB - priceA
        case 'name-az':
          return a.title.localeCompare(b.title)
        case 'name-za':
          return b.title.localeCompare(a.title)
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return filtered
  }, [products, sortBy, priceRange])

  const pageTitle = collection
    ? `${collection.title} - Clothing Store`
    : 'All Products - Clothing Store'

  const heading = collection?.title || 'All Products'

  const description = collection
    ? `Browse our ${collection.title} collection`
    : 'Discover our complete collection'

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">{heading}</h1>
            <p className="text-neutral-600">{description}</p>
            {collection_id && (
              <button
                onClick={() => router.push('/products')}
                className="mt-4 text-neutral-600 hover:text-neutral-900 underline"
              >
                ← Back to all products
              </button>
            )}
          </div>

          {/* Filters and Sorting Bar */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            {/* Desktop Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} sm:flex flex-col sm:flex-row gap-4 w-full sm:w-auto`}>
              {/* Collection Filter */}
              {collections && collections.length > 0 && !collection_id && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        router.push(`/products?collection_id=${e.target.value}`)
                      }
                    }}
                    className="appearance-none px-4 py-2 pr-10 border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
                  >
                    <option value="">All Collections</option>
                    {collections.map((col: any) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                </div>
              )}

              {/* Price Range Filter - Hidden for now (small product catalog) */}
              {/* <div className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg bg-white">
                <span className="text-sm text-neutral-600">Price:</span>
                <input
                  type="number"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  className="w-16 px-2 py-1 border border-neutral-200 rounded text-sm"
                  min="0"
                />
                <span className="text-neutral-400">-</span>
                <input
                  type="number"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                  className="w-16 px-2 py-1 border border-neutral-200 rounded text-sm"
                  min="0"
                />
              </div> */}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-neutral-300 rounded-lg hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A-Z</option>
                <option value="name-za">Name: Z-A</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
            </div>
          </div>

          {/* Results Count */}
          {!isLoading && filteredAndSortedProducts && (
            <div className="mb-4 text-sm text-neutral-600">
              Showing {filteredAndSortedProducts.length} {filteredAndSortedProducts.length === 1 ? 'product' : 'products'}
            </div>
          )}

          {/* Products Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
            </div>
          ) : (
            <>
              {filteredAndSortedProducts?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600">No products found matching your filters.</p>
                  <button
                    onClick={() => {
                      setPriceRange([0, 1000])
                      setSortBy('newest')
                      if (collection_id) {
                        router.push('/products')
                      }
                    }}
                    className="mt-4 text-neutral-900 hover:underline font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <ProductGrid products={filteredAndSortedProducts} />
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  )
}

