import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { notFound } from "next/navigation"
import { SupabaseImage } from "@/components/supabase-image"

interface ProductDetailPageProps {
  params: {
    id: string
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = params
  const supabase = createClient()

  const { data: product, error } = await supabase.from("products").select("*, categories(*)").eq("id", id).single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{product.name}</h1>
        </div>
        <Link href={`/admin/products/${id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="rounded-lg border overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <div className="aspect-square relative">
                <SupabaseImage
                  src={product.images[0]}
                  alt={product.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {product.images.slice(1, 5).map((image, index) => (
                <div key={index} className="aspect-square rounded-md overflow-hidden border">
                  <SupabaseImage
                    src={image}
                    alt={`${product.name} - Image ${index + 2}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {product.images.length > 5 && (
                <div className="aspect-square rounded-md overflow-hidden border bg-muted flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">+{product.images.length - 5} more</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Product ID</h2>
              <p className="font-mono text-sm">{product.id}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Slug</h2>
              <p className="font-mono text-sm">{product.slug}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Category</h2>
              <p>{product.categories?.name || "Uncategorized"}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Status</h2>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.is_active ? "Active" : "Inactive"}
                </span>
                {product.is_featured && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                    Featured
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Price</h2>
              <p className="font-medium">${product.price.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Sale Price</h2>
              <p>{product.sale_price ? `$${product.sale_price.toFixed(2)}` : "No sale price"}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Inventory</h2>
              <p>{product.inventory_count} units</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Created At</h2>
              <p>{new Date(product.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Description</h2>
            <p className="text-sm">{product.description || "No description provided."}</p>
          </div>

          {/* Display sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Available Sizes</h2>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Display colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">Available Colors</h2>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <div key={color.name} className="flex items-center gap-1">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                    <span className="text-xs">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex space-x-2">
            <Link href={`/products/${product.slug}`} target="_blank">
              <Button variant="outline">View on Store</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

