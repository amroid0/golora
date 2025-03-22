import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Trash2, Package, Eye } from "lucide-react"

interface CustomerDetailPageProps {
  params: {
    id: string
  }
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = params
  const supabase = createClient()

  // Fetch customer's orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*, shipping_address")
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  if (ordersError || !orders || orders.length === 0) {
    notFound()
  }

  // Get customer info from the first order's shipping address
  const customerInfo = orders[0].shipping_address || {}

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Customer Details</h1>
        </div>
        <Link href={`/admin/customers/${id}/delete`}>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Customer
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Basic details about this customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Customer ID</h3>
                  <p className="text-lg">{id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p className="text-lg">{customerInfo.fullName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="text-lg">{customerInfo.email || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p className="text-lg">{customerInfo.phone || "N/A"}</p>
                </div>
                {customerInfo.address && (
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                    <p className="text-lg">
                      {customerInfo.address}, {customerInfo.city}, {customerInfo.state} {customerInfo.zipCode},{" "}
                      {customerInfo.country}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>Orders placed by this customer</CardDescription>
            </CardHeader>
            <CardContent>
              {orders && orders.length > 0 ? (
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-10 px-4 text-left align-middle font-medium">Order ID</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">Date</th>
                        <th className="h-10 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">Total</th>
                        <th className="h-10 px-4 text-right align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-2 align-middle font-medium">{order.id.substring(0, 8)}</td>
                          <td className="p-2 align-middle">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-2 align-middle">
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
                          </td>
                          <td className="p-2 align-middle text-right">${order.total_amount.toFixed(2)}</td>
                          <td className="p-2 align-middle text-right">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">This customer has not placed any orders yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage this customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/admin/customers/${id}/delete`} className="w-full">
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Customer
                </Button>
              </Link>
              <Link href="/admin/customers" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to Customers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

