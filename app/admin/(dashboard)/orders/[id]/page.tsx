import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UpdateOrderStatus } from "@/components/admin/update-order-status"

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = params
  const supabase = createClient()

  // Fetch order details
  const { data: order } = await supabase.from("orders").select("*, order_items(*, products(*))").eq("id", id).single()

  if (!order) {
    notFound()
  }

  // Get user details if available
  let user = null
  if (order.user_id) {
    const { data } = await supabase.auth.admin.getUserById(order.user_id)
    user = data.user
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order Details</h1>
        <UpdateOrderStatus orderId={order.id} initialStatus={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Items included in this order</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-center p-2">Quantity</th>
                  <th className="text-right p-2">Unit Price</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.products?.name || "Unknown Product"}</td>
                    <td className="p-2 text-center">{item.quantity}</td>
                    <td className="p-2 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="p-2 text-right">${(item.unit_price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="p-2 text-right font-medium">
                    Subtotal:
                  </td>
                  <td className="p-2 text-right">${(order.total_amount - 5.99).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-2 text-right font-medium">
                    Shipping:
                  </td>
                  <td className="p-2 text-right">$5.99</td>
                </tr>
                <tr>
                  <td colSpan={3} className="p-2 text-right font-bold">
                    Total:
                  </td>
                  <td className="p-2 text-right font-bold">${order.total_amount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Order ID:</span>
                <span>{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Payment:</span>
                <span>Completed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user ? (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{order.shipping_address?.fullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{user.email}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{order.shipping_address?.fullName || "Guest"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{order.shipping_address?.email || "N/A"}</span>
                  </div>
                </>
              )}

              <div className="pt-2 border-t mt-2">
                <h3 className="font-medium mb-1">Shipping Address:</h3>
                <p>{order.shipping_address?.address || "N/A"}</p>
                <p>
                  {order.shipping_address?.city || "N/A"}, {order.shipping_address?.state || "N/A"}{" "}
                  {order.shipping_address?.zipCode || "N/A"}
                </p>
                <p>{order.shipping_address?.country || "N/A"}</p>
                <p>Phone: {order.shipping_address?.phone || "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

