"use client";

import Link from "next/link";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import type { WalletConnection } from "@/types/wallet";
import { WalletModal } from "../wallet/WalletModal";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "../providers/auth-provider";
import { useUnisat } from "@/hooks/useUnisat";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { isConnected, address, connect, isConnecting } = useUnisat();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [wallets, setWallets] = useState<Record<string, WalletConnection>>({
    unisat: { isInstalled: false, isConnected: false, address: null },
    xverse: { isInstalled: false, isConnected: false, address: null },
    metamask: { isInstalled: false, isConnected: false, address: null },
    phantom: { isInstalled: false, isConnected: false, address: null },
  });

  const neonButtonStyle = `
    bg-black hover:bg-black border-2 border-red-500 text-red-500 
    hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 font-mono 
    hover:text-red-400 hover:border-red-400 
    !important`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      checkWalletInstallations();
    }
  }, []);
  
  // Update wallet state based on connected address
  useEffect(() => {
    if (address) {
      setWallets(prev => ({
        ...prev,
        unisat: {
          ...prev.unisat,
          isConnected: true,
          address: address,
        },
      }));
    }
  }, [address]);

  const checkWalletInstallations = async () => {
    if (typeof window === "undefined") return;
    
    // Check if Unisat is installed
    const unisatExists = !!(window as any).unisat;
    if (unisatExists) {
      setWallets(prev => ({
        ...prev,
        unisat: { 
          isInstalled: true, 
          isConnected: isConnected,
          address: address 
        },
      }));
    }
  };

  const disconnectWallet = async () => {
    try {
      // Use the auth context's logout function which properly handles state
      logout();
      
      // Reset local state
      setWallets(prev => ({
        ...prev,
        unisat: {
          ...prev.unisat,
          isConnected: false,
          address: null,
        },
      }));
      
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const handleWalletSelect = async (walletType: string) => {
    if (typeof window === "undefined") return;
    
    switch (walletType) {
      case "unisat":
        try {
          if (!(window as any).unisat) {
            throw new Error("Unisat wallet not installed");
          }

          const success = await connect();
          
          if (success) {
            setIsWalletModalOpen(false);
            router.refresh(); // Refresh page to update auth state
          }
        } catch (error: any) {
          console.error("Error connecting to wallet:", error);
          toast.error(error.message || "Failed to connect to wallet");
        }
        break;
    }
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            SATONIC
          </Link>
          <Link href="/auctions/marketplace" className="hover:text-primary">
            Auctions
          </Link>
          <Link href="/auctions/create" className="hover:text-primary">
            Create Auction
          </Link>
          {isAuthenticated && (
            <Link href="/profile" className="hover:text-primary">
              Profile
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.wallets && user.wallets.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-red-500">
                      {user.wallets[0].address?.slice(0, 6)}...{user.wallets[0].address?.slice(-4)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectWallet}
                      className={neonButtonStyle}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className={neonButtonStyle}
                style={{
                  background: "black",
                  borderColor: "#ef4444",
                  color: "#ef4444",
                }}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
          <ModeToggle />
        </div>
      </div>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleWalletSelect}
        installedWallets={{
          unisat: wallets.unisat.isInstalled,
          xverse: wallets.xverse.isInstalled,
          metamask: wallets.metamask.isInstalled,
          phantom: wallets.phantom.isInstalled,
        }}
      />
    </nav>
  );
}
