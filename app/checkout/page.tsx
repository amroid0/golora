"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useCart } from "@/context/cart-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { items, subtotal, clearCart } = useCart()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const shipping = 5.99
  const total = subtotal + shipping

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  })

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        // Pre-fill email if available
        setFormData((prev) => ({
          ...prev,
          email: session.user.email || "",
        }))
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [supabase.auth])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to place an order")
      }

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            user_id: session.user.id,
            status: "pending",
            total_amount: total,
            shipping_address: formData,
          },
        ])
        .select()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order[0].id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.sale_price || item.product.price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart and redirect to success page
      clearCart()
      toast({
        title: "Order placed successfully",
        description: "Thank you for your purchase!",
      })

      router.push(`/checkout/success?order_id=${order[0].id}`)
    } catch (error: any) {
      setError(error.message || "Failed to place order")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container py-8">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Required</CardTitle>
                  <CardDescription>You need to be logged in to complete your purchase</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Please sign in to your account or create a new account to continue with checkout.</p>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Link href="/login?redirect=/checkout" className="w-full">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register?redirect=/checkout" className="w-full">
                    <Button variant="outline" className="w-full">
                      Create Account
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container py-8">
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">You need to add items to your cart before checking out.</p>
              <Button onClick={() => router.push("/products")}>Browse Products</Button>
            </div>
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
          <h1 className="text-3xl font-bold mb-6">Checkout</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>Enter your shipping details to complete your order</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" name="city" value={formData.city} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" name="state" value={formData.state} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} required />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" name="country" value={formData.country} onChange={handleChange} required />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Processing..." : "Place Order"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Review your order before placing it</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => {
                      const { product, quantity } = item
                      const price = product.sale_price || product.price

                      return (
                        <div key={product.id} className="flex justify-between">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-muted-foreground"> × {quantity}</span>
                            {item.selectedSize && (
                              <div className="text-sm text-muted-foreground">Size: {item.selectedSize}</div>
                            )}
                            {item.selectedColor && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                Color:
                                <span
                                  className="inline-block w-3 h-3 rounded-full mx-1"
                                  style={{ backgroundColor: item.selectedColor.hex }}
                                />
                                {item.selectedColor.name}
                              </div>
                            )}
                          </div>
                          <span>${(price * quantity).toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

