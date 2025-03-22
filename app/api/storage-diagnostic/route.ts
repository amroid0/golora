import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    const diagnosticResults: Record<string, any> = {}

    // 1. Check if the products bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json(
        {
          error: "Failed to list buckets",
          details: bucketsError,
        },
        { status: 500 },
      )
    }

    diagnosticResults.allBuckets = buckets.map((b) => b.name)
    const productsBucketExists = buckets.some((b) => b.name === "products")
    diagnosticResults.productsBucketExists = productsBucketExists

    // 2. If products bucket doesn't exist, try to create it
    if (!productsBucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket("products", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      diagnosticResults.bucketCreationAttempted = true
      diagnosticResults.bucketCreationError = createBucketError ? createBucketError.message : null
    }

    // 3. Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .from("pg_policies")
      .select("*")
      .eq("tablename", "objects")
      .eq("schemaname", "storage")

    diagnosticResults.policiesError = policiesError ? policiesError.message : null
    diagnosticResults.policies = policies

    // 4. Try a test upload
    const testData = new Blob(["test file content"], { type: "text/plain" })
    const testFile = new File([testData], "test.txt", { type: "text/plain" })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("products")
      .upload("test-upload.txt", testFile, {
        cacheControl: "3600",
        upsert: true,
      })

    diagnosticResults.testUploadError = uploadError ? uploadError.message : null
    diagnosticResults.testUploadData = uploadData

    // 5. If upload succeeded, try to get the URL
    if (uploadData) {
      const { data: urlData } = supabase.storage.from("products").getPublicUrl("test-upload.txt")

      diagnosticResults.publicUrl = urlData.publicUrl

      // 6. Test if the URL is accessible
      try {
        const response = await fetch(urlData.publicUrl, { method: "HEAD" })
        diagnosticResults.urlAccessible = response.ok
        diagnosticResults.urlStatus = response.status
      } catch (error: any) {
        diagnosticResults.urlAccessError = error.message
      }
    }

    // 7. Get Supabase project URL (without the API key)
    diagnosticResults.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    return NextResponse.json(diagnosticResults)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

