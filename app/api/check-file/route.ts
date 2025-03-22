import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get("path")

  if (!path) {
    return NextResponse.json({ error: "No path provided" }, { status: 400 })
  }

  try {
    const supabase = createClient()
    const results: Record<string, any> = { path }

    // 1. Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      return NextResponse.json({ error: "Failed to list buckets", details: bucketsError }, { status: 500 })
    }

    const productsBucket = buckets.find((b) => b.name === "products")
    results.bucketExists = !!productsBucket
    results.bucketDetails = productsBucket

    if (!productsBucket) {
      return NextResponse.json(
        {
          error: "Products bucket does not exist",
          results,
        },
        { status: 404 },
      )
    }

    // 2. List files in the bucket to check if the file exists
    // Extract the path without the bucket name
    const filePath = path.startsWith("product-images/") ? path : path.replace("products/", "")

    results.filePath = filePath

    const { data: files, error: listError } = await supabase.storage.from("products").list("product-images", {
      limit: 100,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    })

    if (listError) {
      results.listError = listError.message
    } else {
      results.filesInFolder = files.map((f) => f.name)

      // Check if our file is in the list
      const fileName = filePath.split("/").pop()
      results.fileName = fileName
      results.fileExists = files.some((f) => f.name === fileName)
    }

    // 3. Try to download the file directly
    const { data: fileData, error: downloadError } = await supabase.storage.from("products").download(filePath)

    results.downloadError = downloadError ? downloadError.message : null
    results.fileDownloadable = !!fileData

    // 4. Check RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc("get_policies_for_table", {
      table_name: "objects",
      schema_name: "storage",
    })

    if (policiesError) {
      results.policiesError = policiesError.message
    } else {
      results.policies = policies
    }

    // 5. Try to create the file if it doesn't exist
    if (!results.fileDownloadable) {
      const testData = new Blob(["test file content"], { type: "text/plain" })
      const testFile = new File([testData], "test-recreate.txt", { type: "text/plain" })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload("product-images/test-recreate.txt", testFile, {
          cacheControl: "3600",
          upsert: true,
        })

      results.recreateUploadError = uploadError ? uploadError.message : null
      results.recreateUploadSuccess = !!uploadData

      if (uploadData) {
        const { data: urlData } = supabase.storage.from("products").getPublicUrl("product-images/test-recreate.txt")

        results.recreatedFileUrl = urlData.publicUrl
      }
    }

    return NextResponse.json(results)
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

