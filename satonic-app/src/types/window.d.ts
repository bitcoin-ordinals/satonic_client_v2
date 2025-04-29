// Define global interfaces for the window object
interface WalletBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

interface UnisatWallet {
  getAccounts(): Promise<string[]>;
  requestAccounts(): Promise<string[]>;
  signMessage(message: string): Promise<string>;
  getBalance(): Promise<WalletBalance>;
  disconnect(): Promise<void>;
}

// Extend the Window interface to include Unisat wallet
declare global {
  interface Window {
    unisat?: UnisatWallet;
  }
} 