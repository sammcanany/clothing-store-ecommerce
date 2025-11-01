import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import CartView from '@/components/cart/CartView'

export default function CartPage() {
  return (
    <>
      <Head>
        <title>Shopping Cart - Clothing Store</title>
        <meta name="description" content="View your shopping cart" />
      </Head>
      <Layout>
        <CartView />
      </Layout>
    </>
  )
}
