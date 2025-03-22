"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package } from "lucide-react"
import Link from "next/link"

export default function OrdersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login?redirect=/account/orders")
        return
      }

      const { data: userOrders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      setOrders(userOrders || [])
      setIsLoading(false)
    }

    fetchOrders()
  }, [router, supabase])

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

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">My Orders</h1>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div>
                        <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span>Items:</span>
                        <span>{order.order_items?.length || 0}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Total:</span>
                        <span>${order.total_amount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Link href={`/account/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Package className="mr-2 h-4 w-4" />
                          View Order
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                <Link href="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

