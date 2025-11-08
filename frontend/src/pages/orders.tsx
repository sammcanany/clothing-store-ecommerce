import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '@/components/layout/Layout'
import { useAuth } from '@/lib/context/auth-context'
import { medusaClient } from '@/lib/config/medusa-client'

interface Order {
  id: string
  display_id: number
  created_at: string
  total: number
  subtotal: number
  item_subtotal: number
  tax_total: number
  shipping_total: number
  currency_code: string
  status: string
  payment_status?: string
  fulfillment_status?: string
  summary?: {
    current_order_total: number
  }
  shipping_address?: {
    first_name?: string
    last_name?: string
    phone?: string
    address_1?: string
    address_2?: string
    city?: string
    province?: string
    postal_code?: string
    country_code?: string
  }
  shipping_methods?: {
    name?: string
    shipping_option?: {
      name: string
    }
    amount: number
  }[]
  items: {
    id: string
    title: string
    quantity: number
    unit_price: number
  }[]
}

export default function OrdersPage() {
  const { customer, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    console.log('Orders page - authLoading:', authLoading, 'customer:', !!customer)
    
    // Don't redirect if auth is still loading
    if (authLoading) {
      console.log('Orders page - waiting for auth to load')
      return
    }

    // Redirect to sign-in page if not authenticated, with return URL
    if (!customer) {
      console.log('Orders page - no customer, redirecting to signin')
      router.push('/signin?redirect=/orders')
      return
    }

    // User is authenticated, fetch orders
    console.log('Orders page - customer authenticated, fetching orders')
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, authLoading])

  const fetchOrders = async () => {
    try {
      // Must be authenticated as the customer to list their orders
      // Request all fields including shipping, tax, and address details
      const response = await medusaClient.store.order.list({
        fields: '*shipping_address,*shipping_methods,*items,+shipping_total,+tax_total,+item_subtotal,+summary'
      })
      console.log('Orders response:', response)
      console.log('First order:', response.orders?.[0])
      setOrders(response.orders || [])
    } catch (err) {
      setError('Failed to load orders')
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-neutral-100 text-neutral-800'
    }
  }

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-neutral-600">Loading...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return null
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Orders</h1>
          <p className="text-neutral-600">View and track your order history</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-neutral-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">No orders yet</h2>
            <p className="text-neutral-600 mb-6">Start shopping to see your orders here</p>
            <a
              href="/products"
              className="inline-block bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {/* Order Header */}
                <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          Order #{order.display_id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className="text-2xl font-bold text-neutral-900">
                        {formatPrice(order.total, order.currency_code)}
                      </p>
                      <svg
                        className="w-6 h-6 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {order.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900">{item.title}</h4>
                          <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-neutral-900">
                          {formatPrice(item.unit_price * item.quantity, order.currency_code)}
                        </p>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-sm text-neutral-600">
                        +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-neutral-900">
                      Order #{selectedOrder.display_id}
                    </h2>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Placed on {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-6 space-y-6">
                {/* Payment and Fulfillment Status */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">Status Details</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Payment Status</span>
                      <span className={`capitalize font-medium ${selectedOrder.payment_status === 'authorized' || selectedOrder.payment_status === 'captured' ? 'text-green-600' : 'text-amber-600'}`}>
                        {selectedOrder.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Fulfillment Status</span>
                      <span className="capitalize text-neutral-900">{selectedOrder.fulfillment_status?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-600 mb-2">Shipping Address</h3>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <p className="font-medium text-neutral-900">
                        {selectedOrder.shipping_address.first_name} {selectedOrder.shipping_address.last_name}
                      </p>
                      {selectedOrder.shipping_address.phone && (
                        <p className="text-neutral-700 mt-1">{selectedOrder.shipping_address.phone}</p>
                      )}
                      <p className="text-neutral-700 mt-1">{selectedOrder.shipping_address.address_1}</p>
                      {selectedOrder.shipping_address.address_2 && (
                        <p className="text-neutral-700">{selectedOrder.shipping_address.address_2}</p>
                      )}
                      <p className="text-neutral-700">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.province}{' '}
                        {selectedOrder.shipping_address.postal_code}
                      </p>
                      <p className="text-neutral-700">{selectedOrder.shipping_address.country_code?.toUpperCase()}</p>
                    </div>
                  </div>
                )}

                {/* Shipping Method */}
                {selectedOrder.shipping_methods && selectedOrder.shipping_methods.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-600 mb-2">Shipping Method</h3>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      {selectedOrder.shipping_methods.filter(method => method).map((method, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <p className="text-neutral-900">{method?.name || method?.shipping_option?.name || 'Standard Shipping'}</p>
                          <p className="font-medium text-neutral-900">
                            {formatPrice(method?.amount || 0, selectedOrder.currency_code)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-600 mb-2">Order Items</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900">{item.title}</h4>
                          <p className="text-sm text-neutral-600">
                            Quantity: {item.quantity} × {formatPrice(item.unit_price, selectedOrder.currency_code)}
                          </p>
                        </div>
                        <p className="font-medium text-neutral-900">
                          {formatPrice(item.unit_price * item.quantity, selectedOrder.currency_code)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-neutral-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.item_subtotal || selectedOrder.subtotal, selectedOrder.currency_code)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>Shipping</span>
                    <span>{formatPrice(selectedOrder.shipping_total || 0, selectedOrder.currency_code)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>Tax</span>
                    <span>{formatPrice(selectedOrder.tax_total || 0, selectedOrder.currency_code)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">Total</h3>
                    <p className="text-2xl font-bold text-neutral-900">
                      {formatPrice(selectedOrder.summary?.current_order_total || selectedOrder.total, selectedOrder.currency_code)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
