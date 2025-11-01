"use client"

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { useCart } from "@/lib/context/cart-context"
import { useState } from "react"
import { medusaClient } from "@/lib/config/medusa-client"
import { useRouter } from "next/router"

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
  const { cart, refreshCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const stripe = useStripe()
  const elements = useElements()

  async function handlePayment(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e.preventDefault()

    if (!stripe || !elements || !cart) {
      return
    }

    const card = elements.getElement(CardElement)
    if (!card) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Confirm the card payment with Stripe
      const { error: stripeError } = await stripe.confirmCardPayment(
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

      // Complete the cart/order
      const response = await medusaClient.store.cart.complete(cart.id)

      if (response.type === "cart" && response.error) {
        console.error("Cart completion error:", response.error)
        setError(response.error.message || "Order completion failed")
        setLoading(false)
        return
      }

      if (response.type === "order" && response.order) {
        // Success! Order placed
        console.log("Order placed successfully:", response.order)
        localStorage.removeItem("cart_id")
        await refreshCart()
        alert("Order placed successfully!")
        router.push("/")
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
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
      >
        {loading ? "Processing Payment..." : "Place Order"}
      </button>

      <p className="text-xs text-neutral-500 text-center">
        Test card: 4242 4242 4242 4242 | Any future date | Any 3-digit CVC
      </p>
    </div>
  )
}
