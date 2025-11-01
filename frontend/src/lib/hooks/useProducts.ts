import { useQuery } from '@tanstack/react-query'
import { sdk } from '../config/medusa-client'

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
      const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || ''
      const SALES_CHANNEL_ID = process.env.NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID || ''
      
      let url = `${BACKEND_URL}/store/products?region_id=${REGION_ID}&fields=+variants,+variants.calculated_price`
      if (SALES_CHANNEL_ID) {
        url += `&sales_channel_id=${SALES_CHANNEL_ID}`
      }
      
      const response = await fetch(url, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      return data.products
    },
  })
}

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null
      
      const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
      const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
      const REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || ''
      
      const url = `${BACKEND_URL}/store/products/${id}?region_id=${REGION_ID}&fields=+variants,+variants.calculated_price`
      
      const response = await fetch(url, {
        headers: {
          'x-publishable-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      
      const data = await response.json()
      return data.product
    },
    enabled: !!id,
  })
}
