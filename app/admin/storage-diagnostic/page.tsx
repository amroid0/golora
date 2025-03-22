"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StorageDiagnosticPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/storage-diagnostic")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Diagnostic failed")
      }

      setResults(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Run diagnostic on page load
  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Storage Diagnostic</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase Storage Diagnostic</CardTitle>
          <CardDescription>
            This tool checks your Supabase storage configuration and attempts to diagnose any issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Running diagnostic...</div>
          ) : results ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Supabase URL:</h3>
                <p className="text-sm bg-muted p-2 rounded">{results.supabaseUrl}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Buckets:</h3>
                <p>
                  Products bucket exists:{" "}
                  <span className={results.productsBucketExists ? "text-green-600" : "text-red-600"}>
                    {results.productsBucketExists ? "Yes" : "No"}
                  </span>
                </p>
                <p>All buckets: {results.allBuckets?.join(", ") || "None"}</p>

                {results.bucketCreationAttempted && (
                  <p>
                    Bucket creation attempted:{" "}
                    {results.bucketCreationError ? (
                      <span className="text-red-600">Failed - {results.bucketCreationError}</span>
                    ) : (
                      <span className="text-green-600">Success</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Test Upload:</h3>
                {results.testUploadError ? (
                  <p className="text-red-600">Upload failed: {results.testUploadError}</p>
                ) : (
                  <p className="text-green-600">Upload successful</p>
                )}

                {results.publicUrl && (
                  <div>
                    <p>
                      Public URL:{" "}
                      <a
                        href={results.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        {results.publicUrl}
                      </a>
                    </p>
                    <p>
                      URL accessible:{" "}
                      <span className={results.urlAccessible ? "text-green-600" : "text-red-600"}>
                        {results.urlAccessible ? "Yes" : "No"}
                      </span>
                    </p>
                    {results.urlStatus && <p>Status code: {results.urlStatus}</p>}
                    {results.urlAccessError && <p className="text-red-600">Error: {results.urlAccessError}</p>}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">RLS Policies:</h3>
                {results.policiesError ? (
                  <p className="text-red-600">Failed to check policies: {results.policiesError}</p>
                ) : (
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(results.policies, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostic} disabled={loading}>
            {loading ? "Running..." : "Run Diagnostic Again"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Create the products bucket:</h3>
              <p className="text-sm mb-2">Run this SQL in the Supabase SQL Editor:</p>
              <pre className="text-xs bg-muted p-2 rounded">
                {`INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Add RLS policies:</h3>
              <p className="text-sm mb-2">Run this SQL to allow public read access:</p>
              <pre className="text-xs bg-muted p-2 rounded">
                {`CREATE POLICY "Public Read Access for products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');`}
              </pre>

              <p className="text-sm mb-2 mt-4">Run this SQL to allow authenticated users to upload:</p>
              <pre className="text-xs bg-muted p-2 rounded">
                {`CREATE POLICY "Authenticated Users Can Upload to products"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

