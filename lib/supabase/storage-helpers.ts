import { createClient } from "@/lib/supabase/client"

/**
 * Uploads a file to Supabase storage
 */
export async function uploadProductImage(file: File): Promise<string> {
  const supabase = createClient()

  try {
    // Create a unique file name
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `product-images/${fileName}`

    // Upload the file
    const { error: uploadError } = await supabase.storage.from("products").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      throw new Error(`Error uploading file: ${uploadError.message}`)
    }

    // Get the public URL
    const { data } = supabase.storage.from("products").getPublicUrl(filePath)
    console.log("Uploaded file URL:", data.publicUrl) // Debugging

    if (!data.publicUrl) throw new Error("Failed to retrieve public URL")
    return data.publicUrl
  } catch (error) {
    console.error("Error in uploadProductImage:", error)
    throw error
  }
}

/**
 * Uploads multiple files to Supabase storage
 */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  try {
    const uploadPromises = files.map((file) => uploadProductImage(file))
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error("Error uploading multiple files:", error)
    throw error
  }
}

