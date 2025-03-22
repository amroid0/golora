import { createClient } from "@/lib/supabase/server"

interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail(data: EmailData) {
  try {
    // In a real application, you would integrate with an email service like SendGrid, Mailgun, etc.
    // For this example, we'll just log the email data
    console.log("Sending email:", data)

    // Return success
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}

export async function sendOrderStatusUpdateEmail(orderId: string, newStatus: string) {
  const supabase = createClient()

  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, user_id, shipping_address")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      console.log("Order not found:", orderError?.message)
      return { success: false, error: orderError || new Error("Order not found") }
    }

    // Try to get email from different sources
    let userEmail = null

    // First try: If order has shipping_address with email
    if (order.shipping_address && order.shipping_address.email) {
      userEmail = order.shipping_address.email
      console.log("Using email from shipping address:", userEmail)
    }
    // Second try: If order has user_id, try to get user email
    else if (order.user_id) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id)

        if (!userError && userData?.user?.email) {
          userEmail = userData.user.email
          console.log("Using email from user account:", userEmail)
        } else {
          console.log("Could not get user email from auth:", userError?.message)
        }
      } catch (error) {
        console.log("Error accessing user data:", error)
        // Continue execution - we'll check if we have an email below
      }
    }

    // If we couldn't find an email, log it but don't throw an error
    if (!userEmail) {
      console.log("No email found for order:", orderId)
      return { success: false, message: "No email address available for notification" }
    }

    // Create email content based on status
    const subject = `Order #${orderId.substring(0, 8)} Status Update`
    let statusText = ""
    let additionalInfo = ""

    switch (newStatus) {
      case "processing":
        statusText = "Your order is now being processed"
        additionalInfo = "We're preparing your items for shipment."
        break
      case "shipped":
        statusText = "Your order has been shipped"
        additionalInfo = "Your order is on its way to you!"
        break
      case "delivered":
        statusText = "Your order has been delivered"
        additionalInfo = "We hope you enjoy your purchase!"
        break
      case "completed":
        statusText = "Your order is now complete"
        additionalInfo = "Thank you for shopping with us!"
        break
      default:
        statusText = `Your order status has been updated to: ${newStatus}`
        additionalInfo = "Check your account for more details."
    }

    // Create HTML email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Hello,</p>
        <p><strong>${statusText}</strong></p>
        <p>${additionalInfo}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f7f7f7; border-radius: 5px;">
          <p style="margin: 0;"><strong>Order ID:</strong> #${orderId.substring(0, 8)}</p>
          <p style="margin: 10px 0 0;"><strong>New Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
        </div>
        <p>You can view your order details by visiting your account page.</p>
        <p>Thank you for shopping with us!</p>
      </div>
    `

    // Send the email
    return await sendEmail({
      to: userEmail,
      subject,
      html,
    })
  } catch (error) {
    console.error("Error sending order status update email:", error)
    return { success: false, error }
  }
}

