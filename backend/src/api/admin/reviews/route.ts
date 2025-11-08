import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// GET /admin/reviews
// List all reviews (including unapproved) with pagination and filtering
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { product_id, is_approved, limit = 50, offset = 0 } = req.query as {
    product_id?: string
    is_approved?: string
    limit?: number
    offset?: number
  }

  try {
    const { Client } = require("pg")
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Build WHERE clause
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (product_id) {
      conditions.push(`product_id = $${paramIndex++}`)
      params.push(product_id)
    }

    if (is_approved !== undefined) {
      conditions.push(`is_approved = $${paramIndex++}`)
      params.push(is_approved === 'true')
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get total count
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*) as total FROM product_review ${whereClause}`,
      params
    )
    const total = parseInt(countRows[0].total)

    // Get reviews
    const { rows: reviews } = await client.query(
      `SELECT pr.*, 
              c.first_name || ' ' || COALESCE(SUBSTRING(c.last_name, 1, 1) || '.', '') as customer_name
       FROM product_review pr
       LEFT JOIN customer c ON c.id = pr.customer_id
       ${whereClause}
       ORDER BY pr.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    )

    await client.end()

    res.json({
      reviews,
      count: reviews.length,
      total,
      limit,
      offset,
    })
    return
  } catch (error) {
    console.error("Error fetching reviews:", error)
    res.status(500).json({ error: "Failed to fetch reviews" })
    return
  }
}
