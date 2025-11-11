// Typed Medusa request/response imports via ambient shim declaration.
import type {
  MedusaRequest,
  MedusaResponse,
  AuthenticatedMedusaRequest,
} from "@medusajs/framework/http"

// GET /store/products/[id]/reviews
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params

  try {
    const { Client } = require("pg")
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Fetch approved reviews for this product
    const { rows: reviews } = await client.query(
      `SELECT id, product_id, customer_id, rating, title, content,
              verified_purchase, is_approved, helpful_count, created_at, updated_at
       FROM product_review
       WHERE product_id = $1 AND is_approved = true
       ORDER BY created_at DESC`,
      [id]
    )

    let reviewsWithCustomers = reviews
    try {
      // Fetch customer names in batch
      const customerIds = Array.from(new Set(reviews.map((r: any) => r.customer_id))).filter(Boolean)
      if (customerIds.length > 0) {
        const { rows: customers } = await client.query(
          `SELECT id, first_name, last_name FROM "customer" WHERE id = ANY($1::text[])`,
          [customerIds]
        )
        const customerMap = new Map<string, any>(customers.map((c: any) => [c.id, c]))
        reviewsWithCustomers = reviews.map((r: any) => {
          const c: any = customerMap.get(r.customer_id)
          const first = c?.first_name || ""
            const lastInitial = c?.last_name ? ` ${c.last_name.charAt(0)}.` : ""
          return {
            ...r,
            customer_name: c ? `${first}${lastInitial}`.trim() || "Anonymous" : "Anonymous",
          }
        })
      } else {
        reviewsWithCustomers = reviews.map((r: any) => ({ ...r, customer_name: "Anonymous" }))
      }
    } catch {
      // On any error, fallback to anonymous
      reviewsWithCustomers = reviews.map((r: any) => ({ ...r, customer_name: "Anonymous" }))
    }

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length
      : 0

    await client.end()

    res.json({
      reviews: reviewsWithCustomers,
      average_rating: Math.round(avgRating * 10) / 10,
      total_reviews: reviews.length,
    })
    return
  } catch (error) {
    // If table doesn't exist yet or any other error, return empty reviews
    res.json({
      reviews: [],
      average_rating: 0,
      total_reviews: 0,
    })
    return
  }
}

// POST /store/products/[id]/reviews
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params
  const { rating, title, content } = req.body as {
    rating: number
    title?: string
    content?: string
  }

  // Check if user is authenticated
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ error: "Authentication required" })
    return
  }

  // Validate rating
  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    res.status(400).json({ error: "Rating must be an integer between 1 and 5" })
    return
  }

  // Validate product ID format (basic sanity check)
  if (!id || typeof id !== 'string' || id.length < 1 || id.length > 255) {
    res.status(400).json({ error: "Invalid product ID" })
    return
  }

  // Validate title if provided
  if (title !== undefined && title !== null) {
    if (typeof title !== 'string') {
      res.status(400).json({ error: "Title must be a string" })
      return
    }
    if (title.length > 200) {
      res.status(400).json({ error: "Title must be 200 characters or less" })
      return
    }
  }

  // Validate content if provided
  if (content !== undefined && content !== null) {
    if (typeof content !== 'string') {
      res.status(400).json({ error: "Content must be a string" })
      return
    }
    if (content.length > 5000) {
      res.status(400).json({ error: "Review content must be 5000 characters or less" })
      return
    }
  }

  try {
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    })
    
    await client.connect()

    // Check if customer has already reviewed this product
    const { rows: existingReviews } = await client.query(
      `SELECT id FROM product_review WHERE product_id = $1 AND customer_id = $2 LIMIT 1`,
      [id, customerId]
    )

    if (existingReviews.length > 0) {
      await client.end()
      res.status(400).json({ error: "You have already reviewed this product" })
      return
    }

    // Check if customer has purchased this product (for verified purchase badge)
    let hasPurchased = false
    try {
      const { rows: orderItems } = await client.query(
        `SELECT 1 FROM "order" o
         INNER JOIN line_item li ON li.order_id = o.id
         WHERE o.customer_id = $1 AND li.product_id = $2
         LIMIT 1`,
        [customerId, id]
      )
      hasPurchased = orderItems.length > 0
    } catch {
      // If query fails (e.g., schema mismatch), assume not purchased
      hasPurchased = false
    }
    
    const reviewId = `review_${Date.now()}_${customerId.substring(0, 8)}`
    
    const result = await client.query(`
      INSERT INTO product_review (
        id, product_id, customer_id, rating, title, content, 
        verified_purchase, is_approved, helpful_count, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      reviewId,
      id,
      customerId,
      rating,
      title || null,
      content || null,
      hasPurchased,
      true, // Auto-approve
      0
    ])
    
    await client.end()
    
    res.status(201).json({
      message: "Review submitted successfully",
      review: result.rows[0],
    })
    return
  } catch (error) {
    // Log detailed error server-side only
    console.error("Error creating review:", error)
    // Return generic error to client
    res.status(500).json({ error: "Unable to submit review at this time. Please try again later." })
    return
  }
}
