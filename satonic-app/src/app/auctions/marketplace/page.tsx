'use client'

import { useState, useEffect } from 'react'
import { AuctionCard } from '@/components/auction/AuctionCard'
import api, { Auction } from '@/lib/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function MarketplacePage() {
  const router = useRouter()
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  // Add a page visit counter to ensure refreshing on return visits
  useEffect(() => {
    fetchAuctions();
    // This ensures proper refresh after navigation
    const refreshTimer = setTimeout(() => {
      fetchAuctions();
    }, 300);
    
    return () => clearTimeout(refreshTimer);
  }, [activeTab]);
  
  // This ensures we have the latest auctions when the page is visited
  useEffect(() => {
    window.addEventListener('focus', fetchAuctions);
    return () => window.removeEventListener('focus', fetchAuctions);
  }, []);

  const fetchAuctions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.auction.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch auctions');
      }

      setAuctions(response.data?.auctions || []);
      console.log('Loaded auctions:', response.data?.auctions?.length || 0);
    } catch (error: any) {
      console.error('Error fetching auctions:', error);
      setError(error.message || 'An error occurred while fetching auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAuctions();
    toast.success('Refreshed auctions');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/10 pointer-events-none rounded-lg blur-xl -z-10"></div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
          NFT Marketplace
        </h1>
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-950/30">
            Refresh
          </Button>
          <Link href="/auctions/create">
            <Button className="bg-neon-red hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              Create Auction
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-black/50 border border-red-500/20">
          <TabsTrigger value="active" className="data-[state=active]:bg-red-950 data-[state=active]:text-red-400">Active</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-red-950 data-[state=active]:text-red-400">Completed</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-red-950 data-[state=active]:text-red-400">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="text-red-500 animate-pulse text-xl">
                <span className="inline-block animate-spin mr-2">⟳</span>
                Loading auctions...
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500 p-6 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchAuctions} className="bg-red-500 hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                Retry
              </Button>
            </div>
          ) : auctions.length === 0 ? (
            <div className="text-center py-12 bg-black/50 border border-red-500/20 rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <p className="text-red-400 mb-6 text-xl">No auctions found</p>
              <Link href="/auctions/create">
                <Button className="bg-neon-red hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                  Create Your First Auction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.auction_id} auction={{
                  id: auction.auction_id,
                  title: auction.title || `NFT #${auction.nft_id}`,
                  image: `https://placehold.co/600x400/black/red?text=NFT`,
                  currentBid: auction.current_bid ? auction.current_bid / 100000000 : (auction.start_price ? auction.start_price / 100000000 : 0),
                  endTime: new Date(auction.end_time),
                  creator: auction.seller_address ? auction.seller_address.slice(0, 8) + '...' : 'Unknown Seller'
                }} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
