"use client"

import Link from "next/link"
import { ModeToggle } from "../mode-toggle"
import { Button } from "../ui/button"
import { useEffect, useState } from "react"
import type { WalletConnection } from "@/types/wallet"
import { WalletModal } from "../wallet/WalletModal"
import { toast } from "react-hot-toast"

export default function Navbar() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [wallets, setWallets] = useState<Record<string, WalletConnection>>({
    unisat: { isInstalled: false, isConnected: false, address: null },
    xverse: { isInstalled: false, isConnected: false, address: null },
    metamask: { isInstalled: false, isConnected: false, address: null },
    phantom: { isInstalled: false, isConnected: false, address: null },
  })

  const neonButtonStyle = `
    bg-black hover:bg-black border-2 border-red-500 text-red-500 
    hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 font-mono 
    hover:text-red-400 hover:border-red-400 
    !important`

  useEffect(() => {
    checkWalletInstallations()
  }, [])

  const checkWalletInstallations = () => {
    // Check Unisat
    if (typeof window !== 'undefined' && window.unisat) {
      setWallets(prev => ({
        ...prev,
        unisat: { ...prev.unisat, isInstalled: true }
      }))
      checkUnisatConnection()
    }

    // Check other wallets here
    // Example: if (typeof window !== 'undefined' && window.xverse) { ... }
  }

  const checkUnisatConnection = async () => {
    if (!window.unisat) {
      console.log('Unisat wallet not found')
      return false
    }

    try {
      const accounts = await window.unisat.getAccounts()
      return accounts.length > 0
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error checking Unisat connection:', error.message)
      }
      return false
    }
  }

  const connectWallet = async (type: string) => {
    switch (type) {
      case 'unisat':
        if (!wallets.unisat.isInstalled) {
          window.open('https://unisat.io/download', '_blank')
          return
        }
        try {
          const accounts = await window.unisat.requestAccounts()
          setWallets(prev => ({
            ...prev,
            unisat: {
              ...prev.unisat,
              isConnected: true,
              address: accounts[0]
            }
          }))
        } catch (error) {
          console.error('Error connecting to Unisat:', error)
        }
        break
      // Add more wallet cases here
    }
  }

  const disconnectWallet = async (type: string) => {
    switch (type) {
      case 'unisat':
        try {
          if (window.unisat) {
            await window.unisat.disconnect()
            setWallets(prev => ({
              ...prev,
              unisat: {
                ...prev.unisat,
                isConnected: false,
                address: null
              }
            }))
            // Reload the page after disconnecting
            window.location.reload()
          }
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error disconnecting from Unisat:', error.message)
            toast({
              title: 'Disconnect Failed',
              description: 'Failed to disconnect from Unisat wallet',
              variant: 'destructive'
            })
          }
        }
        break
      // Add other wallet cases here
    }
  }

  const handleWalletSelect = async (walletType: string) => {
    switch (walletType) {
      case 'unisat':
        try {
          if (!window.unisat) {
            throw new Error('Unisat wallet not installed')
          }
          
          const accounts = await window.unisat.requestAccounts()
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found')
          }

          // Handle successful connection
          setWallets(prev => ({
            ...prev,
            unisat: {
              ...prev.unisat,
              isConnected: true,
              address: accounts[0]
            }
          }))
          
        } catch (error) {
          if (error instanceof Error) {
            console.error('Error connecting to Unisat:', error.message)
          }
          // Show user-friendly error message
          toast({
            title: 'Connection Failed',
            description: 'Failed to connect to Unisat wallet',
            variant: 'destructive'
          })
        }
        break
      // Add other wallet cases here
    }
  }

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
          <Link href="/profile" className="hover:text-primary">
            Profile
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {Object.entries(wallets).some(([_, w]) => w.isConnected) ? (
              // Show connected wallets
              Object.entries(wallets)
                .filter(([_, w]) => w.isConnected)
                .map(([type, wallet]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => await disconnectWallet(type)}
                      className={neonButtonStyle}
                    >
                      Disconnect
                    </Button>
                  </div>
                ))
            ) : (
              <Button 
                onClick={() => setIsWalletModalOpen(true)}
                className={neonButtonStyle}
                style={{ 
                  background: 'black',
                  borderColor: '#ef4444',
                  color: '#ef4444',
                }}
              >
                Connect Wallet
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
  )
}