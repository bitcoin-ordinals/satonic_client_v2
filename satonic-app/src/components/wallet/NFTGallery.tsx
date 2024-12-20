"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { useEffect, useState } from "react"

interface NFT {
  id: string
  name: string
  image: string
}

interface Props {
  address: string | null
}

export default function NFTGallery({ address }: Props) {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/nfts/${address}`)
        const data = await response.json()
        setNfts(data)
      } catch (error) {
        console.error('Error fetching NFTs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [address])

  return (
    <Card className="bg-black border-red-500 border-2 mt-6">
      <CardHeader>
        <CardTitle className="text-red-500 font-mono animate-pulse">
          My NFTs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-400">Loading NFTs...</p>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="bg-black/50 p-4 rounded-lg border border-red-500/50">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-48 object-cover rounded-lg mb-2" 
                />
                <p className="text-red-500 font-mono text-sm">{nft.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No NFTs found</p>
        )}
      </CardContent>
    </Card>
  )
} 