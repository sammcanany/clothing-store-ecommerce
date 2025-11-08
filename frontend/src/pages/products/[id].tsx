import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ProductDetail from '@/components/products/ProductDetail'
import ProductReviews from '@/components/products/ProductReviews'
import { useProduct } from '@/lib/hooks/useProducts'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: product, isLoading } = useProduct(id as string)

  // Track recently viewed products
  useEffect(() => {
    if (product) {
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
      const filtered = recent.filter((p: any) => p.id !== product.id)
      const updated = [product, ...filtered].slice(0, 5)
      localStorage.setItem('recentlyViewed', JSON.stringify(updated))
    }
  }, [product])

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Product not found</h1>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>{product.title} - Clothing Store</title>
        <meta name="description" content={product.description || ''} />
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProductDetail product={product} />
          <ProductReviews productId={product.id} />
        </div>
      </Layout>
    </>
  )
}
