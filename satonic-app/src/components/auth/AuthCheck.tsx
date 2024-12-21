"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { WalletModal } from "../wallet/WalletModal"
import UnisatInstallModal from '../wallet/UnisatInstallModal';

interface AuthCheckProps {
  children: React.ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [wallets, setWallets] = useState({
    unisat: false,
    xverse: false,
    metamask: false,
    phantom: false,
  })
  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const checkExtensions = async () => {
      // Check for installed extensions
      const hasUnisat = typeof window !== 'undefined' && !!window.unisat
      const hasEthereum = typeof window !== 'undefined' && !!window.ethereum

      setWallets(prev => ({
        ...prev,
        unisat: hasUnisat,
        metamask: hasEthereum,
      }))

      // If Unisat is installed, check if it's connected
      if (hasUnisat) {
        try {
          const accounts = await window.unisat.getAccounts()
          setIsAuthenticated(accounts.length > 0)
        } catch (error) {
          console.error('Error checking wallet connection:', error)
        }
      }
    }

    checkExtensions()
  }, [])

  useEffect(() => {
    async function checkUnisat() {
      let unisat = window.unisat;

      for (let i = 1; i < 10 && !unisat; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * i));
        unisat = window.unisat;
      }

      if (unisat) {
        setUnisatInstalled(true);
      } else {
        setShowInstallModal(true);
      }
    }

    checkUnisat();
  }, []);

  const handleWalletSelect = async (type: string) => {
    if (type === 'unisat' && wallets.unisat) {
      try {
        const message = `Sign this message to authenticate Satonic. Nonce: ${Math.random().toString(36).substring(2)}`;
        const signature = await window.unisat.signMessage(message);
        console.log('User signature:', signature);
        console.log('Signed message:', message);
        setIsAuthenticated(true);
        setIsWalletModalOpen(false);
      } catch (error) {
        console.error('Error during signing:', error);
      }
    }
  };
  

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to access this page
          </p>
        </div>
        <Button 
          size="lg"
          onClick={() => setIsWalletModalOpen(true)}
        >
          Connect Wallet
        </Button>

        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onSelectWallet={handleWalletSelect}
          installedWallets={wallets}
        />
      </div>
    )
  }

  if (!unisatInstalled) {
    return (
      <UnisatInstallModal 
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    );
  }

  return children
} 