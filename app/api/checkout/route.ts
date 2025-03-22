import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"

export async function POST(request: Request) {
  try {
    const { items, shippingAddress, totalAmount, userId } = await request.json()

    // Validate the input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required and must be an array" }, { status: 400 })
    }

    if (!totalAmount || isNaN(Number(totalAmount))) {
      return NextResponse.json({ error: "Total amount is required and must be a number" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId || null,
        status: "pending",
        total_amount: totalAmount,
        shipping_address: shippingAddress || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      size: item.selectedSize || null,
      color: item.selectedColor || null,
      created_at: new Date().toISOString(),
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
    }

    // Return success response without sending email
    return NextResponse.json({
      message: "Order created successfully",
      orderId: order.id,
    })
  } catch (error) {
    console.error("Error in checkout route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

