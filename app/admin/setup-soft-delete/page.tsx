"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function SetupSoftDeletePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const setupSoftDelete = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/setup-soft-delete")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to set up soft delete")
      }

      setSuccess("Soft delete functionality has been set up successfully.")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Setup Soft Delete</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Set Up Soft Delete for Products</CardTitle>
          <CardDescription>
            This will add an 'is_deleted' column to the products table and create a function for soft deleting products.
            This helps avoid foreign key constraint errors when deleting products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground mb-4">
            When you delete a product that has associated order items, you'll encounter a foreign key constraint error.
            Soft delete solves this by marking products as deleted without actually removing them from the database.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/admin/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
          <Button onClick={setupSoftDelete} disabled={isLoading}>
            {isLoading ? "Setting up..." : "Set Up Soft Delete"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

