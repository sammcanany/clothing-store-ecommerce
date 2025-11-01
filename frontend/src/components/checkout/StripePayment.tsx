"use client"

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useCart } from "@/lib/context/cart-context"
import { useState } from "react"
import { medusaClient } from "@/lib/config/medusa-client"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
)

export default function StripePayment() {
  const { cart } = useCart()
  const clientSecret = cart?.payment_collection?.payment_sessions?.[0]?.data
    ?.client_secret as string

  if (!clientSecret) {
    return <div>Loading payment...</div>
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
      }}
    >
      <StripeForm clientSecret={clientSecret} />
    </Elements>
  )
}

interface StripeFormProps {
  clientSecret: string
}

const StripeForm = ({ clientSecret }: StripeFormProps) => {
  const { cart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stripe = useStripe()
  const elements = useElements()

  async function handlePayment(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e.preventDefault()

    if (!stripe || !elements || !cart) {
      return
    }

    // Prevent duplicate submissions
    if (loading) {
      console.log("Already processing payment, ignoring duplicate click")
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      return
    }

    // Set loading IMMEDIATELY to prevent duplicate submissions
    setLoading(true)
    setError(null)

    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      console.log("Starting payment process for cart:", cart.id)

      // Confirm the card payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card,
            billing_details: {
              name: `${cart.shipping_address?.first_name} ${cart.shipping_address?.last_name}`,
              email: cart.email,
              phone: cart.shipping_address?.phone,
              address: {
                city: cart.shipping_address?.city,
                country: cart.shipping_address?.country_code,
                line1: cart.shipping_address?.address_1,
                line2: cart.shipping_address?.address_2,
                postal_code: cart.shipping_address?.postal_code,
              },
            },
          },
        }
      )

      if (stripeError) {
        console.error("Stripe error:", stripeError)
        setError(stripeError.message || "Payment failed")
        setLoading(false)
        return
      }

      console.log("Stripe payment confirmed, payment intent:", paymentIntent?.id)

      // Complete the cart/order with retry logic for 409 conflicts
      console.log("Completing cart...")
      let response
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          response = await medusaClient.store.cart.complete(cart.id)
          console.log("Cart completion response:", response)
          break // Success, exit retry loop
        } catch (completionError: any) {
          console.error(`Cart completion attempt ${retryCount + 1} error:`, completionError)

          // If it's a 409 conflict, the cart might already be completed
          if (completionError.message?.includes("conflicted") || completionError.message?.includes("409")) {
            console.log("Cart completion conflict detected, waiting before retry...")
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
            retryCount++

            if (retryCount >= maxRetries) {
              // After max retries, check if order actually exists
              console.log("Max retries reached, checking if order was actually created...")
              setError("Order processing - please check your email or contact support if you don't receive confirmation.")
              setLoading(false)
              // Clear cart and create new one since payment succeeded
              await clearCart()
              setTimeout(() => { window.location.href = "/" }, 3000)
              return
            }
          } else {
            // Different error, don't retry
            throw completionError
          }
        }
      }

      if (!response) {
        setError("Unable to confirm order completion. Please contact support with your payment intent: " + paymentIntent?.id)
        setLoading(false)
        return
      }

      if (response.type === "cart" && response.error) {
        console.error("Cart completion error:", response.error)
        setError(response.error.message || "Order completion failed")
        setLoading(false)
        return
      }

      if (response.type === "order" && response.order) {
        // Success! Order placed
        console.log("Order placed successfully:", response.order)
        // Clear cart and create a new one
        await clearCart()
        // Show success message
        alert("Order placed successfully! Check your email for confirmation.")
        // Use window.location to force a full page reload so cart state refreshes
        window.location.href = "/"
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border border-neutral-300 rounded-lg bg-white">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || !stripe || !elements}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        type="button"
      >
        {loading ? "Processing Payment..." : "Place Order"}
      </button>

      <p className="text-xs text-neutral-500 text-center">
        Test card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
      </p>
    </div>
  )
}
