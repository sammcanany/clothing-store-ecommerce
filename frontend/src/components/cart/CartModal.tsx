import { useCart } from '@/lib/context/cart-context'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  itemJustAdded?: any
}

export default function CartModal({ isOpen, onClose, itemJustAdded }: CartModalProps) {
  const { cart } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl z-50 w-full max-w-2xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 relative">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-bold text-neutral-900">Added to Cart!</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-240px)]">
          {cart && cart.items && cart.items.length > 0 ? (
            <div className="space-y-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0">
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
                    <p className="text-sm text-neutral-600">Qty: {item.quantity}</p>
                    <p className="text-neutral-900 font-medium mt-1">
                      {formatPrice(item.unit_price * item.quantity, cart.region?.currency_code)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-600 text-center py-8">Your cart is empty</p>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items && cart.items.length > 0 && (
          <div className="border-t border-neutral-200 px-6 py-5 bg-white">
            <div className="flex justify-between items-center mb-5">
              <span className="text-xl font-bold text-neutral-900">Subtotal:</span>
              <span className="text-xl font-bold text-neutral-900">
                {formatPrice(cart.item_subtotal || 0, cart.region?.currency_code)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Link 
                href="/cart"
                onClick={onClose}
                className="py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors text-center font-medium text-neutral-900"
              >
                View Cart
              </Link>
              <button
                onClick={onClose}
                className="py-3 px-4 border-2 border-neutral-300 hover:border-neutral-400 rounded-lg transition-colors font-medium text-neutral-900"
              >
                Continue Shopping
              </button>
              <Link 
                href="/checkout"
                onClick={onClose}
                className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors text-center font-medium"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
