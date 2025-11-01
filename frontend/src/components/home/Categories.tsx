import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

// Fallback images for collections
const defaultImages: { [key: string]: string } = {
  't-shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
  'jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
  'hoodies': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
}

export default function Categories() {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

      const response = await fetch(`${BACKEND_URL}/store/collections`, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch collections')
      }

      const data = await response.json()
      return data.collections
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-neutral-900 mb-8">Shop by Collection</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      </div>
    )
  }

  if (!collections || collections.length === 0) {
    return null // Don't show section if no collections
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-neutral-900 mb-8">Shop by Collection</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {collections.slice(0, 3).map((collection: any) => {
          // Use collection handle to find matching default image
          const imageUrl = defaultImages[collection.handle] || defaultImages['t-shirts']

          return (
            <Link
              key={collection.id}
              href={`/products?collection_id=${collection.id}`}
              className="group relative overflow-hidden rounded-lg bg-neutral-100 aspect-square"
            >
              <img
                src={imageUrl}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <h3 className="text-2xl font-bold mb-1">{collection.title}</h3>
                  {collection.metadata?.description && (
                    <p className="text-neutral-200 text-sm">{collection.metadata.description}</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
