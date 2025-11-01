import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import CheckoutForm from '@/components/checkout/CheckoutForm'

export default function CheckoutPage() {
  return (
    <>
      <Head>
        <title>Checkout - Clothing Store</title>
        <meta name="description" content="Complete your purchase" />
      </Head>
      <Layout>
        <CheckoutForm />
      </Layout>
    </>
  )
}
