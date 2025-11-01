import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import sgMail from "@sendgrid/mail"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  logger.info(`Order placed handler triggered for order ${data.id}`)

  // Initialize SendGrid
  logger.info("Checking SendGrid configuration...")
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL

  logger.info(`API Key exists: ${!!apiKey}, From email: ${fromEmail}`)

  if (!apiKey || !fromEmail) {
    logger.error("SendGrid API key or from email not configured")
    return
  }

  try {
    logger.info("Setting SendGrid API key...")
    sgMail.setApiKey(apiKey)
    logger.info("SendGrid API key set successfully")
  } catch (initError) {
    logger.error(`SendGrid initialization error: ${initError}`)
    return
  }

  try {
    // Retrieve the full order details using Query
    // Note: In Medusa v2, order totals are calculated dynamically and must be explicitly requested
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "items.*",
        "shipping_address.*",
        "billing_address.*"
      ],
      filters: {
        id: data.id,
      },
    })

    const order = orders[0]

    if (!order || !order.email || !order.items) {
      logger.warn("No order or email found for order notification")
      return
    }

    // Format order items for email
    const itemsList = order.items
      .map((item: any) => {
        const price = Number(item.unit_price || 0)
        const quantity = Number(item.quantity || 0)
        const total = price * quantity
        return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.product_title || item.title}
            ${item.variant_title ? `<br><small style="color: #666;">${item.variant_title}</small>` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
        </tr>
      `
      })
      .join("")

    const subtotal = Number(order.subtotal || 0)
    const shipping = Number(order.shipping_total || 0)
    const tax = Number(order.tax_total || 0)
    const total = Number(order.total || 0)

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

    // Send email notification using SendGrid directly
    const msg = {
      to: order.email,
      from: fromEmail,
      subject: `Order Confirmation - #${order.display_id}`,
      html: emailHtml,
    }

    logger.info(`Attempting to send email to: ${order.email}`)
    logger.info(`Email message prepared: ${JSON.stringify({ to: msg.to, from: msg.from, subject: msg.subject })}`)

    await sgMail.send(msg)
    logger.info(`Order confirmation email sent successfully to ${order.email} for order #${order.display_id}`)
  } catch (error: any) {
    logger.error(`Failed to send order confirmation email: ${error}`)
    logger.error(`Error message: ${error.message}`)
    logger.error(`Error stack: ${error.stack}`)
    if (error.response) {
      logger.error(`SendGrid response body: ${JSON.stringify(error.response.body, null, 2)}`)
      logger.error(`SendGrid response status: ${error.response.statusCode}`)
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
