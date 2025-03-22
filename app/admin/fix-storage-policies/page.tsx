"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

export default function FixStoragePoliciesPage() {
  const [isFixing, setIsFixing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [testUrl, setTestUrl] = useState("")
  const [testImage, setTestImage] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [isTestingUrl, setIsTestingUrl] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)

  const fixPolicies = async () => {
    setIsFixing(true)
    setError(null)
    setResult(null)

    try {
      const supabase = createClient()

      // Step 1: Check if the bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw new Error(`Failed to list buckets: ${bucketsError.message}`)
      }

      const productsBucket = buckets.find((b) => b.name === "products")

      if (!productsBucket) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket("products", {
          public: true,
        })

        if (createError) {
          throw new Error(`Failed to create bucket: ${createError.message}`)
        }

        setResult((prev) => ({ ...prev, bucketCreated: true }))
      } else {
        setResult((prev) => ({ ...prev, bucketExists: true }))
      }

      // Step 2: Execute SQL to fix RLS policies
      // We'll use a direct SQL query to set up the policies correctly
      const sql = `
        -- Drop existing policies for the products bucket
        DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
        
        -- Create public read access policy
        CREATE POLICY "Public Read Access for products"
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'products');
        
        -- Create upload policy for authenticated users
        CREATE POLICY "Authenticated Users Can Upload to products"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'products');
        
        -- Create a temporary policy to allow anonymous uploads (for testing)
        DROP POLICY IF EXISTS "Allow Anonymous Uploads to products" ON storage.objects;
        CREATE POLICY "Allow Anonymous Uploads to products"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'products');
      `

      // Execute the SQL (this is a simplified approach - in a real app, you'd use a server action)
      // For now, we'll try to use the Supabase JS client to execute the SQL
      const { error: sqlError } = await supabase.rpc("exec_sql", { sql_query: sql })

      if (sqlError) {
        // If the function doesn't exist, we'll note that in the results
        setResult((prev) => ({
          ...prev,
          sqlError: sqlError.message,
          manualSqlRequired: true,
        }))
      } else {
        setResult((prev) => ({ ...prev, policiesUpdated: true }))
      }

      // Step 3: Test the bucket by uploading a test file
      const testData = new Blob(["test file content"], { type: "text/plain" })
      const testFile = new File([testData], "test-file.txt", { type: "text/plain" })

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload("test-file.txt", testFile, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        setResult((prev) => ({ ...prev, testUploadError: uploadError.message }))
      } else {
        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl("test-file.txt")

        setResult((prev) => ({
          ...prev,
          testUploadSuccess: true,
          publicUrl: publicUrlData.publicUrl,
        }))
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsFixing(false)
    }
  }

  const testImageUrl = async () => {
    if (!testUrl) {
      setTestError("Please enter a URL to test")
      return
    }

    setIsTestingUrl(true)
    setTestError(null)
    setTestImage(null)

    try {
      // Test if the image URL is accessible
      const response = await fetch(testUrl, { method: "HEAD" })

      if (!response.ok) {
        throw new Error(`URL returned status: ${response.status}`)
      }

      // If it's accessible, display it
      setTestImage(testUrl)
    } catch (err: any) {
      setTestError(err.message || "Failed to access the image URL")
    } finally {
      setIsTestingUrl(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const uploadTestFile = async () => {
    if (!file) {
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const supabase = createClient()

      // Upload to product-images folder
      const filePath = `product-images/test-${Date.now()}-${file.name}`

      const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        throw error
      }

      // Get both public and signed URLs
      const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(filePath)

      const { data: signedUrlData } = await supabase.storage.from("products").createSignedUrl(filePath, 60 * 60 * 24) // 24 hours

      setUploadResult({
        success: true,
        publicUrl: publicUrlData.publicUrl,
        signedUrl: signedUrlData.signedUrl,
      })
    } catch (err: any) {
      setUploadResult({
        success: false,
        error: err.message,
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fix Storage Policies</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix Storage Policies</CardTitle>
            <CardDescription>
              This will update the Row Level Security (RLS) policies for your Supabase storage bucket to allow public
              access to your product images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-2 mb-4">
                <h3 className="font-medium">Results:</h3>
                {result.bucketExists && <p className="text-green-600">✓ Products bucket exists</p>}
                {result.bucketCreated && <p className="text-green-600">✓ Products bucket created</p>}
                {result.policiesUpdated && <p className="text-green-600">✓ RLS policies updated</p>}
                {result.testUploadSuccess && <p className="text-green-600">✓ Test upload successful</p>}
                {result.testUploadError && (
                  <p className="text-red-600">✗ Test upload failed: {result.testUploadError}</p>
                )}
                {result.sqlError && <p className="text-amber-600">⚠️ SQL execution failed: {result.sqlError}</p>}
                {result.publicUrl && (
                  <div>
                    <p className="font-medium mt-2">Test file URL:</p>
                    <p className="text-sm break-all">{result.publicUrl}</p>
                  </div>
                )}
              </div>
            )}

            {result?.manualSqlRequired && (
              <Alert className="mb-4">
                <AlertDescription>
                  The automatic fix couldn't execute the SQL. You'll need to run the SQL manually in the Supabase
                  dashboard.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fixPolicies} disabled={isFixing}>
              {isFixing ? "Fixing..." : "Fix Storage Policies"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Image URL</CardTitle>
            <CardDescription>Test if an image URL is accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-url">Image URL</Label>
                <Input
                  id="test-url"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {testError && (
                <Alert variant="destructive">
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testImage && (
                <div className="border rounded-md p-2">
                  <p className="text-sm font-medium mb-2">Image Preview:</p>
                  <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                    <Image src={testImage || "/placeholder.svg"} alt="Test image" fill className="object-contain" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={testImageUrl} disabled={isTestingUrl}>
              {isTestingUrl ? "Testing..." : "Test URL"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Test Image</CardTitle>
          <CardDescription>Upload a test image to verify storage is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-file">Select Image</Label>
              <Input id="test-file" type="file" accept="image/*" onChange={handleFileChange} />
            </div>

            {uploadResult && (
              <div className="space-y-2">
                {uploadResult.success ? (
                  <>
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">Upload successful!</AlertDescription>
                    </Alert>

                    <div className="space-y-2 mt-4">
                      <h3 className="font-medium">Public URL:</h3>
                      <p className="text-sm break-all">{uploadResult.publicUrl}</p>

                      <h3 className="font-medium mt-2">Signed URL:</h3>
                      <p className="text-sm break-all">{uploadResult.signedUrl}</p>

                      <div className="border rounded-md p-2 mt-4">
                        <p className="text-sm font-medium mb-2">Image Preview (Signed URL):</p>
                        <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                          <Image
                            src={uploadResult.signedUrl || "/placeholder.svg"}
                            alt="Uploaded image"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-2 mt-4">
                        <p className="text-sm font-medium mb-2">Image Preview (Public URL):</p>
                        <div className="relative aspect-square w-full max-w-[300px] mx-auto">
                          <Image
                            src={uploadResult.publicUrl || "/placeholder.svg"}
                            alt="Uploaded image"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>Upload failed: {uploadResult.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={uploadTestFile} disabled={!file || isUploading}>
            {isUploading ? "Uploading..." : "Upload Test Image"}
          </Button>
        </CardFooter>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manual SQL Fix</CardTitle>
          <CardDescription>If the automatic fix doesn't work, run this SQL in the Supabase SQL Editor</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
            {`-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for the products bucket
DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
DROP POLICY IF EXISTS "Allow Anonymous Uploads to products" ON storage.objects;

-- Create public read access policy
CREATE POLICY "Public Read Access for products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- Create upload policy for authenticated users
CREATE POLICY "Authenticated Users Can Upload to products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Create a temporary policy to allow anonymous uploads (for testing)
CREATE POLICY "Allow Anonymous Uploads to products"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'products');`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

