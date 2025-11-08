import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"

export default async function orderNumberGenerator({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    logger.info(`Generating custom order number for order ${data.id}`)

    // Generate a custom order number format
    // Format: Current timestamp + random 4 digits (e.g., 17310234561234)
    const timestamp = Date.now()
    const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
    const customOrderNumber = parseInt(timestamp.toString() + random.toString())
    
    // Alternative format options you can use instead:
    // 
    // 1. Date-based with random: YYYYMMDD-XXXX (e.g., 20251107-8432)
    // const date = new Date()
    // const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    // const customOrderNumber = parseInt(dateStr + random)
    
    // 2. Shorter format: 6-digit random (e.g., 384729)
    // const customOrderNumber = Math.floor(100000 + Math.random() * 900000)

    // Update the order using the Order Module Service
    const orderModuleService = container.resolve("order")
    
    await orderModuleService.updateOrders(data.id, {
      metadata: {
        custom_order_number: customOrderNumber.toString(),
      },
    })

    logger.info(`Custom order number generated for order ${data.id}: ${customOrderNumber}`)
  } catch (error) {
    logger.error(`Failed to generate custom order number for order ${data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
