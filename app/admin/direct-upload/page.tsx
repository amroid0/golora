"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"

export default function DirectUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)
    setUploadedUrl(null)
    setLogs([])

    try {
      addLog("Starting direct upload process...")
      const supabase = createClient()

      // Upload file directly to the root of the bucket
      addLog("Uploading file directly to bucket root...")
      const fileName = `direct-test-${Date.now()}.${file.name.split(".").pop()}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("products").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      addLog("File uploaded successfully")

      // Get public URL
      addLog("Getting public URL...")
      const { data: urlData } = supabase.storage.from("products").getPublicUrl(fileName)

      setUploadedUrl(urlData.publicUrl)
      addLog(`Public URL: ${urlData.publicUrl}`)

      // Test if URL is accessible
      addLog("Testing if URL is accessible...")
      try {
        const response = await fetch(urlData.publicUrl, { method: "HEAD" })
        addLog(`URL status: ${response.status} ${response.ok ? "(OK)" : "(Failed)"}`)
      } catch (fetchError: any) {
        addLog(`Failed to access URL: ${fetchError.message}`)
      }
    } catch (err: any) {
      setError(err.message)
      addLog(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Direct File Upload Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Direct Upload Test</CardTitle>
            <CardDescription>Test uploading a file directly to the bucket root</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Input type="file" onChange={handleFileChange} accept="image/*" disabled={uploading} />
            </div>

            {uploadedUrl && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Uploaded Image:</h3>
                <div className="border rounded-md overflow-hidden">
                  <Image
                    src={uploadedUrl || "/placeholder.svg"}
                    alt="Uploaded file"
                    width={300}
                    height={300}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 text-sm break-all">
                  <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {uploadedUrl}
                  </a>
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={uploadFile} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload File Directly"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Logs</CardTitle>
            <CardDescription>Detailed logs of the upload process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-md h-[400px] overflow-y-auto">
              {logs.length > 0 ? (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No logs yet. Start an upload to see detailed logs.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

