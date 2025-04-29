// Detect wallet provider
export function detectWalletProvider(): any {
  // Check for Unisat wallet
  return getUnisatWallet();
}

// Connect to wallet and get address
export async function connectWallet(): Promise<string | null> {
  try {
    const provider = getUnisatWallet();
    if (!provider) {
      console.error('No wallet provider found');
      alert('Please install a Bitcoin wallet like Unisat to continue');
      return null;
    }

    console.log('Connecting to wallet...');
    
    // Request account access
    const accounts = await provider.requestAccounts();
    
    if (!accounts || accounts.length === 0) {
      console.error('No accounts found');
      return null;
    }

    console.log('Connected to wallet with address:', accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return null;
  }
}

// Disconnect from wallet
export async function disconnectWallet(): Promise<boolean> {
  try {
    console.log('Disconnecting wallet...');
    // For most Bitcoin wallets, there's no explicit disconnect method
    // We just clear the local state on our end
    return true;
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return false;
  }
}

// Sign a message with the wallet
export async function signMessage(message: string): Promise<string | null> {
  try {
    const provider = getUnisatWallet();
    if (!provider) {
      console.error('No wallet provider found');
      return null;
    }

    console.log('Signing message:', message);
    
    // Sign the message
    const signature = await provider.signMessage(message);
    
    console.log('Message signed with signature:', signature);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    return null;
  }
}

// Define interfaces for TypeScript type checking
// but avoid global window augmentation conflicts
interface UnisatWallet {
  requestAccounts: () => Promise<string[]>;
  signMessage: (message: string) => Promise<string>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<string>;
}

// Use type assertion in the detector function instead of relying on global augmentation
export function getUnisatWallet(): UnisatWallet | null {
  if (typeof window !== 'undefined' && window.unisat) {
    return window.unisat as unknown as UnisatWallet;
  }
  return null;
} 