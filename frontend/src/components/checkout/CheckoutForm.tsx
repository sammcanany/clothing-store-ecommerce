import { useState } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '@/lib/context/cart-context'
import { medusaClient } from '@/lib/config/medusa-client'
import { formatPrice } from '@/lib/utils/format'
import StripePayment from './StripePayment'

export default function CheckoutForm() {
  const router = useRouter()
  const { cart, refreshCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'US',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    setIsProcessing(true)

    try {
      // Add email to cart
      await medusaClient.store.cart.update(cart.id, {
        email: formData.email,
      })

      // Add shipping address
      await medusaClient.store.cart.update(cart.id, {
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country_code: formData.country.toLowerCase(),
        },
      })

      // Initialize payment session with Stripe
      await medusaClient.store.payment.initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })

      // Refresh cart to get payment session data
      await refreshCart()

      // Move to payment step
      setStep('payment')
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to proceed to payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Your cart is empty</h1>
          <p className="text-neutral-600 mb-8">Add some items before checking out</p>
          <a href="/products" className="btn-primary inline-block">
            Continue Shopping
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          {step === 'shipping' ? (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Contact Information</h2>
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-neutral-900">Payment</h2>
                  <button
                    onClick={() => setStep('shipping')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Edit Shipping
                  </button>
                </div>
                <StripePayment />
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    {item.title} x {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.quantity * (item.variant?.prices?.[0]?.amount || 0), cart.region?.currency_code)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal, cart.region?.currency_code)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>{formatPrice(cart.total, cart.region?.currency_code)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
