"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useFavorites } from "@/context/favorites-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag } from "lucide-react"

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites()
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container py-8 text-center">
            <p>Loading...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">My Favorites</h1>
            {favorites.length > 0 && (
              <Button variant="outline" onClick={clearFavorites}>
                Clear All
              </Button>
            )}
          </div>

          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((product) => (
                <div key={product.id} className="animate-fade-in">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-4">
              <Heart className="mx-auto h-16 w-16 text-muted-foreground" />
              <h2 className="text-2xl font-bold">Your favorites list is empty</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Add items to your favorites by clicking the heart icon on products you love.
              </p>
              <Link href="/products">
                <Button className="mt-4">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

