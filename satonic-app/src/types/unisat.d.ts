import { UnisatWallet } from './wallet'

declare global {
  interface Window {
    unisat: UnisatWallet
  }
} 