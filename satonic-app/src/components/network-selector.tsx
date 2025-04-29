'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type BitcoinNetwork = 'mainnet' | 'testnet' | 'testnet4'

interface NetworkSelectorProps {
  currentNetwork: BitcoinNetwork
  onNetworkChange: (network: BitcoinNetwork) => void
  disabled?: boolean
}

export function NetworkSelector({
  currentNetwork,
  onNetworkChange,
  disabled = false
}: NetworkSelectorProps) {
  const networks: { 
    value: BitcoinNetwork; 
    label: string; 
    description: string;
    walletCompat?: string;
  }[] = [
    { 
      value: 'mainnet', 
      label: 'Mainnet', 
      description: 'Bitcoin mainnet (production)',
      walletCompat: 'Supported as "livenet" in Unisat'
    },
    { 
      value: 'testnet', 
      label: 'Testnet', 
      description: 'Bitcoin testnet (development)',
      walletCompat: 'Fully supported in Unisat'
    },
    { 
      value: 'testnet4', 
      label: 'Testnet4', 
      description: 'Bitcoin testnet4 (newest testnet)',
      walletCompat: 'Uses regular testnet in Unisat'
    }
  ]

  const currentNetworkDetails = networks.find(n => n.value === currentNetwork) || networks[0]
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" className="flex items-center justify-between w-full">
          <span>
            <span className="font-medium">{currentNetworkDetails.label}</span>
            <span className="ml-2 text-sm text-muted-foreground">({currentNetworkDetails.description})</span>
          </span>
          <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[240px]">
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.value}
            className="flex flex-col items-start cursor-pointer py-2"
            onClick={() => onNetworkChange(network.value)}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-medium">{network.label}</span>
              {currentNetwork === network.value && <Check className="h-4 w-4" />}
            </div>
            <p className="text-xs text-muted-foreground">{network.description}</p>
            {network.walletCompat && (
              <p className="text-xs text-amber-500 mt-1">{network.walletCompat}</p>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 