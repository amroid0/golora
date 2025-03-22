"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupabaseImage } from "@/components/supabase-image"

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // If no images provided, use a placeholder
  const displayImages =
    images.length > 0 ? images : [`/placeholder.svg?height=600&width=600&text=${encodeURIComponent(productName)}`]

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border">
        <SupabaseImage
          src={displayImages[currentImageIndex] || "/placeholder.svg"}
          alt={`${productName} - Image ${currentImageIndex + 1}`}
          width={600}
          height={600}
          className="h-full w-full"
        />

        {displayImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous image</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background/80"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next image</span>
            </Button>
          </>
        )}
      </div>

      {displayImages.length > 1 && (
        <div className="flex space-x-2 overflow-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border ${
                index === currentImageIndex ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setCurrentImageIndex(index)}
            >
              <SupabaseImage
                src={image || "/placeholder.svg"}
                alt={`${productName} - Thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

