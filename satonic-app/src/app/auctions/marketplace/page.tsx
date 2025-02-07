'use client'

import { AuthCheck } from '@/components/auth/AuthCheck'
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface Auction {
  _id: string;
  title: string;
  inscriptionId: string;
  inscriptionNumber: number;
  startingBid: number;
  incrementInterval: number;
  duration: number;
  createdAt: string;
  contentUrl?: string; 
}

export default function MarketplacePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);

  useEffect(() => {
    async function fetchAuctions() {
      try {
        const response = await fetch("/api/auctions");
        if (!response.ok) throw new Error("Failed to fetch auctions");

        const data: Auction[] = await response.json();

        const auctionsWithImages = await Promise.all(
          data.map(async (auction) => {
            try {
              const inscriptionRes = await fetch(
                `https://api.ordiscan.com/v1/inscription/${auction.inscriptionId}`,
                {
                  headers: {
                    Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!inscriptionRes.ok) {
                console.error(
                  `Failed to fetch inscription for ${auction.inscriptionId}`
                );
                return { ...auction, contentUrl: null };
              }

              const inscriptionData = await inscriptionRes.json();
              return { ...auction, contentUrl: inscriptionData.data.content_url };
            } catch (error) {
              console.error("Error fetching inscription image:", error);
              return { ...auction, contentUrl: null };
            }
          })
        );

        setAuctions(auctionsWithImages);
      } catch (error) {
        console.error("Error fetching auctions:", error);
      }
    }

    fetchAuctions();
  }, []);

  return (
    <AuthCheck>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-8">NFT Marketplace</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {auctions.length === 0 ? (
            <p className="text-center text-gray-500">No auctions available.</p>
          ) : (
            auctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} />
            ))
          )}
        </div>
      </div>
    </AuthCheck>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  return (
    <Card className="border-neon-red/20 bg-black/50">
      <CardHeader className="p-4">
        <h2 className="text-xl font-bold">{auction.title}</h2>
      </CardHeader>
      <CardContent className="p-4">
        {auction.contentUrl && (
          <div className="mb-4">
            <Image
              src={auction.contentUrl}
              alt={`Ordinal #${auction.inscriptionNumber}`}
              width={300}
              height={300}
              className="rounded-lg w-full h-auto object-cover"
            />
          </div>
        )}
        <p className="text-gray-400">Ordinal #{auction.inscriptionNumber}</p>
        <p className="text-gray-400">Starting Bid: {auction.startingBid} BTC</p>
        <p className="text-gray-400">Increment: {auction.incrementInterval} BTC</p>
        <p className="text-gray-400">Duration: {auction.duration} hrs</p>
      </CardContent>
      <div className="p-4">
        <Link href={`/auctions/${auction._id}`}>
          <Button className="w-full bg-neon-red hover:bg-neon-red-dark">View Auction</Button>
        </Link>
      </div>
    </Card>
  );
}
