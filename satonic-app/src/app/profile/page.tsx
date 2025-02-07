'use client'

import { useEffect, useState } from 'react'
import { Button, Card as AntCard } from 'antd'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { WalletBalance as WalletBalanceType } from '@/types/wallet'
import WalletBalance from '@/components/wallet/WalletBalance'
import NFTGallery from '@/components/wallet/NFTGallery'
import { WalletModal } from '@/components/wallet/WalletModal'
import { toast } from "react-hot-toast"

const neonButtonStyle = `
  bg-black hover:bg-black border-2 border-red-500 text-red-500 
  hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all duration-300 font-mono 
  hover:text-red-400 hover:border-red-400 
  !important`

export default function ProfilePage() {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState<WalletBalanceType>({
    confirmed: 0,
    unconfirmed: 0,
    total: 0
  })
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.unisat) return
      
      try {
        const accounts = await window.unisat.getAccounts()
        if (accounts.length > 0) {
          setConnected(true)
          setAddress(accounts[0])
          const balance = await window.unisat.getBalance()
          setBalance(balance)
        }
      } catch (e) {
        toast.error(`Failed to connect to wallet: ${e.message}`)
      }
    }

    checkConnection()
  }, [])

  const connectWallet = async () => {
    try {
      const accounts = await window.unisat?.requestAccounts()
      if (accounts && accounts.length > 0) {
        setConnected(true)
        setAddress(accounts[0])
        const balance = await window.unisat?.getBalance()
        if (balance) setBalance(balance)
      }
    } catch (e) {
      toast.error('Failed to connect wallet')
    }
  }

  const handleWalletSelect = async (type: string) => {
    if (type === 'unisat') {
      await connectWallet()
    }
    setIsWalletModalOpen(false)
  }

  return (
    <div className="container mx-auto p-4">
      {connected ? (
        <div className="space-y-6">
          <WalletBalance address={address} balance={balance} />
          <NFTGallery address={address} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AntCard className="bg-black border-red-500 border-2 w-full max-w-md p-8">
            <CardHeader>
              <CardTitle className="text-red-500 font-mono text-center animate-pulse">
                Connect Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-center mb-6">
                Connect your wallet to view your profile and NFTs
              </p>
              <Button 
                onClick={() => setIsWalletModalOpen(true)}
                className={`w-full ${neonButtonStyle} text-lg py-6`}
                style={{ 
                  background: 'black', 
                  borderColor: '#ef4444', 
                  color: '#ef4444', 
                }}
              >
                Connect Your Wallet
              </Button>
            </CardContent>
          </AntCard>
        </div>
      )}

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleWalletSelect}
        installedWallets={{
          unisat: !!window.unisat,
          xverse: false,
          metamask: false,
          phantom: false,
        }}
      />
    </div>
  )
}
