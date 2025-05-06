"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { api } from '@/lib/api';
import type { NFT, CreateAuctionRequest } from '@/lib/api';
import { Loader2, Copy, ChevronRight, Plus, Sparkles, Upload, Calendar, Clock } from 'lucide-react';
import { useUnisat } from '@/hooks/useUnisat';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Type declaration for Unisat wallet API
interface UnisatWallet {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<string>;
  getInscriptions: (cursor: number, size: number) => Promise<{
    total: number;
    inscriptions: Array<{
      inscriptionId: string;
      inscriptionNumber: number;
      content?: string;
      preview?: string;
      contentType?: string;
    }>
  }>;
}


type WalletNFT = {
  id: string;
  inscription_id: string;
  inscription_number: number;
  image_url?: string;
  content_url?: string;
  title?: string;
  description?: string;
  wallet_address: string;
  network: string;
  imported: boolean;
};

function CreateAuctionContent() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { connect } = useUnisat();

  const [walletNfts, setWalletNfts] = useState<WalletNFT[]>([]);
  const [selectedNft, setSelectedNft] = useState<WalletNFT | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuctionForm, setShowAuctionForm] = useState(false);

  // Auction details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
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

      // First, fetch NFTs that are already in our database
      const dbResponse = await api.nft.getUserNFTs();
      const dbNfts = dbResponse.success && dbResponse.data?.nfts ? dbResponse.data.nfts : [];
      
      // Store inscription IDs that are already in our system
      const existingInscriptionIds = new Set(dbNfts.map(nft => nft.inscription_id));
      
      // Combine wallets NFTs
      let allNfts: WalletNFT[] = [];
      
      // Try fetching inscriptions from the same endpoint as the profile page
      try {
        const walletAddress = user.wallets?.[0]?.address;
        if (!walletAddress) {
          throw new Error("No wallet address available");
        }
        
        const res = await fetch(`http://localhost:8080/api/fetch/inscriptions?address=${walletAddress}`);
        const inscriptionsData = await res.json();
        
        if (Array.isArray(inscriptionsData) && inscriptionsData.length > 0) {
          const walletInscriptions = inscriptionsData.map((insc: any) => ({
            id: insc.inscription_id,
            inscription_id: insc.inscription_id,
            inscription_number: insc.inscription_number || 0,
            image_url: insc.inscription_url,
            content_url: insc.inscription_url,
            title: `Inscription #${insc.inscription_number || insc.inscription_id.slice(0, 8)}`,
            description: `Bitcoin ordinal inscription`,
            wallet_address: walletAddress,
            network: insc.network || 'unknown',
            imported: existingInscriptionIds.has(insc.inscription_id)
          }));
          
          allNfts = walletInscriptions;
        }
      } catch (fetchError) {
        console.error("Error fetching from API endpoint:", fetchError);
        
        // Fallback to direct wallet fetch if API fetch fails
        if (typeof window !== 'undefined' && window.unisat) {
          try {
            const unisatWallet = window.unisat as any;
            
            // Get inscriptions from the connected wallet
            const inscriptionsResult = await unisatWallet.getInscriptions(0, 100);
            
            if (inscriptionsResult && inscriptionsResult.inscriptions) {
              const walletAddress = (await unisatWallet.getAccounts())[0];
              const network = await unisatWallet.getNetwork();
              
              const walletInscriptions = inscriptionsResult.inscriptions.map((insc: any) => ({
                id: insc.inscriptionId,
                inscription_id: insc.inscriptionId,
                inscription_number: insc.inscriptionNumber,
                image_url: insc.content || insc.preview,
                content_url: insc.content,
                title: `Inscription #${insc.inscriptionNumber}`,
                description: `Bitcoin ordinal inscription #${insc.inscriptionNumber}`,
                wallet_address: walletAddress,
                network: network === 'livenet' ? 'mainnet' : network,
                imported: existingInscriptionIds.has(insc.inscriptionId)
              }));
              
              allNfts.push(...walletInscriptions);
            }
          } catch (walletError) {
            console.error("Error fetching from wallet:", walletError);
        toast({
              title: "Wallet Error",
              description: "Could not fetch inscriptions from wallet. Please check that your wallet is connected properly.",
              variant: "destructive"
            });
          }
        }
      }
      
      // Add already imported NFTs if they weren't found in the wallet
      dbNfts.forEach(nft => {
        if (!allNfts.some(walletNft => walletNft.inscription_id === nft.inscription_id)) {
          allNfts.push({
            id: nft.id,
            inscription_id: nft.inscription_id,
            inscription_number: parseInt(nft.token_id) || 0,
            image_url: nft.image_url,
            content_url: nft.content_url,
            title: nft.title,
            description: nft.description,
            wallet_address: user.wallets?.[0]?.address || "",
            network: 'unknown',
            imported: true
          });
        }
      });
      
      setWalletNfts(allNfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast({
        title: "Error",
        description: "Failed to load your NFTs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importNft = async (nft: WalletNFT) => {
    if (nft.imported) return; // Already imported
    
    try {
      setIsImporting(true);
      
      // Ensure we have the user's wallets
      if (!user?.wallets || user.wallets.length === 0) {
        throw new Error("No wallets connected");
      }
      
      const walletId = user.wallets[0].id;
      
      // Import the NFT to our database
      const importResponse = await api.nft.importNFT({
        wallet_id: walletId,
        inscription_id: nft.inscription_id,
        title: nft.title || `Inscription #${nft.inscription_number}`,
        description: nft.description || `Bitcoin Ordinal Inscription #${nft.inscription_number}`,
        collection: "Bitcoin Ordinals"
      });
      
      if (!importResponse.success) {
        throw new Error(importResponse.error || "Failed to import NFT");
      }
      
      // Mark this NFT as imported
      setWalletNfts(prev => 
        prev.map(item => 
          item.inscription_id === nft.inscription_id 
            ? { ...item, imported: true, id: importResponse.success ? importResponse.data.id : item.id } 
            : item
        )
      );
      
      // Update the selected NFT if it's the one we just imported
      if (selectedNft && selectedNft.inscription_id === nft.inscription_id) {
        setSelectedNft({
          ...selectedNft,
          imported: true,
          id: importResponse.success ? importResponse.data.id : selectedNft.id
        });
      }
      
      toast({
        title: "NFT Imported",
        description: "Successfully imported NFT to your collection"
      });
      
      return importResponse.success ? importResponse.data : null;
    } catch (error) {
      console.error("Error importing NFT:", error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import NFT",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectNft = async (nft: WalletNFT) => {
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

      // STEP 1: Get seller pubkey
      const sellerPubKey = await unisat.getPublicKey();

      // STEP 2: Create multisig address (backend combines sellerPubKey with PLATFORM_TAPROOT_PUBKEY)
      const multisigRes = await fetch("http://localhost:8080/api/onchain/create-multisig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_pubkey: sellerPubKey })
      });

      if (!multisigRes.ok) throw new Error("Multisig creation failed");
      const { descriptor, address: multisigAddressRaw  } = await multisigRes.json();
      const multisigAddress = multisigAddressRaw.replace(/"/g, "").trim();

      console.log("Generated multisig address:", multisigAddress);

      // STEP 3: Prepare escrow PSBT (lock NFT to multisig)
      const psbtRes = await fetch("http://localhost:8080/api/onchain/create-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inscription_utxo: selectedNft.inscription_id.split("i")[0],
          vout: parseInt(selectedNft.inscription_id.split("i")[1]),
          multisig_address: multisigAddress,
          multisig_script: descriptor,
          amount: (parseInt(startPrice) / 100_000_000).toFixed(8)
        })
      });

      const rawPsbtRes = await psbtRes.json();
      console.log("Raw PSBT response:", rawPsbtRes);
      const { psbt } = rawPsbtRes;

      // STEP 4: Sign PSBT
      const signedPsbtHex = await unisat.signPsbt(psbt);
      const signedPsbtBuffer = Buffer.from(signedPsbtHex, 'hex');
      const signedPsbtBase64 = signedPsbtBuffer.toString('base64');

      console.log("Signed base64 PSBT:", signedPsbtBase64);

      // STEP 5: Finalize + broadcast
      const finalizeRes = await fetch("http://localhost:8080/api/onchain/finalize-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signed_psbt: signedPsbtBase64 })
      });

      if (!finalizeRes.ok) throw new Error("Broadcast failed");
      const { txid } = await finalizeRes.json();

      // STEP 6: Calculate start/end time
      let startTime = startType === "scheduled" ? startDate : new Date();
      let endTime = durationType === "quick"
          ? new Date(startTime.getTime() + parseInt(duration) * 60 * 1000)
          : endDate;

      // STEP 7: Call auction creation endpoint
      const auctionData: CreateAuctionRequest = {
        nft_id: selectedNft.id,
        start_price: parseFloat(startPrice),
        reserve_price: reservePrice ? parseFloat(reservePrice) : undefined,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        psbt
      };

      const response = await api.auction.create(auctionData);

      if (response.success && response.data) {
        toast({ title: "Auction Created", description: "Success!" });
        router.push(`/auctions/${response.data.id}`);
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
                          {nft.network}
                        </div>
                        {!nft.imported && (
                          <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/80">
                            Not imported
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2">
                          <Button size="sm" variant="secondary" className="bg-black/70 hover:bg-black backdrop-blur-sm">
                            <Sparkles className="mr-1 h-3 w-3" /> Create Auction
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <h3 className="text-lg font-bold text-red-400">{nft.title || `Inscription #${nft.inscription_number}`}</h3>
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
