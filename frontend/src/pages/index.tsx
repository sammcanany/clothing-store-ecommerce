import Head from 'next/head'
import Layout from '@/components/layout/Layout'
import Hero from '@/components/home/Hero'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import Categories from '@/components/home/Categories'

export default function Home() {
  return (
    <>
      <Head>
        <title>Clothing Store - Premium Fashion</title>
        <meta name="description" content="Discover premium quality clothing for every occasion" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Hero />
        <Categories />
        <FeaturedProducts />
      </Layout>
    </>
  )
}
