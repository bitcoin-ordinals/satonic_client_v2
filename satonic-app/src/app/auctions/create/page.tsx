"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { api } from '@/lib/api';
import type { NFT, CreateAuctionRequest } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function CreateAuctionContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedNftId = searchParams.get("nft_id");
  const { toast } = useToast();

  const [userNfts, setUserNfts] = useState<NFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auction details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [duration, setDuration] = useState("7"); // Default 7 days

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/auctions/create");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserNfts();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (preselectedNftId && userNfts.length > 0) {
      const nft = userNfts.find(nft => nft.id === preselectedNftId);
      if (nft) {
        setSelectedNft(nft);
      }
    }
  }, [preselectedNftId, userNfts]);

  const fetchUserNfts = async () => {
    try {
      setIsLoading(true);
      const response = await api.nft.getUserNFTs();
      if (response.success && response.data) {
        // Fix: Ensure userNfts is an array before filtering and provide type for nft parameter
        const availableNfts = Array.isArray(response.data.nfts) 
          ? response.data.nfts.filter((nft: NFT) => !nft.auction_id)
          : [];
        setUserNfts(availableNfts);
      } else {
        console.error("Failed to fetch user NFTs:", response.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch your NFTs. Please try again."
        });
      }
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error loading your NFTs. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNftDetails = async (nftId: string) => {
    try {
      const response = await api.nft.getNFT(nftId);
      if (response.success && response.data) {
        setSelectedNft(response.data);
        // Pre-fill title and description from NFT
        setTitle(response.data.title || "");
        setDescription(response.data.description || "");
      }
    } catch (error) {
      console.error("Error fetching NFT details:", error);
    }
  };

  const handleNftSelect = (nftId: string) => {
    if (nftId) {
      fetchNftDetails(nftId);
    } else {
      setSelectedNft(null);
    }
  };

  const handleCreateAuction = async () => {
    if (!selectedNft || !startPrice) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an NFT and set a starting price"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate end time based on duration
      const startTime = new Date();
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + parseInt(duration));

      // Create auction
      const auctionData: CreateAuctionRequest = {
        nft_id: selectedNft.id,
        start_price: parseFloat(startPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        psbt: "placeholder_psbt" // This should be generated properly
      };

      const response = await api.auction.create(auctionData);
      
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Auction created successfully!"
        });
        router.push(`/auctions/${response.data.id}`);
      } else {
        console.error("Failed to create auction:", response.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to create auction. Please try again."
        });
      }
    } catch (error) {
      console.error("Error creating auction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error creating auction. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-10 mx-auto">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Auction</CardTitle>
          <CardDescription>
            List your NFT for auction and set your preferred terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nft">Select NFT to Auction</Label>
            <Select
              value={selectedNft?.id || ""}
              onValueChange={handleNftSelect}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an NFT" />
              </SelectTrigger>
              <SelectContent>
                {userNfts.map((nft) => (
                  <SelectItem key={nft.id} value={nft.id}>
                    {nft.title || nft.inscription_id}
                  </SelectItem>
                ))}
                {userNfts.length === 0 && !isLoading && (
                  <SelectItem value="" disabled>
                    No NFTs available for auction
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {isLoading && (
              <div className="flex items-center space-x-2 mt-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading your NFTs...</span>
              </div>
            )}
          </div>

          {/* Selected NFT preview */}
          {selectedNft && (
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-4">
                {selectedNft.image_url && (
                  <img
                    src={selectedNft.image_url}
                    alt={selectedNft.title || "NFT"}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                )}
                <div>
                  <h3 className="font-medium">{selectedNft.title || selectedNft.inscription_id}</h3>
                  {selectedNft.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedNft.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auction details form */}
          {selectedNft && (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Auction Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your auction"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your auction"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startPrice">Starting Price (sats)</Label>
                  <Input
                    id="startPrice"
                    type="number"
                    value={startPrice}
                    onChange={(e) => setStartPrice(e.target.value)}
                    placeholder="Min. price"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservePrice">Reserve Price (sats, optional)</Label>
                  <Input
                    id="reservePrice"
                    type="number"
                    value={reservePrice}
                    onChange={(e) => setReservePrice(e.target.value)}
                    placeholder="Min. sale price"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCreateAuction}
            disabled={!selectedNft || !startPrice || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Auction"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function CreateAuctionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <CreateAuctionContent />
    </Suspense>
  );
} 
