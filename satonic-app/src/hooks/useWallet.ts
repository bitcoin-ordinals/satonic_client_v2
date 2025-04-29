'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { api, setAuthToken } from '@/lib/api'
import { unisatService, UnisatBalance, UnisatInscription } from '@/services/unisat'

declare global {
  interface Window {
    unisat: {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      getBalance: () => Promise<UnisatBalance>;
      getInscriptions: (cursor: number, size: number) => Promise<{
        total: number;
        inscriptions: UnisatInscription[];
      }>;
      switchNetwork: (network: string) => Promise<void>;
      signMessage: (message: string, type: string) => Promise<string>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export type WalletType = 'unisat' | 'metamask' | 'xverse' | 'phantom' | null

interface WalletState {
  isConnected: boolean
  address: string | null
  balance: number | null
  walletType: WalletType
  inscriptions: UnisatInscription[]
  totalInscriptions: number
}

export const useWallet = () => {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    walletType: null,
    inscriptions: [],
    totalInscriptions: 0
  })
  
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.unisat !== 'undefined') {
        try {
          const accounts = await window.unisat.getAccounts()
          if (accounts.length > 0) {
            setState({
              isConnected: true,
              address: accounts[0],
              balance: null,
              walletType: 'unisat',
              inscriptions: [],
              totalInscriptions: 0
            })
            await fetchBalance(accounts[0])
            await fetchInscriptions(accounts[0])
          }
        } catch (error) {
          console.error('Error checking connection:', error)
        }
      }
    }

    checkConnection()

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setState({
          isConnected: true,
          address: accounts[0],
          balance: null,
          walletType: 'unisat',
          inscriptions: [],
          totalInscriptions: 0
        })
        fetchBalance(accounts[0])
        fetchInscriptions(accounts[0])
      } else {
        setState({
          isConnected: false,
          address: null,
          balance: null,
          walletType: null,
          inscriptions: [],
          totalInscriptions: 0
        })
      }
    }

    if (typeof window.unisat !== 'undefined') {
      window.unisat.on('accountsChanged', handleAccountsChanged)
    }

    return () => {
      if (typeof window.unisat !== 'undefined') {
        window.unisat.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])
  
  const fetchBalance = async (addr: string) => {
    try {
      const balance = await unisatService.getAddressBalance(addr)
      setState({
        ...state,
        balance: balance.confirmed
      })
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }
  
  const fetchInscriptions = async (addr: string, cursor: number = 0, size: number = 20) => {
    try {
      const { total, inscriptions } = await unisatService.getAddressInscriptions(addr, cursor, size)
      setState({
        ...state,
        inscriptions,
        totalInscriptions: total
      })
    } catch (error) {
      console.error('Error fetching inscriptions:', error)
    }
  }
  
  const connectWallet = async (walletType: WalletType) => {
    if (walletType !== 'unisat') {
      throw new Error('Only Unisat wallet is supported')
    }

    if (typeof window.unisat === 'undefined') {
      throw new Error('Unisat wallet is not installed')
    }

    try {
      await window.unisat.switchNetwork('testnet')
      const accounts = await window.unisat.requestAccounts()
      if (accounts.length > 0) {
        setState({
          ...state,
          address: accounts[0],
          isConnected: true,
          balance: null,
          walletType: 'unisat',
          inscriptions: [],
          totalInscriptions: 0
        })
        await fetchBalance(accounts[0])
        await fetchInscriptions(accounts[0])
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    }
  }
  
  const disconnectWallet = () => {
    setState({
      isConnected: false,
      address: null,
      balance: null,
      walletType: null,
      inscriptions: [],
      totalInscriptions: 0
    })
  }
  
  const signMessage = async (message: string) => {
    if (!state.isConnected) {
      throw new Error('Wallet is not connected')
    }

    try {
      return await window.unisat.signMessage(message, 'bip322-simple')
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }
  
  return {
    ...state,
    connectWallet,
    disconnectWallet,
    signMessage,
    fetchInscriptions
  }
} 