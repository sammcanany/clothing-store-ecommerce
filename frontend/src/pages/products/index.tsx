import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ProductGrid from '@/components/products/ProductGrid'
import { useProducts } from '@/lib/hooks/useProducts'

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts()

  return (
    <>
      <Head>
        <title>All Products - Clothing Store</title>
        <meta name="description" content="Browse our complete collection" />
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">All Products</h1>
            <p className="text-neutral-600">Discover our complete collection</p>
          </div>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
            </div>
          ) : (
            <ProductGrid products={products || []} />
          )}
        </div>
      </Layout>
    </>
  )
}
