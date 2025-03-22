"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface SupabaseImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function SupabaseImage({ src, alt, width = 300, height = 300, className, priority }: SupabaseImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    // Reset state when src changes
    setImageSrc(src)
    setIsLoading(true)
    setError(false)
  }, [src])

  const handleError = async () => {
    // If the public URL fails, try to get a signed URL
    if (!src.includes("sign") && src.includes("supabase")) {
      try {
        setError(true)

        // Extract the bucket and path from the URL
        // Example URL: https://xxx.supabase.co/storage/v1/object/public/products/product-images/file.jpg
        const urlParts = src.split("/public/")
        if (urlParts.length < 2) return

        const [bucket, path] = urlParts[1].split("/", 1)
        const filePath = urlParts[1].substring(bucket.length + 1)

        const supabase = createClient()
        const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 60 * 60) // 1 hour expiry

        if (data?.signedUrl) {
          setImageSrc(data.signedUrl)
          setError(false)
        }
      } catch (err) {
        console.error("Error creating signed URL:", err)
      }
    }
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!error && (
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          fill
          className="object-cover"
          onLoadingComplete={() => setIsLoading(false)}
          onError={handleError}
          priority={priority}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Image not available
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </div>
  )
}

