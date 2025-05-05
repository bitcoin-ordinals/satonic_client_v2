import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { connectWallet, signMessage } from '@/lib/wallet';
import { setAuth, isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleWalletLogin = async () => {
    try {
      setLoading(true);
      setError('');

      await window.unisat?.switchChain?.('BITCOIN_TESTNET4');

      try {
        const chainInfo = await window.unisat?.getChain?.();
        console.log('🧾 UniSat Current Chain:', chainInfo);
        /**
         * Example output:
         * {
         *   enum: 'BITCOIN_TESTNET',
         *   name: 'Bitcoin Testnet',
         *   network: 'testnet'
         * }
         */
      } catch (err) {
        console.error('Failed to get chain info:', err);
      }

      // Connect wallet
      const address = await connectWallet();
      if (!address) {
        setError('Failed to connect wallet. Please try again.');
        setLoading(false);
        return;
      }

      // Generate message to sign
      const message = `Sign this message to authenticate with Satonic: ${address}`;

      // Sign message
      const signature = await signMessage(message);
      if (!signature) {
        setError('Failed to sign message. Please try again.');
        setLoading(false);
        return;
      }

      // Send login request
      const response = await api.auth.walletLogin(address, signature, message);

      if (!response.success) {
        setError(response.error || 'Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      // Store authentication data
      setAuth(response.data);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Login to Satonic</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleWalletLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect Wallet'
          )}
        </button>
        
        <div className="mt-4 text-center text-gray-400 text-sm">
          Connect your Bitcoin wallet to authenticate
        </div>
      </div>
    </div>
  );
} 