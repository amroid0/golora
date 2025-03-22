"use client"

import Link from "next/link"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { useCart } from "@/context/cart-context"
import { useRouter } from "next/navigation"
import { SupabaseImage } from "@/components/supabase-image"

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart()
  const router = useRouter()

  const shipping = 5.99
  const total = subtotal + shipping

  const handleCheckout = () => {
    router.push("/checkout")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="rounded-lg border shadow-sm">
                  <div className="p-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Product</th>
                          <th className="text-center p-4">Quantity</th>
                          <th className="text-right p-4">Price</th>
                          <th className="text-right p-4">Total</th>
                          <th className="text-right p-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => {
                          const { product, quantity } = item
                          const price = product.sale_price || product.price
                          const imageUrl =
                            product.images && product.images.length > 0
                              ? product.images[0]
                              : `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(product.name)}`

                          return (
                            <tr key={product.id} className="border-b">
                              <td className="p-4">
                                <div className="flex items-center space-x-4">
                                  <div className="relative h-20 w-20 flex-shrink-0">
                                    <SupabaseImage
                                      src={imageUrl || "/placeholder.svg"}
                                      alt={product.name}
                                      width={80}
                                      height={80}
                                      className="rounded-md"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{product.name}</h3>
                                    {item.selectedSize && (
                                      <p className="text-sm text-muted-foreground">Size: {item.selectedSize}</p>
                                    )}
                                    {item.selectedColor && (
                                      <p className="text-sm text-muted-foreground flex items-center">
                                        Color:
                                        <span
                                          className="inline-block w-3 h-3 rounded-full mx-1"
                                          style={{ backgroundColor: item.selectedColor.hex }}
                                        />
                                        {item.selectedColor.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-r-none"
                                    onClick={() => updateQuantity(product.id, quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => updateQuantity(product.id, Number.parseInt(e.target.value))}
                                    className="h-8 w-12 rounded-none text-center"
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-l-none"
                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                              </td>
                              <td className="p-4 text-right">${price.toFixed(2)}</td>
                              <td className="p-4 text-right">${(price * quantity).toFixed(2)}</td>
                              <td className="p-4 text-right">
                                <Button variant="ghost" size="icon" onClick={() => removeItem(product.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div>
                <div className="rounded-lg border shadow-sm p-6">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  <div className="space-y-2">
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
                  <Button className="w-full mt-6" onClick={handleCheckout}>
                    Proceed to Checkout
                  </Button>
                </div>

                <div className="mt-6">
                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Looks like you haven't added any products to your cart yet.</p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

