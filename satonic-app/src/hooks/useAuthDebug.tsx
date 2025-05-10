import { useEffect } from 'react';
import { debugAuthToken, resetAuthState } from '@/lib/api';

/**
 * Hook to attach auth debugging functions to the window object
 * for easier troubleshooting of auth issues via the browser console
 */
export function useAuthDebug() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // @ts-ignore - Adding custom properties to window
      window.debugAuth = debugAuthToken;
      // @ts-ignore
      window.resetAuth = resetAuthState;
      
      console.info('Auth debugging tools attached to window. Use these in console:');
      console.info('- window.debugAuth() - Show token information');
      console.info('- window.resetAuth() - Reset auth state');
    }
  }, []);
} 