"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/context/favorites-context"
import type { Database } from "@/lib/database.types"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null
}

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null)
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { toast } = useToast()

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size === selectedSize ? null : size)
  }

  // Handle color selection
  const handleColorSelect = (color: { name: string; hex: string }) => {
    setSelectedColor(color.name === selectedColor?.name ? null : color)
  }

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    const productIsFavorite = isFavorite(product.id)

    if (productIsFavorite) {
      removeFavorite(product.id)
      toast({
        title: "Removed from favorites",
        description: `${product.name} has been removed from your favorites.`,
      })
    } else {
      addFavorite(product)
      toast({
        title: "Added to favorites",
        description: `${product.name} has been added to your favorites.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        {product.categories && <div className="text-sm text-muted-foreground mb-2">{product.categories.name}</div>}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <Button
            variant="outline"
            size="icon"
            className={`rounded-full transition-all duration-300 ${
              isFavorite(product.id)
                ? "text-destructive hover:text-destructive/80 border-destructive"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={handleFavoriteToggle}
          >
            <Heart className={`h-5 w-5 ${isFavorite(product.id) ? "fill-current" : ""}`} />
            <span className="sr-only">{isFavorite(product.id) ? "Remove from favorites" : "Add to favorites"}</span>
          </Button>
        </div>

        <div className="mt-4 flex items-center">
          {product.sale_price ? (
            <>
              <span className="text-3xl font-bold">${product.sale_price.toFixed(2)}</span>
              <span className="ml-2 text-lg text-muted-foreground line-through">${product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Description</h2>
        <p className="text-muted-foreground">{product.description || "No description available."}</p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-2">Availability</h2>
        <p className={product.inventory_count > 0 ? "text-green-600" : "text-red-600"}>
          {product.inventory_count > 0 ? `In Stock (${product.inventory_count} available)` : "Out of Stock"}
        </p>
      </div>

      {/* Sizes Section */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Size</h2>
            {selectedSize && <Badge variant="outline">Selected: {selectedSize}</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handleSizeSelect(size)}
                className={`flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors
                  ${
                    selectedSize === size
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors Section */}
      {product.colors && product.colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Color</h2>
            {selectedColor && (
              <Badge variant="outline" className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: selectedColor.hex }} />
                {selectedColor.name}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`flex h-10 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors
                  ${
                    selectedColor?.name === color.name
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: color.hex }} />
                {color.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <AddToCartButton
          product={product}
          disabled={product.inventory_count === 0}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
        />
      </div>
    </div>
  )
}

