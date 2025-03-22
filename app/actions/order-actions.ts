"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { sendOrderStatusUpdateEmail } from "@/lib/email-service"

interface ShippingAddress {
  fullName: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

interface CartItem {
  product: {
    id: string
    price: number
    sale_price: number | null
  }
  quantity: number
}

export async function createOrder(items: CartItem[], shippingAddress: ShippingAddress, total: number) {
  const supabase = createClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: session?.user?.id || null,
          status: "pending",
          total_amount: total,
          shipping_address: shippingAddress,
        },
      ])
      .select()

    if (orderError) throw orderError

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order[0].id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.sale_price || item.product.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError

    // Set a cookie to clear the cart on the client
    cookies().set("clear_cart", "true", { maxAge: 10 })

    return { success: true, orderId: order[0].id }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "Failed to create order" }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

    if (error) throw error

    // Try to send email notification about status update
    // But don't fail if email sending fails
    try {
      await sendOrderStatusUpdateEmail(orderId, status)
    } catch (emailError) {
      console.error("Error sending email notification:", emailError)
      // Continue execution - don't fail the status update just because email failed
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error updating order status:", error)
    return { success: false, error: "Failed to update order status" }
  }
}

