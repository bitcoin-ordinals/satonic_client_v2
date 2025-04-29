'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, PlusCircle, ExternalLink, Tag } from 'lucide-react'
import { api, NFT } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

export default function NFTDetailPage({ params }: { params: { id: string } }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [nft, setNft] = useState<NFT | null>(null)
  const [isLoadingNFT, setIsLoadingNFT] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (params.id && isAuthenticated) {
      fetchNFT()
    }
  }, [params.id, isAuthenticated])

  const fetchNFT = async () => {
    setIsLoadingNFT(true)
    try {
      const response = await api.nft.getNFT(params.id)
      if (response.success && response.data) {
        setNft(response.data)
      } else {
        toast.error('Failed to fetch NFT details')
        router.push('/nfts')
      }
    } catch (error) {
      console.error('Error fetching NFT:', error)
      toast.error('Failed to fetch NFT details')
      router.push('/nfts')
    } finally {
      setIsLoadingNFT(false)
    }
  }

  if (isLoading || isLoadingNFT) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p>Loading NFT details...</p>
        </div>
      </div>
    )
  }

  if (!nft) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center min-h-[50vh]">
          <p>NFT not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/nfts')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to NFTs
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* NFT Image */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="aspect-square relative">
            {nft.image_url ? (
              <Image
                src={nft.image_url}
                alt={nft.title || 'NFT'}
                fill
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                No Image Available
              </div>
            )}
          </div>
        </Card>

        {/* NFT Details */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {nft.title || `Inscription #${nft.inscription_id.slice(0, 8)}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {nft.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p>{nft.description}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Collection</h3>
                <p>{nft.collection || 'Uncategorized'}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Inscription ID</h3>
                <div className="flex items-center">
                  <code className="font-mono text-sm">{nft.inscription_id}</code>
                  <a
                    href={`https://ordinals.com/inscription/${nft.inscription_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {nft.auction_id ? (
                <div className="pt-2">
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center">
                    <Tag className="h-4 w-4 text-amber-500 mr-2" />
                    <span>This NFT is currently listed in an auction</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
            <CardFooter>
              {!nft.auction_id && (
                <Link href={`/auctions/create?nft=${nft.id}`}>
                  <Button>
                    <Tag className="mr-2 h-4 w-4" /> Create Auction
                  </Button>
                </Link>
              )}
            </CardFooter>
          </Card>

          {/* Metadata Card */}
          {nft.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-md overflow-auto text-xs">
                  {JSON.stringify(nft.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 