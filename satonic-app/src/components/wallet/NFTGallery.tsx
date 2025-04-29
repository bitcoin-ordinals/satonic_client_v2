"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { CreateAuctionCard } from "../auction/CreateAuctionCard";

interface NFT {
  inscription_id: string;
  inscription_number: number;
  content_type: string;
  content_url: string;
}

interface Props {
  address: string | null;
}

export default function NFTGallery({ address }: Props) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.ordiscan.com/v1/address/${address}/inscriptions`,
          {
            headers: {
              Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Ensure data.data exists and is an array
        const inscriptions = Array.isArray(result.data) ? result.data : [];
        const imageNFTs = inscriptions.filter((nft: NFT) => nft.content_type.startsWith("image/"));

        setNfts(imageNFTs);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
        setError("Failed to load Ordinals NFTs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [address]);

  const refreshNFTs = () => {
    if (address) {
      setLoading(true);
      // Implement refresh logic if needed after auction creation
    }
  };

  return (
    <Card className="bg-black border-red-500 border-2 mt-6">
      <CardHeader>
        <CardTitle className="text-red-500 font-mono animate-pulse">
          My Ordinals NFTs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-400">Loading NFTs...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.inscription_id}
                className="bg-black/50 p-4 rounded-lg border border-red-500/50"
              >
                <img
                  src={nft.content_url}
                  alt={`Ordinal #${nft.inscription_number}`}
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <p className="text-red-500 font-mono text-sm mb-2">
                  Ordinal #{nft.inscription_number}
                </p>
                <CreateAuctionCard nft={nft} onSuccess={refreshNFTs} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No Ordinals NFTs found for this address.</p>
        )}
      </CardContent>
    </Card>
  );
}
