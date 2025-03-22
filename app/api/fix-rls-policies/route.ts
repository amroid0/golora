import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Execute SQL to fix RLS policies
    const { error } = await supabase.rpc("fix_storage_rls_policies")

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to fix RLS policies",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "RLS policies fixed successfully",
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

