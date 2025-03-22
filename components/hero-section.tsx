import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/boutique-background.webp')",
          opacity: 0.8,
        }}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="container relative flex min-h-[500px] flex-col items-center justify-center space-y-4 py-12 text-center md:py-16">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-shadow">
            Elevate Your Style
          </h1>
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed text-shadow-sm">
            Discover the latest trends in men's fashion. Premium quality clothing for the modern man.
          </p>
        </div>
        <div className="flex flex-col gap-2 min-[400px]:flex-row animate-slide-up" style={{ animationDelay: "400ms" }}>
          <Link href="/products">
            <Button size="lg" className="transition-transform hover:scale-105">
              Shop Now
            </Button>
          </Link>
          <Link href="/categories">
            <Button size="lg" variant="outline" className="transition-transform hover:scale-105">
              Explore Categories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

