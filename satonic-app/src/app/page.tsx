import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-background/50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            SATONIC
          </h1>
          <p className="text-2xl text-muted-foreground mb-12">
            Discover, bid, and collect rare Bitcoin Ordinals
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/auctions/marketplace">
              <Button size="lg" className="text-lg px-8 py-6">
                Explore Auctions
              </Button>
            </Link>
            <Link href="/auctions/create">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6">
                Create Auction
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <h2 className="text-4xl font-bold mb-12 text-gray-100 border-l-4 border-neon-red pl-4">
          Featured Auctions
        </h2>
        {/* Add grid of featured auctions here */}
      </section>
    </div>
  )
}