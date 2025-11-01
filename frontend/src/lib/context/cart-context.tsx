import React, { createContext, useContext, useState, useEffect } from 'react'
import { sdk } from '../config/medusa-client'

interface CartContextType {
  cart: any
  addToCart: (variantId: string, quantity: number) => Promise<void>
  updateQuantity: (lineId: string, quantity: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
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
          const response = await sdk.store.cart.retrieve(cartId, {
            fields: 'id,region,currency_code,items.id,items.quantity,items.subtotal,items.total,items.variant.id,items.variant.prices.amount,items.variant.prices.currency_code'
          })
          setCart(response.cart)
        } catch (error) {
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
        }, {
          fields: 'id,region,currency_code,items.id,items.quantity,items.subtotal,items.total,items.variant.id,items.variant.prices.amount,items.variant.prices.currency_code'
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
    if (!cart) return

    const response = await sdk.store.cart.createLineItem(cart.id, {
      variant_id: variantId,
      quantity,
    })
    setCart(response.cart)
  }

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cart) return

    const response = await sdk.store.cart.updateLineItem(cart.id, lineId, {
      quantity,
    })
    setCart(response.cart)
  }

  const removeFromCart = async (lineId: string) => {
    if (!cart) return

    const response = await sdk.store.cart.deleteLineItem(cart.id, lineId)
    setCart(response)
  }

  const cartCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, cartCount }}>
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
