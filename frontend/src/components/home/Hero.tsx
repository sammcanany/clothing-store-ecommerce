import Link from 'next/link'

export default function Hero() {
  return (
    <div className="relative bg-neutral-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Discover Your Style
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Premium quality clothing for every occasion. Crafted with care, designed for comfort.
          </p>
          <Link href="/products" className="btn-primary inline-block">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  )
}
