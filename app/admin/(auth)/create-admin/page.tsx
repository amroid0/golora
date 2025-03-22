"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateAdminPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAdmin = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/create-admin")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create admin user")
      }

      setSuccess("Admin user created successfully. You can now log in.")
    } catch (error: any) {
      setError(error.message || "Failed to create admin user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create Admin User</CardTitle>
          <CardDescription>Create an admin user for the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div className="text-sm">
            <p>This will create an admin user with the following credentials:</p>
            <p className="mt-2">Email: admin@example.com</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button onClick={handleCreateAdmin} className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Admin User"}
          </Button>
          {success && (
            <Button variant="outline" className="w-full" onClick={() => router.push("/admin/login")}>
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

