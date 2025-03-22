import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductImageGallery } from "@/components/product-image-gallery"
import { ProductDetail } from "@/components/product-detail"
import { ProductCard } from "@/components/product-card"

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = params
  const supabase = createClient()

  try {
    // Fetch product by slug
    const { data: product, error } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error || !product) {
      console.error("Error fetching product:", error)
      notFound()
    }

    // Fetch related products
    const { data: relatedProducts } = await supabase
      .from("products")
      .select("*, categories(*)")
      .eq("is_active", true)
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(4)

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <ProductImageGallery images={product.images || []} productName={product.name} />
              </div>

              <div>
                <ProductDetail product={product} />
              </div>
            </div>

            {relatedProducts && relatedProducts.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6">Related Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  } catch (error) {
    console.error("Error in ProductPage:", error)
    notFound()
  }
}

