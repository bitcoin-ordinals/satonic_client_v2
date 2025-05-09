'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { service } from '@/lib/serviceProvider'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { WalletModal } from '@/components/wallet/WalletModal'
import Image from 'next/image'
import Link from 'next/link'

export default function AuctionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [auction, setAuction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  
  // Wallet connection state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [installedWallets, setInstalledWallets] = useState({
    unisat: false,
    xverse: false,
    metamask: false,
    phantom: false,
  })

  useEffect(() => {
    fetchAuctionDetails()
    checkWalletConnection()
  }, [id])

  const fetchAuctionDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await service.auction.get(id)

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch auction details')
      }

      setAuction(response.data)
    } catch (error: any) {
      console.error('Error fetching auction details:', error)
      setError(error.message || 'An error occurred while fetching auction details')
    } finally {
      setLoading(false)
    }
  }

  const checkWalletConnection = async () => {
    if (typeof window === 'undefined') return
    
    // Check for installed extensions
    const hasUnisat = !!(window as any).unisat
    
    setInstalledWallets(prev => ({
      ...prev,
      unisat: hasUnisat,
    }))

    // Check if already connected
    if (hasUnisat) {
      try {
        const accounts = await (window as any).unisat.getAccounts()
        if (accounts && accounts.length > 0) {
          setWalletConnected(true)
          setWalletAddress(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  const handleWalletSelect = async (type: string) => {
    if (type === 'unisat' && installedWallets.unisat) {
      try {
        const accounts = await (window as any).unisat.requestAccounts()
        if (accounts && accounts.length > 0) {
          setWalletConnected(true)
          setWalletAddress(accounts[0])
          
          // Close the modal
          setIsWalletModalOpen(false)
          
          toast.success('Wallet connected successfully')
        }
      } catch (error: any) {
        console.error('Error connecting wallet:', error)
        toast.error(error.message || 'Failed to connect wallet')
      }
    }
  }

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletConnected) {
      setIsWalletModalOpen(true)
      return
    }
    
    setProcessing(true)
    
    try {
      const bidAmountBTC = parseFloat(bidAmount)
      
      if (isNaN(bidAmountBTC) || bidAmountBTC <= 0) {
        throw new Error('Please enter a valid bid amount')
      }
      
      // Convert BTC to satoshis for the API
      const bidAmountSats = Math.floor(bidAmountBTC * 100000000)
      
      // Check if bid is higher than current bid
      const currentBidSats = auction.current_bid || auction.start_price
      if (bidAmountSats <= currentBidSats) {
        throw new Error('Bid must be higher than the current bid')
      }
      
      // Place bid API call
      const response = await service.auction.placeBid({
        auction_id: id,
        amount: bidAmountSats,
        wallet_id: walletAddress || ''
      })
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to place bid')
      }
      
      toast.success('Bid placed successfully!')
      
      // Refresh auction details
      fetchAuctionDetails()
      
      // Reset bid amount
      setBidAmount('')
    } catch (error: any) {
      console.error('Error placing bid:', error)
      toast.error(error.message || 'Failed to place bid')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-pulse text-neon-red">Loading auction details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchAuctionDetails} className="bg-red-500 hover:bg-red-600 mr-2">
            Retry
          </Button>
          <Button onClick={() => router.push('/auctions/marketplace')} variant="outline">
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Auction not found</p>
          <Button onClick={() => router.push('/auctions/marketplace')} className="bg-neon-red hover:bg-neon-red-dark">
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  const currentBidBTC = auction.current_bid ? auction.current_bid / 100000000 : auction.start_price / 100000000
  const endTime = new Date(auction.end_time)
  const isEnded = endTime < new Date()
  const timeLeft = isEnded ? 'Auction ended' : `${Math.floor((endTime.getTime() - Date.now()) / 3600000)}h remaining`
  const imageUrl = auction.nft?.image_url || `https://placehold.co/600x400/black/red?text=NFT+#${auction.nft_id}`
  const isPlaceholder = imageUrl.includes('placehold.co')

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square relative rounded-lg overflow-hidden">
            {isPlaceholder ? (
              <img
                src={imageUrl}
                alt={auction.nft?.title || `NFT #${auction.nft_id}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={imageUrl}
                alt={auction.nft?.title || `NFT #${auction.nft_id}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={true}
              />
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">
            {auction.nft?.title || `NFT #${auction.nft_id}`}
          </h1>
          <p className="text-gray-400 mb-6">
            Created by {auction.seller_wallet_id.slice(0, 8)}...
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Auction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Bid</span>
                <span className="font-bold">{currentBidBTC} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={isEnded ? 'text-red-500' : 'text-green-500'}>
                  {isEnded ? 'Ended' : 'Active'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time Left</span>
                <span>{timeLeft}</span>
              </div>
              <Separator />
              {!isEnded ? (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div>
                    <label htmlFor="bidAmount" className="block text-gray-400 mb-1">
                      Your Bid (BTC)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        id="bidAmount"
                        type="number"
                        placeholder={`Min. ${(currentBidBTC + 0.00001).toFixed(8)}`}
                        min={(currentBidBTC + 0.00001).toFixed(8)}
                        step="0.00000001"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1 bg-black border border-gray-700 rounded-md p-2"
                        required
                      />
                      <Button 
                        type="submit" 
                        className="bg-neon-red hover:bg-neon-red-dark"
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : walletConnected ? 'Place Bid' : 'Connect Wallet to Bid'}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-2">
                  <p className="text-red-500">This auction has ended</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-4">
            <Link href="/auctions/marketplace">
              <Button variant="outline">Back to Marketplace</Button>
            </Link>
          </div>
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleWalletSelect}
        installedWallets={installedWallets}
      />
    </div>
  )
} 