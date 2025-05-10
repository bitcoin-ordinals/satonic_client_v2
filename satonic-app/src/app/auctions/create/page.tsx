"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { api } from '@/lib/api';
import { Loader2, Copy, ChevronRight,  Sparkles, Calendar,} from 'lucide-react';
import { useUnisat } from '@/hooks/useUnisat';
import { format, set } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { NFT, CreateAuctionRequest } from '@/lib/api';

function CreateAuctionContent() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { connect } = useUnisat();

  const [walletNfts, setWalletNfts] = useState<NFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);

  // Auction details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [durationType, setDurationType] = useState("quick"); // "quick" or "custom"
  const [duration, setDuration] = useState("1"); // Default 1 minute
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 1); // Default end time is current time + 1 minute
    return date;
  });
  const [startType, setStartType] = useState("now"); // "now" or "scheduled"

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/auctions/create");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.wallets && user.wallets.length > 0) {
      fetchWalletNfts();
    }
  }, [isAuthenticated, user]);

  const fetchWalletNfts = async () => {
    if (!user?.wallets || user.wallets.length === 0) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Create an array to store all NFTs
      let allNfts: NFT[] = [];
      
      // Fetch NFTs from each wallet
      for (const wallet of user.wallets) {
        const walletAddress = wallet.address;
        
        if (!walletAddress) continue;
        
        const res = await api.nft.getNFTs(walletAddress);
        
        if (res.success && 'data' in res && res.data) {
          // Process NFTs and add wallet information
          if (Array.isArray(res.data)) {
            const walletNfts = res.data.map((nft: any) => ({
              ...nft,
              metadata: nft.metadata || {},
              wallet_address: walletAddress // Store the wallet address with each NFT
            }));
            allNfts = [...allNfts, ...walletNfts];
          } 
          else if (res.data.nfts && Array.isArray(res.data.nfts)) {
            const walletNfts = res.data.nfts.map((nft: NFT) => ({
              ...nft,
              metadata: nft.metadata || {},
              wallet_address: walletAddress // Store the wallet address with each NFT
            }));
            allNfts = [...allNfts, ...walletNfts];
          }
        }
      }
      
      // Set all NFTs from all wallets
      setWalletNfts(allNfts);

    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to load your NFTs. Please try again.",
        variant: "destructive"
      });
      setWalletNfts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectNft = async (nft: NFT) => {
    setSelectedNft(nft);
    
    // Pre-fill title and description
    setTitle(nft.title || `Ordinal #${nft.inscription_id.slice(0, 8)}`);
    setDescription(nft.description || `Auction for Ordinal #${nft.inscription_id.slice(0, 8)}`);
    setShowAuctionForm(true);
  };

  const handleBackToGallery = () => {
    setSelectedNft(null);
    setShowAuctionForm(false);
  };

  const handleCreateAuction = async () => {
    if (!selectedNft || !startPrice) {
      toast({
        title: "Error",
        description: "Please set a starting price",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const unisat = window.unisat as any;
      
      // Use the wallet address stored with the NFT
      const walletAddress = selectedNft.wallet_id;
      
      // Connect to this specific wallet if needed
      await unisat.requestAccounts();
      const connectedAddress = await unisat.getAccounts();
      
      if (connectedAddress[0] !== walletAddress) {
        toast({
          title: "Wrong wallet",
          description: `Please connect to the wallet that owns this NFT: ${walletAddress}`,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // STEP 1: Get seller pubkey
      const sellerPubKey = await unisat.getPublicKey();
      console.log("Seller pubkey:", sellerPubKey);

      let startTime = startType === "scheduled" ? startDate : new Date();
      let endTime = durationType === "quick"
          ? new Date(startTime.getTime() + parseInt(duration) * 60 * 1000)
          : endDate;
      
      const auctionData: CreateAuctionRequest = {
        nft_id: selectedNft.id,
        seller_pubkey: sellerPubKey,
        start_price: parseFloat(startPrice),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        psbt: "" // Empty PSBT - backend will handle this
      };

      console.log(auctionData); 
      const auctionResponse = await api.auction.create(auctionData);

      // STEP 2: Create multisig address
      const multisigResponse = await api.onchain.createMultisig();
      if (!multisigResponse.success) throw new Error("Multisig creation failed");
      const { descriptor, address: multisigAddressRaw } = multisigResponse.data;
      const multisigAddress = multisigAddressRaw.replace(/"/g, "").trim();

      console.log("Generated multisig address:", multisigAddress);

      // STEP 3: Prepare escrow PSBT
      const escrowData = {
        inscription_utxo: selectedNft.inscription_id.split("i")[0],
        vout: parseInt(selectedNft.inscription_id.split("i")[1]),
        multisig_address: multisigAddress,
        multisig_script: descriptor,
        amount: (parseInt(startPrice) / 100_000_000).toFixed(8)
      };
      
      const psbtResponse = await api.onchain.createEscrow(escrowData);
      if (!psbtResponse.success) throw new Error("PSBT creation failed");
      const psbt = psbtResponse.data;

      // STEP 4: Sign PSBT
      const signedPsbtHex = await unisat.signPsbt(psbt);
      const signedPsbtBuffer = Buffer.from(signedPsbtHex, 'hex');
      const signedPsbtBase64 = signedPsbtBuffer.toString('base64');

      console.log("Signed base64 PSBT:", signedPsbtBase64);

      // STEP 5: Finalize + broadcast
      const finalizeResponse = await api.onchain.finalizeEscrow({ signed_psbt: signedPsbtBase64 });
      if (!finalizeResponse.success) throw new Error("Broadcast failed");
      const txid = finalizeResponse.data;
      console.log("Finalized + broadcasted txid:", txid);
      
      if (auctionResponse.success && auctionResponse.data) {
        const auctionId = auctionResponse.data.auction_id;
        console.log("Created auction with ID:", auctionId);
        
        toast({
          title: "Success",
          description: "Auction created successfully!"
        });
        
        if (auctionId) {
          router.push(`/auctions/${auctionId}`);
        } else {
          console.error("No auction_id in response:", auctionResponse);
          throw new Error("Missing auction_id in response");
        }
      } else {
        throw new Error("Auction creation failed");
      }

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create Auction</h1>
        {showAuctionForm && (
          <Button variant="outline" onClick={handleBackToGallery} className="flex items-center">
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
            Back to NFT Gallery
          </Button>
        )}
      </div>

      {showAuctionForm && selectedNft ? (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
            <CardTitle>Create Auction for Your NFT</CardTitle>
            <CardDescription>Set the details for your auction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selected NFT preview */}
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
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {selectedNft.inscription_id}
                  </p>
                </div>
              </div>
            </div>

          {/* Auction details form */}
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
              </div>

            {/* Start Time Options */}
            <div className="space-y-3">
              <Label>Start Time</Label>
              <RadioGroup 
                value={startType} 
                onValueChange={setStartType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="start-now" />
                  <Label htmlFor="start-now" className="cursor-pointer">Start immediately after creation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="start-scheduled" />
                  <Label htmlFor="start-scheduled" className="cursor-pointer">Schedule for later</Label>
                </div>
              </RadioGroup>

              {startType === "scheduled" && (
                <div className="pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP p") : "Pick a date and time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={(date: Date | undefined) => date && setStartDate(date)}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Label>Time (24h format)</Label>
                        <div className="flex mt-2">
                          <input
                            type="time"
                            value={format(startDate, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(startDate);
                              newDate.setHours(parseInt(hours));
                              newDate.setMinutes(parseInt(minutes));
                              setStartDate(newDate);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Duration Options */}
            <div className="space-y-3">
              <Label>Auction Duration</Label>
              <RadioGroup 
                value={durationType} 
                onValueChange={setDurationType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quick" id="duration-quick" />
                  <Label htmlFor="duration-quick" className="cursor-pointer">Quick duration</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="duration-custom" />
                  <Label htmlFor="duration-custom" className="cursor-pointer">Custom end date/time</Label>
                </div>
              </RadioGroup>

              {durationType === "quick" ? (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant={duration === "1" ? "default" : "outline"}
                    onClick={() => setDuration("1")}
                  >
                    1 min
                  </Button>
                  <Button 
                    type="button" 
                    variant={duration === "5" ? "default" : "outline"}
                    onClick={() => setDuration("5")}
                  >
                    5 mins
                  </Button>
                  <Button 
                    type="button" 
                    variant={duration === "10" ? "default" : "outline"}
                    onClick={() => setDuration("10")}
                  >
                    10 mins
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP p") : "Pick end date and time"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={(date: Date | undefined) => date && setEndDate(date)}
                        initialFocus
                      />
                      <div className="p-3 border-t">
                        <Label>Time (24h format)</Label>
                        <div className="flex mt-2">
                          <input
                            type="time"
                            value={format(endDate, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(endDate);
                              newDate.setHours(parseInt(hours));
                              newDate.setMinutes(parseInt(minutes));
                              setEndDate(newDate);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
              </div>
          )}
            </div>

        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleCreateAuction}
            disabled={!selectedNft || !startPrice || isSubmitting}
          >
            {isSubmitting ? (
              <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Auction...
              </>
            ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Create Auction
                </>
            )}
          </Button>
        </CardFooter>
      </Card>
      ) : (
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Your Wallet NFTs</CardTitle>
              <CardDescription>
                Select an NFT from your wallet to create an auction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : walletNfts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No NFTs found in your wallet</p>
                  <Button onClick={() => fetchWalletNfts()}>
                    <Loader2 className="mr-2 h-4 w-4" /> Refresh Wallet
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {walletNfts.map((nft) => (
                    <div
                      key={nft.inscription_id}
                      className="border rounded-xl p-4 bg-black/80 hover:bg-black/70 hover:shadow-lg transition duration-200 cursor-pointer"
                      onClick={() => handleSelectNft(nft)}
                    >
                      <div className="relative w-full aspect-square rounded overflow-hidden border border-red-500/20">
                        {nft.image_url ? (
                          <img
                            src={nft.image_url}
                            alt={nft.title || "NFT"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                            No image available
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-red-500/80">
                          {nft.auction_id}
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <Button size="sm" variant="secondary" className="bg-black/70 hover:bg-black backdrop-blur-sm">
                            <Sparkles className="mr-1 h-3 w-3" /> Create Auction
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h3 className="text-lg font-bold text-red-400">{nft.title || `Inscription #${nft.id}`}</h3>
                        <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                          <span>ID: {nft.inscription_id.slice(0, 8)}...</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(nft.inscription_id);
                              toast({
                                title: "Copied!",
                                duration: 1500
                              });
                            }}
                            className="text-gray-400 hover:text-green-400 transition p-1"
                            title="Copy inscription ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {nft.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{nft.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
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
