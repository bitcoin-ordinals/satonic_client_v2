'use client'

import { useState, useEffect } from 'react'
import { Auction, NFT, api } from '@/lib/api'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface AuctionListProps {
  auctions?: Auction[]
  isLoading?: boolean
  limit?: number
}

export function AuctionList({ auctions = [], isLoading = false, limit }: AuctionListProps) {
  const displayAuctions = limit ? auctions.slice(0, limit) : auctions
  const [nftDetails, setNftDetails] = useState<{[key: string]: NFT}>({})
  
  useEffect(() => {
    const fetchNftDetails = async () => {
      if (auctions.length === 0) return
      
      const details: {[key: string]: NFT} = {}
      
      for (const auction of auctions) {
        try {
          const response = await api.nft.getNFT(auction.nft_id)
          if (response.success) {
            details[auction.nft_id] = response.data
          }
        } catch (error) {
          console.error(`Failed to fetch NFT details for ${auction.nft_id}:`, error)
        }
      }
      
      setNftDetails(details)
    }
    
    fetchNftDetails()
  }, [auctions])
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 8
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(limit || 5)].map((_, i) => (
          <div key={i} className="flex items-center p-4 border rounded-lg border-gray-700">
            <Skeleton className="h-16 w-16 rounded mr-4" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (displayAuctions.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No auctions found</p>
  }

  return (
    <div className="space-y-3">
      {displayAuctions.map((auction) => {
        const nft = nftDetails[auction.nft_id]
        
        return (
          <Link href={`/auctions/${auction.auction_id}`} key={auction.auction_id}>
            <div className="flex items-center p-4 border rounded-lg border-gray-700 hover:border-primary transition-colors">
              <div className="h-16 w-16 bg-gray-800 rounded overflow-hidden mr-4 flex-shrink-0">
                {nft?.image_url ? (
                  <div className="relative h-full w-full">
                    <Image 
                      src={nft.image_url} 
                      alt={nft.title || 'NFT'} 
                      fill 
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                    NFT
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {nft?.title || auction.title || `Auction #${auction.auction_id.substring(0, 8)}`}
                </h3>
                <div className="flex text-sm text-muted-foreground">
                  <span className="truncate">
                    Seller: {auction.seller_address.substring(0, 5)}...{auction.seller_address.substring(auction.seller_address.length - 5)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {auction.status === 'active' ? 'Ends' : 'Ended'} {formatDate(auction.end_time)}
                  </span>
                </div>
              </div>
              
              <div className="text-right ml-4">
                <div className="font-semibold text-primary">{formatPrice(auction.current_bid || auction.start_price)} BTC</div>
                <div className="text-xs text-muted-foreground">
                  {auction.current_bid ? 'Current bid' : 'Starting price'}
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
} 