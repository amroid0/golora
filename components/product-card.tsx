"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { SupabaseImage } from "@/components/supabase-image"
import { ShoppingCart, Check, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/cart-context"
import { useFavorites } from "@/context/favorites-context"
import type { Database } from "@/lib/database.types"
import { Badge } from "@/components/ui/badge"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { id, name, slug, price, sale_price, images, sizes, colors } = product
  const { addItem } = useCart()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { toast } = useToast()

  // Pre-select first size and color
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes && sizes.length > 0 ? sizes[0] : null)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(
    colors && colors.length > 0 ? colors[0] : null,
  )
  const [showOptions, setShowOptions] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const imageUrl =
    images && images.length > 0 ? images[0] : `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(name)}`

  const handleAddToCart = () => {
    // If product has sizes or colors but none are selected, show options
    if (((sizes && sizes.length > 0) || (colors && colors.length > 0)) && !showOptions) {
      setShowOptions(true)
      return
    }

    // Animation for adding to cart
    setIsAdding(true)

    // Create a clone of the button that will animate to the cart
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const clone = document.createElement("div")
      clone.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>'
      clone.style.position = "fixed"
      clone.style.left = `${rect.left + rect.width / 2 - 12}px`
      clone.style.top = `${rect.top + rect.height / 2 - 12}px`
      clone.style.width = "24px"
      clone.style.height = "24px"
      clone.style.color = "white"
      clone.style.background = "var(--primary)"
      clone.style.borderRadius = "50%"
      clone.style.padding = "8px"
      clone.style.zIndex = "9999"
      clone.style.transition = "all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)"
      document.body.appendChild(clone)

      // Find the cart button position
      const cartButton = document.querySelector('a[href="/cart"] button')
      if (cartButton) {
        const cartRect = cartButton.getBoundingClientRect()
        setTimeout(() => {
          clone.style.left = `${cartRect.left + cartRect.width / 2 - 12}px`
          clone.style.top = `${cartRect.top + cartRect.height / 2 - 12}px`
          clone.style.transform = "scale(0.5)"
          clone.style.opacity = "0"
        }, 10)

        // Remove the clone after animation completes
        setTimeout(() => {
          document.body.removeChild(clone)
          // Add the item to cart
          addItem(product, 1, selectedSize, selectedColor)
          toast({
            title: "Added to cart",
            description: `${name} has been added to your cart.`,
          })
          setIsAdding(false)
          setShowOptions(false)
        }, 600)
      } else {
        // Fallback if cart button not found
        setTimeout(() => {
          document.body.removeChild(clone)
          addItem(product, 1, selectedSize, selectedColor)
          toast({
            title: "Added to cart",
            description: `${name} has been added to your cart.`,
          })
          setIsAdding(false)
          setShowOptions(false)
        }, 600)
      }
    } else {
      // Fallback if button ref not available
      addItem(product, 1, selectedSize, selectedColor)
      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart.`,
      })
      setIsAdding(false)
      setShowOptions(false)
    }
  }

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size)
  }

  // Handle color selection
  const handleColorSelect = (color: { name: string; hex: string }) => {
    setSelectedColor(color)
  }

  // Handle favorite toggle
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const productIsFavorite = isFavorite(id)

    if (productIsFavorite) {
      removeFavorite(id)
      toast({
        title: "Removed from favorites",
        description: `${name} has been removed from your favorites.`,
      })
    } else {
      addFavorite(product)

      // Create heart animation
      const heart = document.createElement("div")
      heart.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
      heart.style.position = "absolute"
      heart.style.top = "50%"
      heart.style.left = "50%"
      heart.style.transform = "translate(-50%, -50%)"
      heart.style.color = "var(--destructive)"
      heart.style.zIndex = "10"
      heart.style.opacity = "1"
      heart.style.transition = "all 0.6s ease-out"
      heart.style.pointerEvents = "none"

      const container = document.querySelector(`[data-product-id="${id}"]`)
      if (container) {
        container.appendChild(heart)

        setTimeout(() => {
          heart.style.transform = "translate(-50%, -150%) scale(1.5)"
          heart.style.opacity = "0"
        }, 10)

        setTimeout(() => {
          container.removeChild(heart)
        }, 600)
      }

      toast({
        title: "Added to favorites",
        description: `${name} has been added to your favorites.`,
      })
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-lg border bg-background transition-all duration-300 hover:shadow-lg"
      data-product-id={id}
    >
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300 ${
            isFavorite(id)
              ? "text-destructive hover:text-destructive/80"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-5 w-5 ${isFavorite(id) ? "fill-current" : ""}`} />
          <span className="sr-only">{isFavorite(id) ? "Remove from favorites" : "Add to favorites"}</span>
        </Button>
      </div>

      <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden">
        <SupabaseImage
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {sale_price && (
          <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-medium text-white">
            Sale
          </div>
        )}
      </Link>
      <div className="p-4">
        <Link href={`/products/${slug}`}>
          <h3 className="font-medium">{name}</h3>
        </Link>
        <div className="mt-1 flex items-center">
          {sale_price ? (
            <>
              <span className="text-lg font-bold">${sale_price.toFixed(2)}</span>
              <span className="ml-2 text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-bold">${price.toFixed(2)}</span>
          )}
        </div>

        {/* Display available sizes */}
        {sizes && sizes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-sm font-medium mr-1">Sizes:</span>
            {sizes.slice(0, 5).map((size) => (
              <Badge
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                className="text-sm px-2 py-0.5 cursor-pointer hover:bg-secondary/80"
                onClick={(e) => {
                  e.preventDefault()
                  handleSizeSelect(size)
                }}
              >
                {size}
              </Badge>
            ))}
            {sizes.length > 5 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{sizes.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* Display available colors */}
        {colors && colors.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="text-sm font-medium mr-1">Colors:</span>
            <div className="flex gap-1">
              {colors.slice(0, 4).map((color) => (
                <div
                  key={color.name}
                  className={`h-5 w-5 rounded-full border cursor-pointer transition-transform hover:scale-110 ${selectedColor?.name === color.name ? "ring-2 ring-primary ring-offset-1" : ""}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  onClick={(e) => {
                    e.preventDefault()
                    handleColorSelect(color)
                  }}
                />
              ))}
              {colors.length > 4 && <span className="text-xs text-muted-foreground">+{colors.length - 4}</span>}
            </div>
          </div>
        )}

        {/* Selected options display */}
        {(selectedSize || selectedColor) && (
          <div className="mt-2 text-sm font-medium">
            Selected: {selectedSize && `Size: ${selectedSize}`}
            {selectedSize && selectedColor && " | "}
            {selectedColor && (
              <span className="inline-flex items-center">
                Color:
                <span
                  className="inline-block w-3 h-3 rounded-full mx-1"
                  style={{ backgroundColor: selectedColor.hex }}
                />
                {selectedColor.name}
              </span>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button
            ref={buttonRef}
            className="w-full transition-all duration-300 hover:scale-105"
            size="sm"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? <Check className="mr-2 h-4 w-4 animate-bounce" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  )
}

