import Link from 'next/link'
import { useCart } from '@/lib/context/cart-context'

export default function Header() {
  const { cartCount } = useCart()

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-neutral-900">CLOTHING</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-neutral-600 hover:text-neutral-900 transition-colors">
              Products
            </Link>
          </nav>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <div className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neutral-900 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
