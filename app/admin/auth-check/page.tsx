"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

export default function AuthCheckPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { session },
        error: authError,
      } = await supabase.auth.getSession()

      if (authError) {
        throw authError
      }

      setUser(session?.user || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loginAsAdmin = async () => {
    setLoginLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "admin123",
      })

      if (loginError) {
        throw loginError
      }

      await checkAuth()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = async () => {
    setLoginLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Check</h1>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Check if you're currently authenticated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <p>Checking authentication status...</p>
          ) : user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-medium">You are authenticated!</p>
              <div className="bg-muted p-3 rounded-md">
                <p>
                  <strong>User ID:</strong> {user.id}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> {user.role}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-600">You are not authenticated. Try logging in as admin.</p>
          )}
        </CardContent>
        <CardFooter>
          {user ? (
            <Button onClick={logout} disabled={loginLoading}>
              {loginLoading ? "Logging out..." : "Log Out"}
            </Button>
          ) : (
            <Button onClick={loginAsAdmin} disabled={loginLoading}>
              {loginLoading ? "Logging in..." : "Login as Admin"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

