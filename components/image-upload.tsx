"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  maxFiles?: number
  existingImages?: string[]
  onRemoveExisting?: (index: number) => void
  folder?: string
}

export function ImageUpload({
  onImagesUploaded,
  maxFiles = 5,
  existingImages = [],
  onRemoveExisting,
  folder = "product-images",
}: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Limit the number of files
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length - existingImages.length)

      if (newFiles.length === 0) return

      setFiles((prev) => [...prev, ...newFiles])

      // Create previews
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setPreviews((prev) => [...prev, ...newPreviews])
    },
    [files.length, existingImages.length, maxFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxFiles - files.length - existingImages.length,
    disabled: isUploading || files.length + existingImages.length >= maxFiles,
  })

  const removeFile = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index])

    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        const { data, error } = await supabase.storage.from("products").upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

        if (error) throw error

        const { data: urlData } = supabase.storage.from("products").getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Clear files and previews after successful upload
      setFiles([])
      setPreviews([])

      // Call the callback with the uploaded URLs
      onImagesUploaded(uploadedUrls)
    } catch (err: any) {
      setError(err.message || "Failed to upload images")
      console.error("Error uploading images:", err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {existingImages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Current Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden border">
                  <Image
                    src={url || "/placeholder.svg"}
                    alt={`Image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(index)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/50 hover:bg-muted"
        } ${(files.length + existingImages.length) >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG or WEBP (MAX. {maxFiles - existingImages.length - files.length} more files)
          </p>
        </div>
      </div>

      {/* Preview of files to be uploaded */}
      {previews.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">New Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={`preview-${index}`} className="relative group">
                <div className="aspect-square rounded-md overflow-hidden border">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove image</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Uploading... {uploadProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Upload button */}
      {files.length > 0 && (
        <Button type="button" onClick={uploadFiles} disabled={isUploading || files.length === 0} className="w-full">
          {isUploading ? "Uploading..." : `Upload ${files.length} Image${files.length > 1 ? "s" : ""}`}
        </Button>
      )}
    </div>
  )
}

