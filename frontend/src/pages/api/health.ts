import type { NextApiRequest, NextApiResponse } from 'next'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
  uptime: number
  environment: string
}

/**
 * Health check endpoint for Railway and monitoring services
 * Returns 200 OK if the service is running
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  res.status(200).json({
    status: 'ok',
    service: 'clothing-store-frontend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
}
