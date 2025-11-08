import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Product {
  id: string
  title: string
  thumbnail?: string
  variants: Array<{
    id: string
    calculated_price?: {
      calculated_amount: number
      currency_code: string
    }
  }>
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Load recently viewed products from localStorage
  useEffect(() => {
    if (isOpen) {
      const recent = localStorage.getItem('recentlyViewed')
      if (recent) {
        setRecentlyViewed(JSON.parse(recent).slice(0, 1)) // Show only 1 recent item
      }
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Search products
  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return []
      
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
      const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || ''
      
      const url = `${BACKEND_URL}/store/products?region_id=${REGION_ID}&fields=+variants,+variants.calculated_price&q=${encodeURIComponent(searchQuery)}`
      
      const response = await fetch(url, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data.products || []
    },
    enabled: searchQuery.length >= 2,
  })

  const handleProductClick = (product: Product) => {
    // Add to recently viewed
    const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    const filtered = recent.filter((p: Product) => p.id !== product.id)
    const updated = [product, ...filtered].slice(0, 5)
    localStorage.setItem('recentlyViewed', JSON.stringify(updated))
    
    // Navigate and close
    router.push(`/products/${product.id}`)
    onClose()
    setSearchQuery('')
  }

  const clearRecentlyViewed = () => {
    localStorage.removeItem('recentlyViewed')
    setRecentlyViewed([])
  }

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white max-w-2xl mx-auto mt-20 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-neutral-200 p-4">
          <svg 
            className="w-5 h-5 text-neutral-400 mr-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-lg"
          />
          <button 
            onClick={onClose}
            className="ml-3 text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {/* Recently Viewed */}
          {!searchQuery && recentlyViewed.length > 0 && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-neutral-700">Recently viewed</h3>
                <button 
                  onClick={clearRecentlyViewed}
                  className="text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-2">
                {recentlyViewed.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center w-full p-2 hover:bg-neutral-50 rounded-md transition-colors text-left"
                  >
                    <div className="w-16 h-16 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 mr-3">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 truncate">{product.title}</h4>
                      {product.variants[0]?.calculated_price && (
                        <p className="text-sm text-neutral-600">
                          {formatPrice(
                            product.variants[0].calculated_price.calculated_amount,
                            product.variants[0].calculated_price.currency_code
                          )}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchQuery && searchQuery.length >= 2 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Products</h3>
              {searchResults && searchResults.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {searchResults.map((product: Product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="text-left hover:opacity-75 transition-opacity"
                    >
                      <div className="aspect-square bg-neutral-100 rounded-md overflow-hidden mb-2">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-neutral-900 truncate">
                        {product.title}
                      </h4>
                      {product.variants[0]?.calculated_price && (
                        <p className="text-sm text-neutral-600">
                          {formatPrice(
                            product.variants[0].calculated_price.calculated_amount,
                            product.variants[0].calculated_price.currency_code
                          )}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 py-8 text-center">
                  No products found for "{searchQuery}"
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && recentlyViewed.length === 0 && (
            <div className="p-8 text-center">
              <svg 
                className="w-12 h-12 text-neutral-300 mx-auto mb-3" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <p className="text-neutral-500">Start typing to search products</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
