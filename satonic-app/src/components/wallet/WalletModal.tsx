"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import UnisatInstallModal from "./UnisatInstallModal"

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectWallet: (type: string) => void
  installedWallets: Record<string, boolean>
}

const WALLET_OPTIONS = [
  {
    id: 'unisat',
    name: 'Unisat',
    icon: '/wallets/unisat.png',
    status: 'Recommended'
  },
  {
    id: 'xverse',
    name: 'Xverse',
    icon: '/wallets/xverse.png',
    status: 'Popular'
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallets/metamask.png',
    status: ''
  },
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '/wallets/phantom.png',
    status: 'Multichain'
  },
]

export function WalletModal({ isOpen, onClose, onSelectWallet, installedWallets }: WalletModalProps) {
  const [showUnisatInstall, setShowUnisatInstall] = useState(false)

  const handleWalletSelect = (walletId: string) => {
    if (walletId === 'unisat' && !installedWallets.unisat) {
      setShowUnisatInstall(true)
      return
    }
    onSelectWallet(walletId)
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen && !showUnisatInstall} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log in or sign up</DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search through wallets..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {WALLET_OPTIONS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleWalletSelect(wallet.id)}
                className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 overflow-hidden rounded-md">
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={32}
                      height={32}
                    />
                  </div>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                {wallet.status && (
                  <span className="text-sm text-muted-foreground">
                    {wallet.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <UnisatInstallModal 
        isOpen={showUnisatInstall} 
        onClose={() => {
          setShowUnisatInstall(false)
          onClose()
        }} 
      />
    </>
  )
} 