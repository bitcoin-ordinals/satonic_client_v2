'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { PlusCircle, ArrowRight } from 'lucide-react'
import { api, NFT } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function NFTsPage() {
  const { isAuthenticated } = useAuth()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchNFTs()
    }
  }, [isAuthenticated])

  const fetchNFTs = async () => {
    setIsLoadingNFTs(true)
    try {
      const response = await api.nft.getUserNFTs()
      if (response.success && response.data) {
        setNfts(response.data.nfts)
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setIsLoadingNFTs(false)
    }
  }

  return (
    <AuthGuard message="Connect your wallet to view your NFT collection">
      <div className="container mx-auto py-10">
        {isLoadingNFTs ? (
          <div className="flex justify-center items-center min-h-[50vh]">
            <p>Loading NFTs...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">Your NFTs</h1>
              <Link href="/nfts/import">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Import NFT
                </Button>
              </Link>
            </div>

            {nfts.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center border rounded-lg p-8 bg-muted/20">
                <h2 className="text-2xl font-semibold mb-2">No NFTs Found</h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  You don't have any NFTs in your collection yet. Import your first NFT to get started.
                </p>
                <Link href="/nfts/import">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Import Your First NFT
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map((nft) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  )
}

const NFTCard = ({ nft }: { nft: NFT }) => {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        {nft.image_url ? (
          <Image
            src={nft.image_url}
            alt={nft.title || 'NFT'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            No Image
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-bold truncate">{nft.title || `NFT #${nft.id.slice(0, 8)}`}</h3>
        <p className="text-sm text-muted-foreground truncate">{nft.collection || 'Uncategorized'}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">ID: </span>
          <span className="font-mono">{nft.inscription_id.slice(0, 8)}...</span>
        </div>
        <Link href={`/nfts/${nft.id}`}>
          <Button variant="ghost" size="sm">
            View <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
} 