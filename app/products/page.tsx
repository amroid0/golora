import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductsFilter } from "@/components/products-filter"

interface ProductsPageProps {
  searchParams: {
    categories?: string
    min_price?: string
    max_price?: string
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const supabase = createClient()

  // Build the query
  let query = supabase.from("products").select("*, categories(*)").eq("is_active", true)

  // Apply category filter
  if (searchParams.categories) {
    const categoryIds = searchParams.categories.split(",")
    query = query.in("category_id", categoryIds)
  }

  // Apply price range filter
  if (searchParams.min_price) {
    query = query.gte("price", Number.parseFloat(searchParams.min_price))
  }
  if (searchParams.max_price) {
    query = query.lte("price", Number.parseFloat(searchParams.max_price))
  }

  // Order by creation date
  query = query.order("created_at", { ascending: false })

  // Execute the query
  const { data: products } = await query

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("*").order("name", { ascending: true })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">All Products</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <ProductsFilter categories={categories || []} />
            </div>

            <div className="md:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products && products.length > 0 ? (
                  products.map((product) => <ProductCard key={product.id} product={product} />)
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

