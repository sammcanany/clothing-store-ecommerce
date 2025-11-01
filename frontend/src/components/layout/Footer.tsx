import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 mb-4">CLOTHING</h3>
            <p className="text-neutral-600 text-sm">Premium quality clothing for every occasion.</p>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="text-neutral-600 hover:text-neutral-900">All Products</Link></li>
              <li><Link href="/products?category=men" className="text-neutral-600 hover:text-neutral-900">Men</Link></li>
              <li><Link href="/products?category=women" className="text-neutral-600 hover:text-neutral-900">Women</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shipping" className="text-neutral-600 hover:text-neutral-900">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-neutral-600 hover:text-neutral-900">Returns</Link></li>
              <li><Link href="/contact" className="text-neutral-600 hover:text-neutral-900">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-neutral-900 mb-4">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-600 hover:text-neutral-900">
                <span className="sr-only">Instagram</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-600 hover:text-neutral-900">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-200 text-center text-sm text-neutral-600">
          <p>&copy; {new Date().getFullYear()} Clothing Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
