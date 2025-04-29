'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api, ImportNFTRequest } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function ImportNFTPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  
  const [inscriptionId, setInscriptionId] = useState('')
  const [collection, setCollection] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedWalletId, setSelectedWalletId] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null)

  useEffect(() => {
    if (user?.wallets && user.wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(user.wallets[0].id)
    }
  }, [user, selectedWalletId])

  const handleValidateNFT = async () => {
    if (!inscriptionId || !selectedWalletId) {
      toast.error('Please enter an inscription ID and select a wallet')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const request: ImportNFTRequest = {
        wallet_id: selectedWalletId,
        inscription_id: inscriptionId,
      }

      const response = await api.nft.validateNFT(request)
      if (response.success && response.data) {
        setValidationResult({
          valid: response.data.valid,
          message: response.data.message,
        })

        if (response.data.valid) {
          toast.success('NFT validated successfully')
          
          // If an NFT was returned, it means it's already imported
          if (response.data.nft) {
            toast.success('This NFT is already imported')
            router.push(`/nfts/${response.data.nft.id}`)
          }
        } else {
          toast.error(response.data.message)
        }
      } else if (!response.success) {
        toast.error(response.error || 'Failed to validate NFT')
      }
    } catch (error) {
      console.error('Error validating NFT:', error)
      toast.error('Failed to validate NFT')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImportNFT = async () => {
    if (!inscriptionId || !selectedWalletId) {
      toast.error('Please enter an inscription ID and select a wallet')
      return
    }

    setIsImporting(true)

    try {
      const request: ImportNFTRequest = {
        wallet_id: selectedWalletId,
        inscription_id: inscriptionId,
        collection: collection || undefined,
        title: title || undefined,
        description: description || undefined,
      }

      const response = await api.nft.importNFT(request)
      if (response.success && response.data) {
        toast.success('NFT imported successfully')
        router.push(`/nfts/${response.data.id}`)
      } else if (!response.success) {
        toast.error(response.error || 'Failed to import NFT')
      }
    } catch (error) {
      console.error('Error importing NFT:', error)
      toast.error('Failed to import NFT')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AuthGuard message="Connect your wallet to import your NFTs">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold mb-6">Import NFT</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Import a Bitcoin Ordinal</CardTitle>
            <CardDescription>
              Import an NFT from your wallet to display and auction on Satonic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet</Label>
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {user?.wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.address.substring(0, 8)}...{wallet.address.substring(wallet.address.length - 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inscriptionId">Inscription ID</Label>
              <Input
                id="inscriptionId"
                value={inscriptionId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInscriptionId(e.target.value)}
                placeholder="Enter the inscription ID"
              />
              <p className="text-sm text-muted-foreground">
                The unique identifier for your Ordinal inscription
              </p>
            </div>
            
            {validationResult?.valid && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="collection">Collection (Optional)</Label>
                  <Input
                    id="collection"
                    value={collection}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollection(e.target.value)}
                    placeholder="Enter collection name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    placeholder="Enter a title for your NFT"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Describe your NFT"
                    rows={4}
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push('/nfts')}>
              Cancel
            </Button>
            
            {!validationResult?.valid ? (
              <Button onClick={handleValidateNFT} disabled={isValidating || !inscriptionId || !selectedWalletId}>
                {isValidating ? 'Validating...' : 'Validate NFT'}
              </Button>
            ) : (
              <Button onClick={handleImportNFT} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import NFT'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  )
} 