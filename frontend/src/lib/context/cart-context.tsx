import React, { createContext, useContext, useState, useEffect } from 'react'
import { sdk } from '../config/medusa-client'

interface CartContextType {
  cart: any
  addToCart: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (lineId: string, quantity: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
  refreshCart: () => Promise<void>
  clearCart: () => Promise<void>
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<any>(null)

  useEffect(() => {
    const initCart = async () => {
      const cartId = localStorage.getItem('cart_id')

      if (cartId) {
        try {
          console.log('Retrieving cart:', cartId)
          const response = await sdk.store.cart.retrieve(cartId)
          console.log('Cart retrieved:', response.cart)
          setCart(response.cart)
        } catch (error) {
          console.error('Error retrieving cart:', error)
          localStorage.removeItem('cart_id')
          createNewCart()
        }
      } else {
        createNewCart()
      }
    }

    const createNewCart = async () => {
      try {
        // Get the first available region
        const regionsResponse = await sdk.store.region.list()
        const regionId = regionsResponse.regions?.[0]?.id

        if (!regionId) {
          console.error('No regions available')
          return
        }

        const response = await sdk.store.cart.create({
          region_id: regionId
        })
        localStorage.setItem('cart_id', response.cart.id)
        setCart(response.cart)
      } catch (error) {
        console.error('Error creating cart:', error)
      }
    }

    initCart()
  }, [])

  const addToCart = async (variantId: string, quantity: number) => {
    // Always use cart_id from localStorage to ensure we're using the latest cart
    const cartId = localStorage.getItem('cart_id')
    if (!cartId) {
      console.error('No cart ID found')
      return
    }

    const response = await sdk.store.cart.createLineItem(cartId, {
      variant_id: variantId,
      quantity,
    })
    setCart(response.cart)
  }

  const updateQuantity = async (lineId: string, quantity: number) => {
    const cartId = localStorage.getItem('cart_id')
    if (!cartId) return

    const response = await sdk.store.cart.updateLineItem(cartId, lineId, {
      quantity,
    })
    setCart(response.cart)
  }

  const removeFromCart = async (lineId: string) => {
    const cartId = localStorage.getItem('cart_id')
    if (!cartId) return

    const response = await sdk.store.cart.deleteLineItem(cartId, lineId)
    setCart(response.cart)
  }

  const refreshCart = async () => {
    const cartId = localStorage.getItem('cart_id')
    if (cartId) {
      try {
        const response = await sdk.store.cart.retrieve(cartId)
        setCart(response.cart)
      } catch (error) {
        console.error('Error refreshing cart:', error)
        localStorage.removeItem('cart_id')
        setCart(null)
      }
    }
  }

  const clearCart = async () => {
    // Clear cart from localStorage and state
    localStorage.removeItem('cart_id')
    setCart(null)

    // Create a new cart immediately
    try {
      const regionsResponse = await sdk.store.region.list()
      const regionId = regionsResponse.regions?.[0]?.id

      if (!regionId) {
        console.error('No regions available')
        return
      }

      const response = await sdk.store.cart.create({
        region_id: regionId
      })
      localStorage.setItem('cart_id', response.cart.id)
      setCart(response.cart)
      console.log('New cart created after order:', response.cart.id)
    } catch (error) {
      console.error('Error creating new cart:', error)
    }
  }

  const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, refreshCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
