import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/lib/context/cart-context'
import SearchModal from '@/components/search/SearchModal'
import AccountModal from '@/components/account/AccountModal'
import SignInModal from '@/components/auth/SignInModal'

export default function Header() {
  const { cartCount } = useCart()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-neutral-600 hover:text-neutral-900 transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

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

            {/* Actions */}
            <div className="flex items-center space-x-6">
              {/* Search Icon - Always visible */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center"
                aria-label="Search"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Account Icon - Desktop only with relative wrapper */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors flex items-center"
                  aria-label="Account"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {/* Invisible overlay to close modal when clicking outside on desktop */}
                {isAccountOpen && (
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAccountOpen(false)}
                  />
                )}

                {/* Desktop AccountModal positioned relative to this container */}
                <AccountModal 
                  isOpen={isAccountOpen} 
                  onClose={() => setIsAccountOpen(false)}
                  onSignInClick={() => {
                    setIsAccountOpen(false)
                    setIsSignInOpen(true)
                  }}
                />
              </div>

              {/* Cart - Always visible */}
              <Link href="/cart" className="relative flex items-center">
                <svg className="w-6 h-6 text-neutral-600 hover:text-neutral-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-neutral-900 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <nav className="px-4 py-4 space-y-3">
              <Link 
                href="/" 
                className="block text-neutral-600 hover:text-neutral-900 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/products" 
                className="block text-neutral-600 hover:text-neutral-900 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>
              <button
                onClick={() => {
                  setIsAccountOpen(true)
                  setIsMobileMenuOpen(false)
                }}
                className="block w-full text-left text-neutral-600 hover:text-neutral-900 transition-colors py-2"
              >
                Account
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Account Modal - Mobile version (full screen) */}
      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)}
        onSignInClick={() => {
          setIsAccountOpen(false)
          setIsSignInOpen(true)
        }}
      />

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Sign In Modal */}
      <SignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
    </>
  )
}
