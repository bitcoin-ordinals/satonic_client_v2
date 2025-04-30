'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Wallet, Email, api } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { NetworkSelector, BitcoinNetwork } from '@/components/network-selector'
import { WalletModal } from '@/components/wallet/WalletModal'
import { useUnisat } from '@/hooks/useUnisat'
import { Copy } from 'lucide-react'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const { connect } = useUnisat()
  const router = useRouter()
  const [walletBalances, setWalletBalances] = useState<Record<string, { balance: number; available: number }>>({})
  const [currentNetwork, setCurrentNetwork] = useState<BitcoinNetwork>('testnet')
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [inscriptions, setInscriptions] = useState<any[]>([])
  const [loadingInscriptions, setLoadingInscriptions] = useState(false)

  
  // Add wallet installation detection state for the modal
  const [installedWallets, setInstalledWallets] = useState({
    unisat: false,
    xverse: false,
    metamask: false,
    phantom: false,
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user?.wallets && user.wallets.length > 0) {
      fetchWalletBalances(user.wallets)
      detectCurrentNetwork()
    }
  }, [user?.wallets])

  useEffect(() => {
    fetchInscriptions()
  }, [user?.wallets])  

  // Detect installed wallets
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInstalledWallets({
        unisat: !!window.unisat,
        xverse: false, // Add detection logic for other wallets
        metamask: !!(window as any).ethereum,
        phantom: !!(window as any).phantom,
      })
    }
  }, [])

  const fetchWalletBalances = async (wallets: Wallet[]) => {
    const balances: Record<string, { balance: number; available: number }> = {}

    for (const wallet of wallets) {
      try {
        const response = await api.user.getWalletBalance(wallet.id)
        if (response.success && response.data) {
          balances[wallet.id] = {
            balance: response.data.balance,
            available: response.data.available
          }
        }
      } catch (error) {
        console.error(`Failed to fetch balance for wallet ${wallet.id}:`, error)
      }
    }

    setWalletBalances(balances)
  }

  const detectCurrentNetwork = async () => {
    // Check if wallet provider exists
    if (typeof window !== 'undefined' && window.unisat) {
      try {
        // Use type assertion to access wallet methods
        const unisatWallet = window.unisat as any
        
        // Get current network
        const network = await unisatWallet.getNetwork()
        console.log('Current wallet network:', network)
        
        // Map network name to our BitcoinNetwork type
        if (network === 'livenet') {
          setCurrentNetwork('mainnet')
        } else if (network === 'testnet') {
          // Since Unisat doesn't distinguish between testnet and testnet4,
          // we'll only update the state if it's not already set to testnet4
          if (currentNetwork !== 'testnet4') {
            setCurrentNetwork('testnet')
          }
        }
      } catch (error) {
        console.error('Failed to detect current network:', error)
      }
    }
  }

  const fetchInscriptions = async () => {
    if (!user?.wallets?.[0]?.address) return
  
    setLoadingInscriptions(true)
    try {
      const res = await fetch(`http://localhost:8080/api/fetch/inscriptions?address=${user.wallets[0].address}`)
      const data = await res.json()
      setInscriptions(data)
    } catch (err) {
      console.error('Failed to fetch inscriptions', err)
    } finally {
      setLoadingInscriptions(false)
    }
  }

  const handleNetworkChange = async (network: BitcoinNetwork) => {
    try {
      setIsNetworkSwitching(true)
      
      // Check if wallet provider exists
      if (typeof window !== 'undefined' && window.unisat) {
        try {
          // Use type assertion to access wallet methods
          const unisatWallet = window.unisat as any
          
          // Map our network names to what Unisat expects
          // Unisat supports mainnet as 'livenet', and both testnet and testnet4 directly
          let unisatNetwork: string = network;
          if (network === 'mainnet') {
            unisatNetwork = 'livenet';
          }
          
          console.log(`Switching to ${unisatNetwork} in Unisat`)
          
          // Switch network in wallet
          await unisatWallet.switchNetwork(unisatNetwork)
          
          // Get the actual network after switching (to verify)
          const currentNetwork = await unisatWallet.getNetwork()
          console.log('Current wallet network after switch:', currentNetwork)
          
          // Update state with the selected network
          setCurrentNetwork(network)
          toast.success(`Switched to ${network}`)
          
          // Refresh wallet balances
          if (user?.wallets && user.wallets.length > 0) {
            fetchWalletBalances(user.wallets)
          }
        } catch (error: any) {
          console.error('Failed to switch network:', error)
          
          // Handle specific error types
          if (error.code === 4001) {
            // User rejected request
            toast.error('Network switch was rejected by user')
          } else {
            // Try to provide more specific error information
            const errorMessage = error.message || 'Failed to switch network. Please try again.'
            toast.error(errorMessage)
          }
        }
      } else {
        toast.error('Wallet not available. Please connect your wallet first.')
      }
    } finally {
      setIsNetworkSwitching(false)
    }
  }

  const handleWalletSelect = async (walletType: string) => {
    try {
      if (walletType === 'unisat') {
        const success = await connect()
        if (success) {
          setIsWalletModalOpen(false)
          // Update user data to get new wallet
          await refreshUser()
          toast.success('Wallet connected successfully')
        }
      } else {
        toast.error('Only Unisat wallet is currently supported')
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet. Please try again.')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-6">Your Profile</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="emails">Email Addresses</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Your Ordinals</CardTitle>
                <CardDescription>These NFTs are fetched from your wallet on UniSat</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInscriptions ? (
                  <p>Loading inscriptions...</p>
                ) : inscriptions.length === 0 ? (
                  <p>No inscriptions found.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {inscriptions.map((nft) => (
                      <div
                        key={nft.inscription_id}
                        className="border rounded-xl p-3 bg-black/80 hover:shadow-lg transition duration-200"
                      >
                        <div className="relative w-full aspect-square rounded overflow-hidden border border-red-500/20">
                          {nft.inscription_url ? (
                            <img
                              src={nft.inscription_url}
                              alt={`Ordinal ${nft.inscription_id}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                              Unsupported content
                            </div>
                          )}
                        </div>

                        <div className="mt-3 text-center space-y-1">
                          <h3 className="text-lg font-bold text-red-400">Ordinal</h3>
                          <div className="flex items-center justify-center gap-1 text-sm font-mono text-muted-foreground">
                            <span>...{nft.inscription_id.slice(-3)}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(nft.inscription_id)
                                toast.success('Copied!', { duration: 1500 })
                              }}
                              className="text-gray-400 hover:text-green-400 transition p-1"
                              title="Copy inscription ID"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Wallets Tab */}
          <TabsContent value="wallets">
            <Card>
              <CardHeader>
                <CardTitle>Connected Wallets</CardTitle>
                <CardDescription>
                  Manage your connected cryptocurrency wallets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Label htmlFor="network">Network</Label>
                  <div className="mt-2">
                    <NetworkSelector 
                      currentNetwork={currentNetwork}
                      onNetworkChange={handleNetworkChange}
                      disabled={isNetworkSwitching || !user?.wallets || user.wallets.length === 0}
                    />
                  </div>
                  {isNetworkSwitching && (
                    <p className="text-sm text-muted-foreground mt-2">Switching network...</p>
                  )}
                </div>
                
                {user?.wallets && user.wallets.length > 0 ? (
                  <div className="space-y-4">
                    {user.wallets.map((wallet) => (
                      <div key={wallet.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-lg">{wallet.type.toUpperCase()} Wallet</p>
                            <p className="text-sm font-mono text-muted-foreground break-all">{wallet.address}</p>
                          </div>
                          <div className="text-right">
                            {walletBalances[wallet.id] ? (
                              <>
                                <p className="font-medium">
                                  {(walletBalances[wallet.id].balance / 100000000).toFixed(8)} BTC
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Available: {(walletBalances[wallet.id].available / 100000000).toFixed(8)} BTC
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">Loading balance...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No wallets connected yet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={() => setIsWalletModalOpen(true)}>Connect New Wallet</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Emails Tab */}
          <TabsContent value="emails">
            <Card>
              <CardHeader>
                <CardTitle>Email Addresses</CardTitle>
                <CardDescription>
                  Manage your email addresses for notifications and login
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.emails && user.emails.length > 0 ? (
                  <div className="space-y-4">
                    {user.emails.map((email: Email) => (
                      <div key={email.id} className="p-4 border rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-medium">{email.address}</p>
                          <div className="flex space-x-2 text-sm">
                            {email.primary && <span className="text-primary">Primary</span>}
                            {email.verified ? (
                              <span className="text-green-500">Verified</span>
                            ) : (
                              <span className="text-amber-500">Not Verified</span>
                            )}
                          </div>
                        </div>
                        <div>
                          {!email.verified && (
                            <Button variant="outline" size="sm">Verify</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No email addresses added yet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button>Add Email Address</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add the wallet modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onSelectWallet={handleWalletSelect}
        installedWallets={installedWallets}
      />
    </>
  )
}
