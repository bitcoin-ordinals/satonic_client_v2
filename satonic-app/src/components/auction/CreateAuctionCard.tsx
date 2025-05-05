"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { api } from "@/lib/api"

interface NFT {
  inscription_id: string;
  inscription_number: number;
  content_type: string;
  content_url: string;
  id?: string; // Added to support both mock and real NFTs
}

interface CreateAuctionCardProps {
  nft: NFT;
  onSuccess?: () => void;
}

export function CreateAuctionCard({ nft, onSuccess }: CreateAuctionCardProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    startingBid: "",
    duration: "24", // Default 24 hours
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const startingBidBTC = parseFloat(formData.startingBid);
      const durationHours = parseInt(formData.duration);
      
      if (isNaN(startingBidBTC) || startingBidBTC <= 0) {
        throw new Error('Please enter a valid starting bid');
      }
      
      if (isNaN(durationHours) || durationHours < 1 || durationHours > 168) {
        throw new Error('Duration must be between 1 and 168 hours');
      }
      
      // Convert BTC to satoshis for the API
      const startPriceSats = Math.floor(startingBidBTC * 100000000);
      
      // Calculate start and end times
      const now = new Date();
      const endTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));
      
      // Generate dummy PSBT for mock implementation
      const dummyPsbt = `psbt_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create auction API call
      const response = await api.auction.create({
        nft_id: nft.id || nft.inscription_id, // Use id if available, otherwise use inscription_id
        start_price: startPriceSats,
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        psbt: dummyPsbt,
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create auction');
      }
      
      toast.success("Auction created successfully!");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating auction:", error);
      toast.error(error.message || "Failed to create auction. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-neon-red hover:bg-neon-red-dark mt-2"
        >
          Create Auction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black border-neon-red/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Auction for Ordinal #{nft.inscription_number}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center mb-4">
          <img
            src={nft.content_url}
            alt={`Ordinal #${nft.inscription_number}`}
            className="w-32 h-32 object-cover rounded-lg"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startingBid">Starting Bid (BTC)</Label>
            <Input
              id="startingBid"
              name="startingBid"
              type="number"
              step="0.00001"
              value={formData.startingBid}
              onChange={handleChange}
              placeholder="0.0"
              required
              className="bg-black border-neon-red/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              max="168"
              required
              className="bg-black border-neon-red/20"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-neon-red hover:bg-neon-red-dark"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Auction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 