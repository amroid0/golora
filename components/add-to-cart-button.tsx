"use client"

import type React from "react"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import type { Database } from "@/lib/database.types"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null
}

interface AddToCartButtonProps {
  product: Product
  disabled?: boolean
  selectedSize?: string | null
  selectedColor?: { name: string; hex: string } | null
}

export function AddToCartButton({ product, disabled, selectedSize, selectedColor }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()
  const { toast } = useToast()

  const handleAddToCart = () => {
    // Clear any previous errors
    setError(null)

    // Check if size is required but not selected
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setError("Please select a size")
      return
    }

    // Check if color is required but not selected
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      setError("Please select a color")
      return
    }

    // Add to cart with size and color
    addItem(product, quantity, selectedSize, selectedColor)

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (value > 0) {
      setQuantity(value)
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2">
        <div className="w-24">
          <Input type="number" min="1" value={quantity} onChange={handleQuantityChange} disabled={disabled} />
        </div>
        <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={disabled}>
          <ShoppingCart className="mr-2 h-5 w-5" />
          Add to Cart
        </Button>
      </div>

      {/* Show selected options summary */}
      {(selectedSize || selectedColor) && (
        <div className="text-sm text-muted-foreground">
          {selectedSize && <span>Size: {selectedSize}</span>}
          {selectedSize && selectedColor && <span> | </span>}
          {selectedColor && (
            <span className="flex items-center">
              Color:
              <span className="inline-block w-3 h-3 rounded-full mx-1" style={{ backgroundColor: selectedColor.hex }} />
              {selectedColor.name}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

