import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { medusaClient } from '../config/medusa-client'

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/store/customers/me`, {
        credentials: 'include',
        headers: {
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_01J9V1N0E0C8E1C1C1C1C1C1C1',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer)
      } else {
        setCustomer(null)
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error)
      setCustomer(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (token: string) => {
    try {
      // Store token
      localStorage.setItem('auth_token', token)

      // Create session
      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session')
      }

      // Fetch customer data
      await fetchCustomer()
      
      // Associate existing cart with logged-in customer
      const cartId = localStorage.getItem('cart_id')
      if (cartId) {
        try {
          await medusaClient.store.cart.update(cartId, {
            email: undefined, // Let it use the customer's email
          })
          console.log('Cart associated with customer')
        } catch (error) {
          console.error('Failed to associate cart with customer:', error)
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'}/auth/session`, {
        method: 'DELETE',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setCustomer(null)
    }
  }

  const refreshCustomer = async () => {
    await fetchCustomer()
  }

  // Check authentication on mount
  useEffect(() => {
    fetchCustomer()
  }, [])

  return (
    <AuthContext.Provider value={{ customer, isLoading, login, logout, refreshCustomer }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
