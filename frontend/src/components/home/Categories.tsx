import Link from 'next/link'

const categories = [
  {
    name: 'T-Shirts',
    description: 'Comfortable everyday essentials',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
  },
  {
    name: 'Jeans',
    description: 'Durable denim for any occasion',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
  },
  {
    name: 'Hoodies',
    description: 'Cozy comfort meets style',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
  },
]

export default function Categories() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold text-neutral-900 mb-8">Shop by Category</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/products?category=${category.name.toLowerCase()}`}
            className="group relative overflow-hidden rounded-lg bg-neutral-100 aspect-square"
          >
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
                <p className="text-neutral-200 text-sm">{category.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
