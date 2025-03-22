import { createClient } from "@/lib/supabase/client"

/**
 * Deletes an image from Supabase storage
 * @param url The public URL of the image to delete
 * @returns A promise that resolves to a boolean indicating success
 */
export async function deleteImage(url: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Extract the path from the URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/products/path/to/image.jpg
    const urlParts = url.split("/public/products/")
    if (urlParts.length < 2) return false

    const path = urlParts[1]

    const { error } = await supabase.storage.from("products").remove([path])

    if (error) {
      console.error("Error deleting image:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteImage:", error)
    return false
  }
}

/**
 * Deletes multiple images from Supabase storage
 * @param urls Array of public URLs to delete
 * @returns A promise that resolves to the number of successfully deleted images
 */
export async function deleteImages(urls: string[]): Promise<number> {
  if (!urls || urls.length === 0) return 0

  let successCount = 0

  for (const url of urls) {
    const success = await deleteImage(url)
    if (success) successCount++
  }

  return successCount
}

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param folder The folder to upload to (default: 'product-images')
 * @returns A promise that resolves to the public URL of the uploaded image
 */
export async function uploadImage(file: File, folder = "product-images"): Promise<string> {
  try {
    const supabase = createClient()

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { error } = await supabase.storage.from("products").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (error) throw error

    const { data } = supabase.storage.from("products").getPublicUrl(filePath)

    return data.publicUrl
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

