'use client'

import { AuthCheck } from '@/components/auth/AuthCheck'
// ... other imports

export default function MarketplacePage() {
  return (
    <AuthCheck>
      {/* Your existing page content */}
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold mb-8">NFT Marketplace</h1>
        {/* ... rest of your content */}
      </div>
    </AuthCheck>
  )
}
