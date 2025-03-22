"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/client"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [orderDetails, setOrderDetails] = useState<any>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return

      const supabase = createClient()
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", orderId).single()

      if (data) {
        setOrderDetails(data)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your order has been received and is being processed.
            </p>

            {orderDetails && (
              <div className="bg-muted p-4 rounded-lg text-left mb-6">
                <h2 className="font-medium mb-2">Order Details</h2>
                <p>Order ID: {orderDetails.id}</p>
                <p>Date: {new Date(orderDetails.created_at).toLocaleDateString()}</p>
                <p>Total: ${orderDetails.total_amount.toFixed(2)}</p>
              </div>
            )}

            <div className="flex flex-col space-y-4">
              <Link href="/products">
                <Button className="w-full">Continue Shopping</Button>
              </Link>
              <Link href="/account/orders">
                <Button variant="outline" className="w-full">
                  View Your Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

