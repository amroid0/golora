"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FixStoragePage() {
  const [path, setPath] = useState("product-images/1742220232671-85bk8lyymqy.jpeg")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fixResults, setFixResults] = useState<any>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)
  const [setupDone, setSetupDone] = useState(false)

  const checkFile = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch(`/api/check-file?path=${encodeURIComponent(path)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Check failed")
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createSetupFunction = async () => {
    try {
      const response = await fetch("/api/create-storage-function", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Setup failed")
      }

      setSetupDone(true)
      return true
    } catch (err: any) {
      setFixError(err.message)
      return false
    }
  }

  const fixStorage = async () => {
    setFixLoading(true)
    setFixError(null)
    setFixResults(null)

    try {
      // First create the setup function if not done already
      if (!setupDone) {
        const success = await createSetupFunction()
        if (!success) return
      }

      // Then fix the storage
      const response = await fetch("/api/fix-storage", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Fix failed")
      }

      setFixResults(data.results)
    } catch (err: any) {
      setFixError(err.message)
    } finally {
      setFixLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Fix Storage Issues</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Check File</CardTitle>
            <CardDescription>Check if a specific file exists and is accessible</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">File Path</label>
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="product-images/filename.jpg" />
              <p className="text-xs text-muted-foreground">
                Enter the path to the file you want to check, relative to the products bucket
              </p>
            </div>

            {results && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium">Bucket Status:</h3>
                  <p>
                    Bucket exists:{" "}
                    <span className={results.bucketExists ? "text-green-600" : "text-red-600"}>
                      {results.bucketExists ? "Yes" : "No"}
                    </span>
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">File Status:</h3>
                  <p>File path: {results.filePath}</p>
                  <p>
                    File exists in folder:{" "}
                    <span className={results.fileExists ? "text-green-600" : "text-red-600"}>
                      {results.fileExists ? "Yes" : "No"}
                    </span>
                  </p>
                  <p>
                    File downloadable:{" "}
                    <span className={results.fileDownloadable ? "text-green-600" : "text-red-600"}>
                      {results.fileDownloadable ? "Yes" : "No"}
                    </span>
                  </p>
                  {results.downloadError && <p className="text-red-600">Download error: {results.downloadError}</p>}
                </div>

                {results.recreatedFileUrl && (
                  <div>
                    <h3 className="font-medium">Test File Created:</h3>
                    <p>
                      <a
                        href={results.recreatedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {results.recreatedFileUrl}
                      </a>
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium">Files in Folder:</h3>
                  {results.filesInFolder && results.filesInFolder.length > 0 ? (
                    <ul className="text-sm space-y-1 mt-2">
                      {results.filesInFolder.map((file: string, index: number) => (
                        <li key={index}>{file}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No files found in folder</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkFile} disabled={loading}>
              {loading ? "Checking..." : "Check File"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Storage Setup</CardTitle>
            <CardDescription>Fix common storage issues by recreating the bucket and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fixError && (
              <Alert variant="destructive">
                <AlertDescription>{fixError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p>This will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create the products bucket if it doesn't exist</li>
                <li>Create the product-images folder</li>
                <li>Set up proper RLS policies for public access</li>
                <li>Create a test file to verify everything works</li>
              </ul>
            </div>

            {fixResults && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="font-medium">Results:</h3>
                  <p>
                    Bucket existed:{" "}
                    <span className={fixResults.productsBucketExists ? "text-green-600" : "text-yellow-600"}>
                      {fixResults.productsBucketExists ? "Yes" : "No"}
                    </span>
                  </p>
                  {fixResults.bucketCreated && <p className="text-green-600">Bucket was created successfully</p>}
                  <p>
                    Folder created:{" "}
                    <span className={fixResults.folderCreated ? "text-green-600" : "text-red-600"}>
                      {fixResults.folderCreated ? "Yes" : "No"}
                    </span>
                  </p>
                  <p>
                    Test upload successful:{" "}
                    <span className={fixResults.testUploadSuccess ? "text-green-600" : "text-red-600"}>
                      {fixResults.testUploadSuccess ? "Yes" : "No"}
                    </span>
                  </p>
                  <p>
                    Policies updated:{" "}
                    <span className={fixResults.policiesUpdated ? "text-green-600" : "text-red-600"}>
                      {fixResults.policiesUpdated ? "Yes" : "No"}
                    </span>
                  </p>
                </div>

                {fixResults.testFileUrl && (
                  <div>
                    <h3 className="font-medium">Test File URL:</h3>
                    <p>
                      <a
                        href={fixResults.testFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {fixResults.testFileUrl}
                      </a>
                    </p>
                    <p className="text-sm mt-2">
                      Try opening this URL. If it works, your storage is now properly configured.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={fixStorage} disabled={fixLoading}>
              {fixLoading ? "Fixing..." : "Fix Storage Setup"}
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
            {`-- Create the function to set up storage policies
CREATE OR REPLACE FUNCTION execute_storage_policy_setup()
RETURNS void AS $$
BEGIN
  -- Create the products bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('products', 'products', true)
  ON CONFLICT (id) DO NOTHING;

  -- Drop existing policies for the products bucket to avoid conflicts
  DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Update Own Files in products" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Users Can Delete Own Files in products" ON storage.objects;

  -- Create new policies
  -- Allow public read access to all files in the products bucket
  CREATE POLICY "Public Read Access for products"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'products');

  -- Allow authenticated users to upload files to the products bucket
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
END;
$$ LANGUAGE plpgsql;

-- Create the function to create the setup function
CREATE OR REPLACE FUNCTION create_storage_policy_setup_function()
RETURNS void AS $$
BEGIN
  -- Create the function to set up storage policies
  CREATE OR REPLACE FUNCTION execute_storage_policy_setup()
  RETURNS void AS $func$
  BEGIN
    -- Create the products bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('products', 'products', true)
    ON CONFLICT (id) DO NOTHING;

    -- Drop existing policies for the products bucket to avoid conflicts
    DROP POLICY IF EXISTS "Public Read Access for products" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Users Can Upload to products" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Users Can Update Own Files in products" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Users Can Delete Own Files in products" ON storage.objects;

    -- Create new policies
    -- Allow public read access to all files in the products bucket
    CREATE POLICY "Public Read Access for products"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');

    -- Allow authenticated users to upload files to the products bucket
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
  END;
  $func$ LANGUAGE plpgsql;
END;
$$ LANGUAGE plpgsql;

-- Create the function to get policies for a table
CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text, schema_name text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(p))
  INTO result
  FROM pg_policies p
  WHERE p.tablename = table_name
  AND p.schemaname = schema_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Execute the setup
SELECT create_storage_policy_setup_function();
SELECT execute_storage_policy_setup();`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

