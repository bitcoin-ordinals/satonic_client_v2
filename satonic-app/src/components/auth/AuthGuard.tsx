'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { useUnisat } from '@/hooks/useUnisat'

interface AuthGuardProps {
  children: React.ReactNode
  message?: string
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  message = "Connect your wallet to view this content",
  redirectTo 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const { connect, isConnecting } = useUnisat()
  const router = useRouter()
  const [showChildren, setShowChildren] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setShowChildren(true)
      } else if (redirectTo) {
        router.push(redirectTo)
      } else {
        setShowChildren(false)
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, router])

  const handleConnectWallet = async () => {
    const success = await connect()
    if (success) {
      setShowChildren(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && !redirectTo) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] p-8">
        <div className="bg-card border rounded-lg max-w-md w-full p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">{message}</p>
          <Button 
            onClick={handleConnectWallet} 
            className="w-full" 
            size="lg"
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </div>
      </div>
    )
  }

  return showChildren ? <>{children}</> : null
} 