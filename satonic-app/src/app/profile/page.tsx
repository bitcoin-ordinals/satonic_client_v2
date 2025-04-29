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
import { Wallet, Email, api, UserProfileUpdateRequest } from '@/lib/api'
import { toast } from 'react-hot-toast'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [walletBalances, setWalletBalances] = useState<Record<string, { balance: number; available: number }>>({})

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (user?.profile) {
      setUsername(user.profile.username || '')
      setBio(user.profile.bio || '')
      setAvatar(user.profile.avatar_url || '')
    }
  }, [user])

  useEffect(() => {
    if (user?.wallets && user.wallets.length > 0) {
      fetchWalletBalances(user.wallets)
    }
  }, [user?.wallets])

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

  const handleUpdateProfile = async () => {
    if (!user) return

    setIsPending(true)
    
    try {
      const profileData: UserProfileUpdateRequest = {
        username,
        bio,
        avatar_url: avatar
      }

      const response = await api.user.updateProfile(profileData)
      if (response.success) {
        await refreshUser()
        toast.success('Profile updated successfully')
      } else {
        throw new Error(response.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsPending(false)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
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
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  placeholder="Enter a username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  value={avatar}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatar(e.target.value)}
                  placeholder="https://example.com/your-avatar.jpg"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateProfile} disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
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
              {user.wallets && user.wallets.length > 0 ? (
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
              <Button>Connect New Wallet</Button>
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
  )
}
