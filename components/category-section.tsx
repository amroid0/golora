import Link from "next/link"
import Image from "next/image"
import type { Database } from "@/lib/database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface CategorySectionProps {
  categories: Category[]
}

export function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="bg-muted py-12 md:py-16">
      <div className="container">
        <div className="flex flex-col items-center justify-center space-y-4 text-center animate-fade-in">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Shop by Category</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Browse our collection by category to find exactly what you're looking for
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mt-8">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="aspect-square w-full animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <Image
                  src={`/placeholder.svg?height=300&width=300&text=${category.name}`}
                  alt={category.name}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-all duration-300 group-hover:bg-primary/60">
                <h3 className="text-xl font-bold text-white text-shadow transform transition-all duration-300 group-hover:scale-110">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

