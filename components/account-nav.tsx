"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Package, CreditCard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function AccountNav() {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const links = [
    {
      name: "Account",
      href: "/account",
      icon: User,
    },
    {
      name: "Orders",
      href: "/account/orders",
      icon: Package,
    },
    {
      name: "Billing",
      href: "/account/billing",
      icon: CreditCard,
    },
  ]

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-1">
        <h3 className="font-medium">My Account</h3>
        <nav className="grid gap-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t pt-4">
        <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

