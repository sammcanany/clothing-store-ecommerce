import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationModuleService = container.resolve("notification")
  const orderModuleService = container.resolve("order")
  const logger = container.resolve("logger")

  try {
    // Retrieve the full order details
    const order = await orderModuleService.retrieveOrder(data.id, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"],
    })

    if (!order || !order.email || !order.items) {
      logger.warn("No order or email found for order notification")
      return
    }

    // Format order items for email
    const itemsList = order.items
      .map((item: any) => {
        const price = item.unit_price / 100 // Convert from cents
        const total = (item.unit_price * item.quantity) / 100
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.product_title || item.title}
            ${item.variant_title ? `<br><small style="color: #666;">${item.variant_title}</small>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
        </tr>
      `
      })
      .join("")

    const subtotal = Number(order.subtotal || 0) / 100
    const shipping = Number(order.shipping_total || 0) / 100
    const tax = Number(order.tax_total || 0) / 100
    const total = Number(order.total || 0) / 100

    const shippingAddress = order.shipping_address
    const shippingAddressHtml = shippingAddress ? `
      ${shippingAddress.first_name} ${shippingAddress.last_name}<br>
      ${shippingAddress.address_1}<br>
      ${shippingAddress.address_2 ? `${shippingAddress.address_2}<br>` : ''}
      ${shippingAddress.city}, ${shippingAddress.province || ''} ${shippingAddress.postal_code}<br>
      ${shippingAddress.country_code?.toUpperCase()}
    ` : 'No shipping address provided'

    // Build HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; background-color: #000000; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmation</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px 10px;">
              <p style="margin: 0; font-size: 16px; color: #333;">Thank you for your order!</p>
              <p style="margin: 10px 0 0; font-size: 24px; font-weight: bold; color: #000;">Order #${order.display_id}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #000;">Order Items</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                <thead>
                  <tr style="background-color: #f8f8f8;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold;">Item</th>
                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd; font-weight: bold;">Qty</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; font-weight: bold;">Price</th>
                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd; font-weight: bold;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemsList}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #666;">Subtotal:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: bold; width: 120px;">$${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #666;">Shipping:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: bold;">${shipping > 0 ? `$${shipping.toFixed(2)}` : 'Free'}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; text-align: right; color: #666;">Tax:</td>
                  <td style="padding: 5px 0 5px 20px; text-align: right; font-weight: bold;">$${tax.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 2px solid #000;">
                  <td style="padding: 10px 0 0; text-align: right; font-size: 18px; font-weight: bold;">Total:</td>
                  <td style="padding: 10px 0 0 20px; text-align: right; font-size: 18px; font-weight: bold;">$${total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f8f8;">
              <h3 style="margin: 0 0 10px; font-size: 16px; font-weight: bold; color: #000;">Shipping Address</h3>
              <div style="color: #333; font-size: 14px; line-height: 1.6;">${shippingAddressHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 0 0 10px;">Thank you for shopping with us!</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Send email notification using SendGrid
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: "email",
      template: "order-placed",
      data: {
        subject: `Order Confirmation - #${order.display_id}`,
        html: emailHtml,
      },
    })

    logger.info(`Order confirmation email sent to ${order.email} for order #${order.display_id}`)
  } catch (error) {
    logger.error(`Failed to send order confirmation email: ${error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
