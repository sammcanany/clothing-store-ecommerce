import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ProductGrid from '@/components/products/ProductGrid'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'

export default function ProductsPage() {
  const router = useRouter()
  const { collection_id } = router.query

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
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
            </div>
          ) : (
            <>
              {products?.length === 0 && collection_id ? (
                <div className="text-center py-12">
                  <p className="text-neutral-600">No products found in this collection.</p>
                </div>
              ) : (
                <ProductGrid products={products || []} />
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  )
}
