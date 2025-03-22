import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Eye } from "lucide-react"

export default async function AdminCustomersPage() {
  const supabase = createClient()

  // Fetch orders with user_id to get a list of customers
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("user_id, shipping_address")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("Error fetching orders:", ordersError)
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Customers</h1>
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            Error fetching customers: {ordersError.message}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Extract unique user IDs and their latest shipping info
  const uniqueCustomers = new Map()

  orders?.forEach((order) => {
    if (order.user_id && !uniqueCustomers.has(order.user_id)) {
      uniqueCustomers.set(order.user_id, {
        id: order.user_id,
        email: order.shipping_address?.email || "N/A",
        name: order.shipping_address?.fullName || "N/A",
        lastOrder: new Date().toLocaleDateString(), // We'll assume this is the latest order
      })
    }
  })

  const customers = Array.from(uniqueCustomers.values())

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Customers</h1>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Last Order</th>
                  <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle font-medium">{customer.id.substring(0, 8)}</td>
                      <td className="p-4 align-middle">{customer.name}</td>
                      <td className="p-4 align-middle">{customer.email}</td>
                      <td className="p-4 align-middle">{customer.lastOrder}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/customers/${customer.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

