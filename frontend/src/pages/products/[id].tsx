import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import ProductDetail from '@/components/products/ProductDetail'
import { useProduct } from '@/lib/hooks/useProducts'

export default function ProductPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: product, isLoading } = useProduct(id as string)

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
        <ProductDetail product={product} />
      </Layout>
    </>
  )
}
