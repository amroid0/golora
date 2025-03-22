"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Heart } from "lucide-react"

export function MobileNav() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)
    }

    checkAuth()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
        Home
      </Link>
      <Link href="/products" className="text-sm font-medium transition-colors hover:text-primary">
        Shop
      </Link>
      <Link href="/categories" className="text-sm font-medium transition-colors hover:text-primary">
        Categories
      </Link>
      <Link href="/about" className="text-sm font-medium transition-colors hover:text-primary">
        About
      </Link>

      <div className="h-px bg-border my-2" />

      {user ? (
        <>
          <Link href="/account" className="text-sm font-medium transition-colors hover:text-primary">
            My Account
          </Link>
          <Link href="/account/orders" className="text-sm font-medium transition-colors hover:text-primary">
            My Orders
          </Link>
          <Link
            href="/favorites"
            className="text-sm font-medium transition-colors hover:text-primary flex items-center"
          >
            <Heart className="mr-2 h-4 w-4" />
            My Favorites
          </Link>
          <Button variant="ghost" className="justify-start px-2" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary">
            Sign In
          </Link>
          <Link href="/register" className="text-sm font-medium transition-colors hover:text-primary">
            Create Account
          </Link>
        </>
      )}

      <Link href="/favorites" className="text-sm font-medium transition-colors hover:text-primary flex items-center">
        <Heart className="mr-2 h-4 w-4" />
        Favorites
      </Link>
      <Link href="/cart" className="text-sm font-medium transition-colors hover:text-primary">
        Cart
      </Link>
    </div>
  )
}

