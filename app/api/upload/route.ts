import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    // Upload the file
    const { error: uploadError, data } = await supabase.storage.from("products").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      path: filePath,
      success: true,
    })
  } catch (error: any) {
    console.error("Error in upload API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

