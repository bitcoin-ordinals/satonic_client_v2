"use client"

import { AuthCheck } from '@/components/auth/AuthCheck'
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast";

export default function CreateAuctionPage() {
  return (
    <AuthCheck>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-8">Create Auction</h1>
        <CreateAuction />
      </div>
    </AuthCheck>
  )
}

function CreateAuction() {
  const [formData, setFormData] = useState({
    title: "",
    startingBid: "",
    incrementInterval: "", 
    duration: "24", // Default 24 hours
  })
  const [nfts, setNfts] = useState([])
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [walletAddress, setWalletAddress] = useState("")

  useEffect(() => {
    async function fetchWalletAddress() {
      if (!window.unisat) return;
      try {
        const accounts = await window.unisat.getAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        toast.error("Failed to fetch wallet address");
      }
    }
    fetchWalletAddress();
  }, []);

  useEffect(() => {
    async function fetchNFTs() {
      if (!walletAddress) return;
      try {
        const response = await fetch(
          `https://api.ordiscan.com/v1/address/${walletAddress}/inscriptions`,
          {
            headers: {
              Authorization: `Bearer ${process.env.ORDISCAN_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const inscriptions = Array.isArray(result.data) ? result.data : [];
        const imageNFTs = inscriptions.filter((nft) => nft.content_type.startsWith("image/"));

        setNfts(imageNFTs);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    }
    fetchNFTs();
  }, [walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNFT) {
      toast.error("Please select an NFT");
      return;
    }

    const auctionData = {
      title: formData.title,
      inscriptionId: selectedNFT.inscription_id,
      inscriptionNumber: selectedNFT.inscription_number,
      startingBid: parseFloat(formData.startingBid),
      incrementInterval: parseFloat(formData.incrementInterval),
      duration: parseInt(formData.duration, 10),
    };

    try {
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auctionData)
      });

      if (!response.ok) {
        throw new Error("Failed to create auction");
      }

      toast.success("Auction created successfully!");
      setFormData({ title: "", startingBid: "", incrementInterval: "", duration: "24" });
      setSelectedNFT(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNFTSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = nfts.find(nft => nft.inscription_id === e.target.value);
    setSelectedNFT(selected || null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-neon-red/20 bg-black/50">
        <CardHeader>
          <h1 className="text-2xl font-bold text-center">Create New Auction</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter auction title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nft">Select NFT</Label>
              <select
                id="nft"
                name="nft"
                value={selectedNFT?.inscription_id || ""}
                onChange={handleNFTSelect}
                className="w-full border rounded-md p-2 bg-black text-white"
                required
              >
                <option value="">-- Select an NFT --</option>
                {nfts.map((nft) => (
                  <option key={nft.inscription_id} value={nft.inscription_id}>{`Ordinal #${nft.inscription_number}`}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startingBid">Starting Bid (BTC)</Label>
              <Input
                id="startingBid"
                name="startingBid"
                type="number"
                step="0.00001"
                value={formData.startingBid}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incrementInterval">Increment Interval (BTC)</Label>
              <Input
                id="incrementInterval"
                name="incrementInterval"
                type="number"
                step="0.00001"
                value={formData.incrementInterval}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                step="1"
                min="1"
                value={formData.duration}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-neon-red hover:bg-neon-red-dark">
              Create Auction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
