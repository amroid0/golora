import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Create the function to set up storage policies
    const { error } = await supabase.rpc("create_storage_policy_setup_function")

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to create function",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Storage policy setup function created",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Operation failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

