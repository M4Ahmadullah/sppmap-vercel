'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SessionMonitorOptions {
  checkInterval?: number; // milliseconds between checks
  onSessionExpired?: () => void;
}

export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { checkInterval = 30000, onSessionExpired } = options; // Default 30 seconds

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.user) {
        // Session is invalid/expired
        console.log('🔄 Session expired - redirecting to login');
        
        // Clear any existing intervals
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // Call custom handler if provided
        if (onSessionExpired) {
          onSessionExpired();
        }

        // Force redirect to login
        router.push('/login');
        return;
      }

      // For regular users, check if their session time window has expired
      if (!data.user.isAdmin && data.user.sessionTimeInfo) {
        const sessionTimeInfo = data.user.sessionTimeInfo;
        
        if (sessionTimeInfo.status === 'expired') {
          console.log('🔄 Session time window expired - redirecting to login');
          
          // Clear any existing intervals
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Call custom handler if provided
          if (onSessionExpired) {
            onSessionExpired();
          }

          // Force redirect to login
          router.push('/login');
          return;
        }
      }

      // Session is still valid
      console.log('✅ Session is valid');

    } catch (error) {
      console.error('Error checking session:', error);
      // On error, assume session is invalid and redirect
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      router.push('/login');
    }
  }, [router, onSessionExpired]);

  useEffect(() => {
    // Start monitoring
    console.log('🔄 Starting session monitoring... (checking every', checkInterval / 1000, 'seconds)');
    intervalRef.current = setInterval(checkSession, checkInterval);

    // Check immediately
    checkSession();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log('🔄 Stopping session monitoring');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkInterval, checkSession]);

  // Return function to manually check session
  return {
    checkSession,
    stopMonitoring: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };
}
