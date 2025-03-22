"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function FixRLSPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [testUploadResult, setTestUploadResult] = useState<any>(null)

  const fixRLSPolicies = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // First create the function if it doesn't exist
      await createFixFunction()

      // Then execute the fix
      const response = await fetch("/api/fix-rls-policies", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix RLS policies")
      }

      setSuccess("RLS policies fixed successfully. Try uploading a file now.")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createFixFunction = async () => {
    const supabase = createClient()

    // SQL to create the function
    const sql = `
      CREATE OR REPLACE FUNCTION fix_storage_rls_policies()
      RETURNS void AS $$
      BEGIN
        -- Drop existing policies for the products bucket to avoid conflicts
        DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users Can Update Own Files in products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users Can Delete Own Files in products" ON storage.objects;
        
        -- Allow anyone to read from the products bucket
        CREATE POLICY "Public Read Access for products"
        ON storage.objects
        FOR SELECT
        USING (bucket_id = 'products');
        
        -- Allow authenticated users to upload to the products bucket
        CREATE POLICY "Authenticated Users Can Upload to products"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'products');
        
        -- Allow authenticated users to update their own files
        CREATE POLICY "Authenticated Users Can Update Own Files in products"
        ON storage.objects
        FOR UPDATE
        TO authenticated
        USING (bucket_id = 'products' AND owner = auth.uid())
        WITH CHECK (bucket_id = 'products');
        
        -- Allow authenticated users to delete their own files
        CREATE POLICY "Authenticated Users Can Delete Own Files in products"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (bucket_id = 'products' AND owner = auth.uid());
        
        -- Allow anon users to upload to the products bucket (for testing)
        CREATE POLICY "Anyone Can Upload to products"
        ON storage.objects
        FOR INSERT
        TO anon
        WITH CHECK (bucket_id = 'products');
      END;
      $$ LANGUAGE plpgsql;
    `

    try {
      const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

      if (error) {
        // If the exec_sql function doesn't exist, create it first
        if (error.message.includes("function exec_sql") || error.message.includes("does not exist")) {
          await supabase.rpc("create_exec_sql_function")
          // Try again
          await supabase.rpc("exec_sql", { sql_query: sql })
        } else {
          throw error
        }
      }
    } catch (err: any) {
      console.error("Error creating fix function:", err)
      // If we can't create the function via RPC, we'll just rely on the SQL in the UI
    }
  }

  const testUpload = async () => {
    setLoading(true)
    setTestUploadResult(null)

    try {
      const supabase = createClient()

      // Create a test file
      const testData = new Blob(["test file content"], { type: "text/plain" })
      const testFile = new File([testData], "rls-test.txt", { type: "text/plain" })

      // Upload the file
      const { data, error } = await supabase.storage.from("products").upload(`test-${Date.now()}.txt`, testFile, {
        cacheControl: "3600",
        upsert: true,
      })

      if (error) {
        setTestUploadResult({
          success: false,
          error: error.message,
        })
      } else {
        // Get the public URL
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path)

        setTestUploadResult({
          success: true,
          url: urlData.publicUrl,
        })
      }
    } catch (err: any) {
      setTestUploadResult({
        success: false,
        error: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fix RLS Policies</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix RLS Policies</CardTitle>
            <CardDescription>Fix Row Level Security policies for the products bucket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Drop existing RLS policies for the products bucket</li>
                <li>Create new policies that allow public read access</li>
                <li>Allow authenticated users to upload, update, and delete files</li>
                <li>Add a temporary policy to allow anonymous uploads for testing</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={fixRLSPolicies} disabled={loading}>
              {loading ? "Fixing..." : "Fix RLS Policies"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Upload</CardTitle>
            <CardDescription>Test if you can upload a file after fixing the policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testUploadResult && (
              <Alert
                variant={testUploadResult.success ? "default" : "destructive"}
                className={testUploadResult.success ? "bg-green-50 border-green-200" : ""}
              >
                <AlertDescription className={testUploadResult.success ? "text-green-800" : ""}>
                  {testUploadResult.success ? "Upload successful!" : `Upload failed: ${testUploadResult.error}`}
                </AlertDescription>
              </Alert>
            )}

            {testUploadResult && testUploadResult.success && (
              <div className="mt-4">
                <p className="font-medium mb-2">File URL:</p>
                <a
                  href={testUploadResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {testUploadResult.url}
                </a>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={testUpload} disabled={loading}>
              {loading ? "Testing..." : "Test Upload"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Manual SQL Fix</CardTitle>
          <CardDescription>If the automatic fix doesn't work, run this SQL in the Supabase SQL Editor</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto">
            {`-- Create the exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION create_exec_sql_function()
RETURNS void AS $$
BEGIN
  CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
  RETURNS void AS $inner$
  BEGIN
    EXECUTE sql_query;
  END;
  $inner$ LANGUAGE plpgsql SECURITY DEFINER;
END;
$$ LANGUAGE plpgsql;

-- Create the function to fix RLS policies
CREATE OR REPLACE FUNCTION fix_storage_rls_policies()
RETURNS void AS $$
BEGIN
  -- Drop existing policies for the products bucket to avoid conflicts
  DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Update Own Files in products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Delete Own Files in products" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone Can Upload to products" ON storage.objects;
  
  -- Allow anyone to read from the products bucket
  CREATE POLICY "Public Read Access for products"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');
  
  -- Allow authenticated users to upload to the products bucket
  CREATE POLICY "Authenticated Users Can Upload to products"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');
  
  -- Allow authenticated users to update their own files
  CREATE POLICY "Authenticated Users Can Update Own Files in products"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'products');
  
  -- Allow authenticated users to delete their own files
  CREATE POLICY "Authenticated Users Can Delete Own Files in products"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'products' AND owner = auth.uid());
  
  -- Allow anon users to upload to the products bucket (for testing)
  CREATE POLICY "Anyone Can Upload to products"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'products');
END;
$$ LANGUAGE plpgsql;

-- Execute the function to fix the policies
SELECT fix_storage_rls_policies();`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

