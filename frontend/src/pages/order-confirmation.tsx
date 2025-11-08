import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import { formatPrice } from '@/lib/utils/format'
import Link from 'next/link'
import { useCart } from '@/lib/context/cart-context'

export default function OrderConfirmation() {
  const router = useRouter()
  const { order_id } = router.query
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const { clearCart } = useCart()

  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return
    
    console.log("Order confirmation page loaded, checking sessionStorage...")
    
    // Get order details from sessionStorage (set before redirect)
    const orderData = sessionStorage.getItem('lastOrder')
    console.log("Order data from sessionStorage:", orderData ? "Found" : "Not found")
    
    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData)
        console.log("Parsed order:", parsedOrder)
        setOrder(parsedOrder)
        setLoading(false)
        // Clear it so it doesn't show again on refresh
        sessionStorage.removeItem('lastOrder')
        // Clear the cart now that we're on the confirmation page
        clearCart().catch(err => console.error("Failed to clear cart:", err))
      } catch (e) {
        console.error("Failed to parse order data:", e)
        setError(true)
        setLoading(false)
      }
    } else {
      // Wait a bit in case sessionStorage is being set
      setTimeout(() => {
        const retryOrderData = sessionStorage.getItem('lastOrder')
        if (retryOrderData) {
          try {
            const parsedOrder = JSON.parse(retryOrderData)
            setOrder(parsedOrder)
            setLoading(false)
            sessionStorage.removeItem('lastOrder')
            // Clear the cart now that we're on the confirmation page
            clearCart().catch(err => console.error("Failed to clear cart:", err))
          } catch (e) {
            setError(true)
            setLoading(false)
          }
        } else {
          // No order data found
          setError(true)
          setLoading(false)
        }
      }, 500)
    }
  }, [router.isReady])

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-neutral-600">Loading order details...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <p className="text-neutral-600">Order not found</p>
            <Link href="/" className="btn-primary inline-block mt-4">
              Return to Home
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-green-900">Order Confirmed!</h1>
              <p className="text-green-700 mt-1">Thank you for your purchase. A confirmation email has been sent to {order.email}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-600">Order Number</p>
              <p className="font-semibold text-neutral-900">
                {order.metadata?.custom_order_number || order.display_id || order.id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-neutral-600">Order Date</p>
              <p className="font-semibold text-neutral-900">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Shipping Address</h2>
          {order.shipping_address && (
            <div className="text-neutral-700">
              <p className="font-semibold">{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
              <p>{order.shipping_address.address_1}</p>
              {order.shipping_address.address_2 && <p>{order.shipping_address.address_2}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.country_code?.toUpperCase()}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-neutral-200 last:border-0">
                <div className="w-20 h-20 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
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
                  <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                  <p className="text-neutral-900 font-medium mt-1">
                    {formatPrice(item.unit_price * item.quantity, order.currency_code)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-neutral-700">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal || 0, order.currency_code)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping_total || 0, order.currency_code)}</span>
            </div>
            <div className="flex justify-between text-neutral-700">
              <span>Tax</span>
              <span>{formatPrice(order.tax_total || 0, order.currency_code)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-neutral-900 pt-2 border-t border-neutral-200">
              <span>Total</span>
              <span>{formatPrice(order.total || 0, order.currency_code)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </Layout>
  )
}
