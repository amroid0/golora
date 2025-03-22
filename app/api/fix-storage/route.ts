import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()
    const results: Record<string, any> = {}

    // 1. Check if the products bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({ error: "Failed to list buckets", details: bucketsError }, { status: 500 })
    }

    const productsBucketExists = buckets.some((b) => b.name === "products")
    results.productsBucketExists = productsBucketExists

    // 2. Create the products bucket if it doesn't exist
    if (!productsBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket("products", {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      })

      if (createBucketError) {
        results.createBucketError = createBucketError.message
      } else {
        results.bucketCreated = true
      }
    }

    // 3. Create the product-images folder if it doesn't exist
    const testData = new Blob(["folder marker"], { type: "text/plain" })
    const testFile = new File([testData], ".folder", { type: "text/plain" })

    const { error: folderError } = await supabase.storage.from("products").upload("product-images/.folder", testFile, {
      cacheControl: "3600",
      upsert: true,
    })

    results.folderCreationError = folderError ? folderError.message : null
    results.folderCreated = !folderError

    // 4. Create a test file to verify everything is working
    const testImageData = new Blob(["test image content"], { type: "image/jpeg" })
    const testImageFile = new File([testImageData], "test-image.jpg", { type: "image/jpeg" })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("products")
      .upload("product-images/test-image.jpg", testImageFile, {
        cacheControl: "3600",
        upsert: true,
      })

    results.testUploadError = uploadError ? uploadError.message : null
    results.testUploadSuccess = !!uploadData

    if (uploadData) {
      const { data: urlData } = supabase.storage.from("products").getPublicUrl("product-images/test-image.jpg")

      results.testFileUrl = urlData.publicUrl
    }

    // 5. Execute SQL to ensure policies are set correctly
    const { error: sqlError } = await supabase.rpc("execute_storage_policy_setup")

    results.sqlError = sqlError ? sqlError.message : null
    results.policiesUpdated = !sqlError

    return NextResponse.json({
      success: true,
      message: "Storage setup completed",
      results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Fix operation failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

