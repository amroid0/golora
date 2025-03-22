"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Truck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params
  const router = useRouter()
  const supabase = createClient()
  const [order, setOrder] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Check authentication
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login?redirect=/account")
          return
        }

        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single()

        if (orderError || !orderData) {
          throw new Error("Order not found or you don't have permission to view it")
        }

        setOrder(orderData)

        // Fetch order items with product details
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*, product:product_id(*)")
          .eq("order_id", id)

        if (orderItems) {
          setProducts(orderItems)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrderDetails()
  }, [id, router, supabase])

  if (isLoading) {
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

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container py-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Order not found</h3>
                <p className="text-muted-foreground mb-4">{error || "The requested order could not be found."}</p>
                <Link href="/account">
                  <Button>Back to Account</Button>
                </Link>
              </CardContent>
            </Card>
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
          <div className="mb-6">
            <Link href="/account" className="inline-flex items-center text-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Link>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Order #{order.id.substring(0, 8)}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                order.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : order.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : order.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "shipped"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length > 0 ? (
                    <div className="space-y-4">
                      {products.map((item) => {
                        const product = item.product
                        const imageUrl =
                          product?.images && product.images.length > 0
                            ? product.images[0]
                            : `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(product?.name || "Product")}`

                        return (
                          <div key={item.id} className="flex items-center space-x-4 py-2 border-b last:border-0">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                              <Image
                                src={imageUrl || "/placeholder.svg"}
                                alt={product?.name || "Product"}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{product?.name || "Product"}</p>
                              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${item.unit_price.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                ${(item.unit_price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${(order.total_amount - 5.99).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span>$5.99</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total</span>
                          <span>${order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No items found for this order.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="font-medium">Order Date</p>
                    <p>{new Date(order.created_at).toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium">Order Status</p>
                    <div className="flex items-center space-x-2">
                      {order.status === "shipped" || order.status === "delivered" ? (
                        <Truck className="h-4 w-4 text-green-600" />
                      ) : (
                        <Package className="h-4 w-4 text-blue-600" />
                      )}
                      <p>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium">Payment</p>
                    <p>Completed</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.shipping_address ? (
                    <div className="space-y-1">
                      <p>{order.shipping_address.fullName}</p>
                      <p>{order.shipping_address.address}</p>
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                      </p>
                      <p>{order.shipping_address.country}</p>
                      <p className="pt-2">{order.shipping_address.phone}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No shipping address information available.</p>
                  )}
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

