"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

interface DeleteCustomerPageProps {
  params: {
    id: string
  }
}

export default function DeleteCustomerPage({ params }: DeleteCustomerPageProps) {
  const { id } = params
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, anonymize the customer's orders instead of deleting them
      const { error: ordersError } = await supabase.from("orders").update({ user_id: null }).eq("user_id", id)

      if (ordersError) {
        throw new Error(`Failed to anonymize customer orders: ${ordersError.message}`)
      }

      toast({
        title: "Customer data removed",
        description: "The customer's data has been anonymized successfully.",
      })

      router.push("/admin/customers")
    } catch (err: any) {
      setError(err.message || "An error occurred while removing the customer data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/admin/customers/${id}`}>
          <Button variant="outline" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Remove Customer Data</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Confirm Data Removal</CardTitle>
          <CardDescription>
            Are you sure you want to remove this customer's data? This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-muted-foreground mb-4">Removing this customer's data will:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-4">
            <li>Anonymize their order history</li>
            <li>Remove the connection between orders and this customer</li>
            <li>Preserve order data for business records</li>
          </ul>
          <p className="font-medium text-destructive">This action cannot be reversed.</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/admin/customers/${id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Processing..." : "Remove Customer Data"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

