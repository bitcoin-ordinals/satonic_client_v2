"use client"

import { AuthCheck } from '@/components/auth/AuthCheck'
import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    image: "",
    startingBid: "",
    duration: "24", // Default 24 hours
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement auction creation logic
    console.log("Form submitted:", formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

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
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="Enter NFT image URL"
                required
              />
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
                placeholder="0.0"
                required
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
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-neon-red hover:bg-neon-red-dark"
            >
              Create Auction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 