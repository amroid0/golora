import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default async function CategoriesPage() {
  const supabase = createClient()

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("*").order("name", { ascending: true })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Categories</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories &&
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative overflow-hidden rounded-lg border"
                >
                  <div className="aspect-video w-full">
                    <Image
                      src={`/placeholder.svg?height=300&width=600&text=${category.name}`}
                      alt={category.name}
                      width={600}
                      height={300}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <h2 className="text-2xl font-bold text-white">{category.name}</h2>
                  </div>
                  {category.description && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4 text-white transform translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                      <p>{category.description}</p>
                    </div>
                  )}
                </Link>
              ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

