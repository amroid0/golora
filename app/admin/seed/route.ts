import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const adminExists = existingUsers?.users.some((user) => user.email === "admin@example.com")

    if (!adminExists) {
      // Create admin user
      const { data, error } = await supabase.auth.admin.createUser({
        email: "admin@example.com",
        password: "admin123",
        email_confirm: true,
      })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        user: data.user,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user already exists",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

