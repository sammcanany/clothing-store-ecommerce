import { model } from "@medusajs/framework/utils"

const ProductReview = model.define("product_review", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  customer_id: model.text(),
  rating: model.number(),
  title: model.text().nullable(),
  content: model.text().nullable(),
  verified_purchase: model.boolean().default(false),
  is_approved: model.boolean().default(true), // Auto-approve by default, can be moderated later
  helpful_count: model.number().default(0),
})

export default ProductReview
