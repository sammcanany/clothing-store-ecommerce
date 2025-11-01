import Link from 'next/link'
import { useCart } from '@/lib/context/cart-context'
import { formatPrice } from '@/lib/utils/format'

export default function CartView() {
  const { cart, updateQuantity, removeFromCart } = useCart()

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Your Cart is Empty</h1>
          <p className="text-neutral-600 mb-8">Add some items to get started!</p>
          <Link href="/products" className="btn-primary inline-block">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = cart.subtotal || 0
  const total = cart.total || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {cart.items.map((item: any) => (
              <div key={item.id} className="card flex gap-4">
                <div className="w-24 h-24 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                  <p className="text-sm text-neutral-600">{item.variant?.title}</p>
                  <p className="text-neutral-900 font-medium mt-2">
                    {formatPrice(item.unit_price, cart.region?.currency_code)}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-8 h-8 border border-neutral-300 rounded-md hover:bg-neutral-50 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border border-neutral-300 rounded-md hover:bg-neutral-50 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Summary</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, cart.region?.currency_code)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total, cart.region?.currency_code)}</span>
              </div>
            </div>

            <Link href="/checkout" className="btn-primary w-full text-center block">
              Proceed to Checkout
            </Link>
            
            <Link href="/products" className="btn-secondary w-full text-center block mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
