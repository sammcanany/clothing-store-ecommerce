import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Health check endpoint for Railway and monitoring services
 * Returns 200 OK if the service is running
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.status(200).json({
    status: "ok",
    service: "clothing-store-backend",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  })
}
