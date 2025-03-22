"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateOrderStatus } from "@/app/actions/order-actions"
import { useToast } from "@/hooks/use-toast"

interface UpdateOrderStatusProps {
  orderId: string
  initialStatus: string
}

export function UpdateOrderStatus({ orderId, initialStatus }: UpdateOrderStatusProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleUpdateStatus = async () => {
    setIsLoading(true)

    try {
      const result = await updateOrderStatus(orderId, status)

      if (result.success) {
        toast({
          title: "Status updated",
          description: "The order status has been updated successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to update status")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleUpdateStatus} disabled={isLoading || status === initialStatus}>
        {isLoading ? "Updating..." : "Update Status"}
      </Button>
    </div>
  )
}

