'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuctionList } from "@/components/auction/AuctionList"
import { api, Auction } from "@/lib/api"

// Sample auctions to use as fallback
const FALLBACK_AUCTIONS: Auction[] = [
  {
    auction_id: "1",
    nft_id: "1",
    title: "Bitcoin Abstract #01",
    seller_address: "tb1qnardpcz8ry0xkt4n6w6jnve8vqw2tt7uw24mlg",
    start_price: 0.01,
    current_bid: 0.015,
    start_time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    end_time: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    status: "active",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    auction_id: "2",
    nft_id: "2",
    title: "Satoshi Legacy",
    seller_address: "tb1qnardpcz8ry0xkt4n6w6jnve8vqw2tt7uw24mlg",
    start_price: 0.05,
    current_bid: 0.075,
    start_time: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    end_time: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 day from now
    status: "active",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    auction_id: "3",
    nft_id: "3",
    title: "Ordinal #123",
    seller_address: "tb1qnardpcz8ry0xkt4n6w6jnve8vqw2tt7uw24mlg",
    start_price: 0.02,
    current_bid: 0.03,
    start_time: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    end_time: new Date(Date.now() + 86400000 * 4).toISOString(), // 4 days from now
    status: "active",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
  },
];

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setIsLoading(true)
        setError('')
        
        const response = await api.auction.getAll({
          status: 'active',
          page: 1,
          page_size: 10
        })
        
        if (response.success) {
          setAuctions(response.data.auctions)
        } else {
          console.error('Failed to fetch auctions:', response.error)
          if (retryCount < 2) {
            // Retry up to 2 times with exponential backoff
            const timeout = Math.pow(2, retryCount) * 1000
            setTimeout(() => {
              setRetryCount(prev => prev + 1)
            }, timeout)
          } else {
            // Use fallback data after 2 retries
            setError('Using sample data - API connection failed')
            setAuctions(FALLBACK_AUCTIONS)
          }
        }
      } catch (err) {
        console.error('Error fetching auctions:', err)
        if (retryCount < 2) {
          // Retry up to 2 times with exponential backoff
          const timeout = Math.pow(2, retryCount) * 1000
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, timeout)
        } else {
          // Use fallback data after 2 retries
          setError('Using sample data - API connection failed')
          setAuctions(FALLBACK_AUCTIONS)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchAuctions()
  }, [retryCount])

  const handleRetry = () => {
    setRetryCount(0)
  }

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
      
      <section className="max-w-4xl mx-auto px-4 pb-24 w-full">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-gray-100 border-l-4 border-primary pl-4">
            Featured Auctions
          </h2>
          
          {error && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetry}
              className="text-xs">
              Retry
            </Button>
          )}
        </div>
        
        {error && (
          <div className="p-3 mb-6 border border-yellow-500/50 bg-yellow-500/10 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <AuctionList auctions={auctions} isLoading={isLoading} limit={5} />
        
        <div className="mt-8 text-center">
          <Link href="/auctions/marketplace">
            <Button variant="outline">View All Auctions</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}