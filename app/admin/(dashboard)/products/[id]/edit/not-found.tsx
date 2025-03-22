import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ProductEditNotFound() {
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/admin/products">
          <Button variant="outline" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Product Not Found</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">The product you're trying to edit could not be found</h2>
        <p className="text-muted-foreground mb-6">The product may have been deleted or doesn't exist.</p>
        <Link href="/admin/products">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </Link>
      </div>
    </div>
  )
}

