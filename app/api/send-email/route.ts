import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { orderId, status, email } = await request.json()

    if (!orderId || !status || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // In a real application, you would use a service like SendGrid, Mailgun, etc.
    // For this example, we'll just log the email that would be sent
    console.log(`Sending email to ${email} about order ${orderId} status update to ${status}`)

    // Simulate email sending
    const emailContent = {
      to: email,
      subject: `Order Status Update - ${orderId}`,
      body: `
        <h1>Your Order Status Has Been Updated</h1>
        <p>Dear Customer,</p>
        <p>Your order (ID: ${orderId}) has been updated to: <strong>${status}</strong>.</p>
        <p>You can view your order details by logging into your account.</p>
        <p>Thank you for shopping with us!</p>
      `,
    }

    // Log the email content
    console.log("Email content:", emailContent)

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending email notification:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send email notification",
      },
      { status: 500 },
    )
  }
}

