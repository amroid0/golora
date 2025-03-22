import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/database.types"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { status } = await request.json()

    // Validate the input
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Update the order status
    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating order status:", error)
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
    }

    // Return success response without sending email
    return NextResponse.json({
      message: "Order status updated successfully",
      order: data,
    })
  } catch (error) {
    console.error("Error in update-status route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

