import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// DELETE /admin/reviews/:id
// Allows admins to delete a review by ID
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params

  try {
    const { Client } = require("pg")
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Delete the review
    const result = await client.query(
      `DELETE FROM product_review WHERE id = $1`,
      [id]
    )

    await client.end()

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Review not found" })
      return
    }

    res.status(204).send()
    return
  } catch (error) {
    console.error("Error deleting review:", error)
    res.status(500).json({ error: "Failed to delete review" })
    return
  }
}

// PATCH /admin/reviews/:id
// Allows admins to update review (approve/reject or edit)
export const PATCH = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params
  const { is_approved, title, content } = req.body as {
    is_approved?: boolean
    title?: string
    content?: string
  }

  try {
    const { Client } = require("pg")
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    // Build UPDATE query dynamically
    const updates: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (is_approved !== undefined) {
      updates.push(`is_approved = $${paramIndex++}`)
      params.push(is_approved)
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`)
      params.push(title)
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`)
      params.push(content)
    }

    if (updates.length === 0) {
      await client.end()
      res.status(400).json({ error: "No fields to update" })
      return
    }

    updates.push(`updated_at = NOW()`)
    params.push(id)

    const { rows } = await client.query(
      `UPDATE product_review 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    )

    await client.end()

    if (rows.length === 0) {
      res.status(404).json({ error: "Review not found" })
      return
    }

    res.json({ review: rows[0] })
    return
  } catch (error) {
    console.error("Error updating review:", error)
    res.status(500).json({ error: "Failed to update review" })
    return
  }
}

// GET /admin/reviews/:id
// Allows admins to view a single review (including unapproved ones)
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const { id } = req.params

  try {
    const { Client } = require("pg")
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()

    const { rows } = await client.query(
      `SELECT * FROM product_review WHERE id = $1`,
      [id]
    )

    await client.end()

    if (rows.length === 0) {
      res.status(404).json({ error: "Review not found" })
      return
    }

    res.json({ review: rows[0] })
    return
  } catch (error) {
    console.error("Error fetching review:", error)
    res.status(500).json({ error: "Failed to fetch review" })
    return
  }
}
