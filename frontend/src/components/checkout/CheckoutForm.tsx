import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useCart } from '@/lib/context/cart-context'
import { medusaClient } from '@/lib/config/medusa-client'
import { formatPrice } from '@/lib/utils/format'
import { useAddressValidation } from '@/lib/hooks/useAddressValidation'
import StripePayment from './StripePayment'

export default function CheckoutForm() {
  const router = useRouter()
  const { cart, refreshCart } = useCart()
  const { validateAddress, isValidating, error: validationError } = useAddressValidation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'shipping' | 'shipping-method' | 'payment'>('shipping')
  const [addressSuggestion, setAddressSuggestion] = useState<any>(null)
  const [availableShippingOptions, setAvailableShippingOptions] = useState<any[]>([])
  const [selectedShippingOption, setSelectedShippingOption] = useState<string | null>(null)
  const [shippingOptionPrices, setShippingOptionPrices] = useState<Record<string, number>>({})
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const userAcceptedAddressRef = useRef(false)
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })

  const [billingData, setBillingData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  })

  const [billingIsSameAsShipping, setBillingIsSameAsShipping] = useState(true)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Reset the flag when user manually edits address fields
    if (['address', 'city', 'state', 'postalCode'].includes(name)) {
      userAcceptedAddressRef.current = false
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Auto-validate address when user stops typing
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Don't re-validate if user already accepted verified address
    if (userAcceptedAddressRef.current) {
      return
    }

    // Only validate if we have the required fields
    const hasRequiredFields = formData.address && formData.city && formData.state && formData.postalCode
    
    if (!hasRequiredFields) {
      setValidationStatus('idle')
      setShowSuggestion(false)
      return
    }

    // Start new timer - validate after 1.5 seconds of no typing
    debounceTimerRef.current = setTimeout(async () => {
      setValidationStatus('validating')
      try {
        const validated = await validateAddress({
          streetAddress: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.postalCode,
        })
        
        if (validated) {
          console.log('Validated address response:', validated)
          setAddressSuggestion(validated)
          setValidationStatus('valid')
          setShowSuggestion(true)
        } else {
          setValidationStatus('invalid')
        }
      } catch (error) {
        setValidationStatus('invalid')
      }
    }, 1500)

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [formData.address, formData.city, formData.state, formData.postalCode])

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart) return

    setIsProcessing(true)

    try {
      console.log('=== UPDATING CART ===')
      console.log('Form data:', formData)
      
      // Add email and shipping address in one call
      const updateData = {
        email: formData.email,
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          province: formData.state,
          postal_code: formData.postalCode,
          country_code: formData.country.toLowerCase(),
        },
      }
      
      console.log('Update payload:', updateData)
      
      const updatedCartResponse = await medusaClient.store.cart.update(cart.id, updateData)
      const updatedCart = updatedCartResponse.cart
      console.log('Updated cart response:', updatedCart)

      // Refresh cart context for other components
      await refreshCart()

      // Get available shipping options with pricing
      // Use the cart's listShippingOptions method which fetches available options with pricing
      const shippingOptionsResp = await medusaClient.store.fulfillment.listCartOptions({ cart_id: updatedCart.id })

      console.log('=== SHIPPING OPTIONS DEBUG ===')
      console.log('Cart ID:', updatedCart.id)
      console.log('Cart region:', updatedCart.region)
      console.log('Shipping address:', updatedCart.shipping_address)
      console.log('Full response:', shippingOptionsResp)
      console.log('Shipping options array:', shippingOptionsResp.shipping_options)
      console.log('Number of options:', shippingOptionsResp.shipping_options?.length || 0)

      if (shippingOptionsResp.shipping_options && shippingOptionsResp.shipping_options.length > 0) {
        // Calculate prices for each shipping option by temporarily adding them
        // Use sequential processing with delay to avoid lock contention
        const optionsWithPrices = []
        for (const option of shippingOptionsResp.shipping_options) {
          // Skip options without mailClass data (old USPS Ground Shipping method)
          if (!option.data?.mailClass) {
            console.log(`Skipping ${option.name} - no mailClass configured`)
            optionsWithPrices.push({
              ...option,
              calculated_amount: null,
            })
            continue
          }
          
          try {
            // Temporarily add this shipping method to get the calculated price
            const tempCart = await medusaClient.store.cart.addShippingMethod(updatedCart.id, {
              option_id: option.id,
            })
            
            // Get the calculated price from the cart
            const shippingMethod = tempCart.cart.shipping_methods?.find(
              (m: any) => m.shipping_option_id === option.id
            )
            
            console.log(`Calculated price for ${option.name}: ${shippingMethod?.amount}`)
            
            optionsWithPrices.push({
              ...option,
              calculated_amount: shippingMethod?.amount || 0,
            })
            
            // Small delay to avoid lock contention
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            console.error(`Failed to calculate price for ${option.name}:`, error)
            optionsWithPrices.push({
              ...option,
              calculated_amount: null,
            })
          }
        }
        
        setAvailableShippingOptions(optionsWithPrices)
        
        // Populate the prices map for the Order Summary
        const pricesMap: Record<string, number> = {}
        optionsWithPrices.forEach(option => {
          if (option.calculated_amount != null) {
            pricesMap[option.id] = option.calculated_amount
          }
        })
        setShippingOptionPrices(pricesMap)
        
        setStep('shipping-method')
      } else {
        console.warn('No shipping options available! You need to create a shipping option in Medusa Admin.')
        alert('No shipping options available. Please check your location configuration.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to proceed to payment. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleShippingMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShippingOption) {
      alert('Please select a shipping method')
      return
    }

    setIsProcessing(true)
    try {
      // Add selected shipping method to cart
      await medusaClient.store.cart.addShippingMethod(cart.id, {
        option_id: selectedShippingOption,
      })

      await refreshCart()

      // Initialize payment session with Stripe
      await medusaClient.store.payment.initiatePaymentSession(cart, {
        provider_id: "pp_stripe_stripe",
      })

      // Refresh cart to get payment session data
      await refreshCart()

      // Move to payment step
      setStep('payment')
    } catch (error) {
      console.error('Shipping method error:', error)
      alert('Failed to add shipping method. Please try again.')
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
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      required
                      maxLength={2}
                      value={formData.state}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    ZIP Code
                    {validationStatus === 'validating' && (
                      <span className="ml-2 text-sm text-gray-500">Validating...</span>
                    )}
                    {validationStatus === 'valid' && (
                      <span className="ml-2 text-sm text-green-600">✓ Verified</span>
                    )}
                    {validationStatus === 'invalid' && (
                      <span className="ml-2 text-sm text-red-600">Could not verify</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    maxLength={5}
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {validationError}
                  </div>
                )}

                {showSuggestion && addressSuggestion && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-green-900">✓ Verified Address</h4>
                      <button
                        type="button"
                        onClick={() => setShowSuggestion(false)}
                        className="text-green-700 hover:text-green-900"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="text-sm mb-4 space-y-2">
                      {formData.address.toUpperCase() !== addressSuggestion.address.address.streetAddress && (
                        <div>
                          <span className="text-neutral-600">Address: </span>
                          <span className="line-through text-red-600">{formData.address}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium text-green-800">{addressSuggestion.address.address.streetAddress}</span>
                        </div>
                      )}
                      {formData.city.toUpperCase() !== addressSuggestion.address.address.city && (
                        <div>
                          <span className="text-neutral-600">City: </span>
                          <span className="line-through text-red-600">{formData.city}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium text-green-800">{addressSuggestion.address.address.city}</span>
                        </div>
                      )}
                      {formData.postalCode !== addressSuggestion.address.address.ZIPCode && (
                        <div>
                          <span className="text-neutral-600">ZIP: </span>
                          <span className="line-through text-red-600">{formData.postalCode}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium text-green-800">
                            {addressSuggestion.address.address.ZIPCode}
                          </span>
                        </div>
                      )}
                      {formData.address.toUpperCase() === addressSuggestion.address.address.streetAddress && 
                       formData.city.toUpperCase() === addressSuggestion.address.address.city && 
                       formData.postalCode === addressSuggestion.address.address.ZIPCode && (
                        <div className="text-green-800">
                          Address is correct as entered.
                        </div>
                      )}
                    </div>
                    
                    {/* Only show button if there are differences */}
                    {(formData.address.toUpperCase() !== addressSuggestion.address.address.streetAddress ||
                      formData.city.toUpperCase() !== addressSuggestion.address.address.city ||
                      formData.postalCode !== addressSuggestion.address.address.ZIPCode) && (
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Using verified address:', addressSuggestion)
                        // Only use ZIP-5, not ZIP+4
                        const newZip = addressSuggestion.address.address.ZIPCode || formData.postalCode
                        
                        setFormData(prev => ({
                          ...prev,
                          address: addressSuggestion.address.address.streetAddress || prev.address,
                          city: addressSuggestion.address.address.city || prev.city,
                          state: addressSuggestion.address.address.state || prev.state,
                          postalCode: newZip,
                        }))
                        setAddressSuggestion(null)
                        setValidationStatus('valid')
                        userAcceptedAddressRef.current = true
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
                    >
                      Use Verified Address
                    </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Billing Address Section */}
            <div className="card">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Billing Address</h2>
              
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingIsSameAsShipping}
                    onChange={(e) => setBillingIsSameAsShipping(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-neutral-700">Same as shipping address</span>
                </label>
              </div>

              {!billingIsSameAsShipping && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={billingData.firstName}
                        onChange={(e) => setBillingData({...billingData, firstName: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={billingData.lastName}
                        onChange={(e) => setBillingData({...billingData, lastName: e.target.value})}
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
                      required
                      value={billingData.address}
                      onChange={(e) => setBillingData({...billingData, address: e.target.value})}
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
                        required
                        value={billingData.city}
                        onChange={(e) => setBillingData({...billingData, city: e.target.value})}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-900 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={billingData.state}
                        onChange={(e) => setBillingData({...billingData, state: e.target.value.toUpperCase()})}
                        className="input-field"
                        placeholder="CA"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={billingData.postalCode}
                      onChange={(e) => setBillingData({...billingData, postalCode: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
              )}
            </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Continue to Shipping Method'}
              </button>
            </form>
          ) : step === 'shipping-method' ? (
            <form onSubmit={handleShippingMethodSubmit} className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-neutral-900">Select Shipping Method</h2>
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Edit Address
                  </button>
                </div>

                <div className="space-y-3">
                  {availableShippingOptions.map((option: any) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedShippingOption === option.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="shippingOption"
                          value={option.id}
                          checked={selectedShippingOption === option.id}
                          onChange={(e) => setSelectedShippingOption(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-neutral-900">{option.name}</div>
                          {option.data?.description && (
                            <div className="text-sm text-neutral-600">{option.data.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-neutral-900">
                        {option.calculated_amount != null 
                          ? formatPrice(option.calculated_amount, cart.region?.currency_code)
                          : option.calculated_price?.calculated_amount != null 
                          ? formatPrice(option.calculated_price.calculated_amount, cart.region?.currency_code)
                          : option.amount != null
                          ? formatPrice(option.amount, cart.region?.currency_code)
                          : 'Calculated'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !selectedShippingOption}
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
                    onClick={() => setStep('shipping-method')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Edit Shipping Method
                  </button>
                </div>
                <StripePayment 
                  billingAddress={billingIsSameAsShipping ? formData : billingData}
                />
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
                    {formatPrice(item.unit_price * item.quantity, cart.region?.currency_code)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.item_subtotal || 0, cart.region?.currency_code)}</span>
              </div>
              
              {step !== 'shipping' && (
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>
                    {selectedShippingOption && shippingOptionPrices[selectedShippingOption] != null
                      ? formatPrice(shippingOptionPrices[selectedShippingOption], cart.region?.currency_code)
                      : '$--.--'}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>
                  {step !== 'shipping' && selectedShippingOption && shippingOptionPrices[selectedShippingOption] != null
                    ? formatPrice((cart.item_total || 0) + shippingOptionPrices[selectedShippingOption], cart.region?.currency_code)
                    : formatPrice(cart.item_total || 0, cart.region?.currency_code)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
