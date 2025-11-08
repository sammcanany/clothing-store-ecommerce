import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import sgMail from "@sendgrid/mail"

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ token: string; actor_id: string; actor_type: string }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  logger.info(`Password reset handler triggered for customer ${data.actor_id}`)

  // Initialize SendGrid
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    logger.error("SendGrid API key or from email not configured")
    return
  }

  try {
    sgMail.setApiKey(apiKey)
  } catch (initError) {
    logger.error(`SendGrid initialization error: ${initError}`)
    return
  }

  try {
    // Get customer email using the actor_id (customer ID)
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["email", "first_name", "last_name"],
      filters: {
        id: data.actor_id,
      },
    })

    if (!customers || customers.length === 0) {
      logger.error(`Customer not found for password reset: ${data.actor_id}`)
      return
    }

    const customer = customers[0]
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${data.token}&email=${encodeURIComponent(customer.email)}`

    logger.info(`Sending password reset email to ${customer.email}`)

    // Send password reset email
    const msg = {
      to: customer.email,
      from: fromEmail,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${customer.first_name || 'Customer'},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 15 minutes for security reasons.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    }

    await sgMail.send(msg)
    logger.info(`Password reset email sent successfully to ${customer.email}`)
  } catch (error: any) {
    logger.error(`Error sending password reset email: ${error}`)
    if (error.response) {
      logger.error(`SendGrid response: ${JSON.stringify(error.response.body, null, 2)}`)
    }
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
