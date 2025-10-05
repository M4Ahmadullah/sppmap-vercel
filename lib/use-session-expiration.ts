import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SessionExpirationResult {
  isExpired: boolean;
  timeRemaining: number | null;
  error: string | null;
}

export function useSessionExpiration() {
  const router = useRouter();
  const [expirationResult, setExpirationResult] = useState<SessionExpirationResult>({
    isExpired: false,
    timeRemaining: null,
    error: null
  });
  const sessionEndTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkSessionExpiration = async () => {
      try {
        // Verify the current session using the validate endpoint
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          // Session is expired or invalid
          setExpirationResult({
            isExpired: true,
            timeRemaining: null,
            error: data.error || 'Session expired'
          });

          // Clear session token and redirect to login
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/login?expired=true');
          return;
        }

        // Check if user is admin (no expiration for admins)
        if (data.user.isAdmin) {
          setExpirationResult({
            isExpired: false,
            timeRemaining: null,
            error: null
          });
          return;
        }

        // For regular users, check session time info
        if (data.user.sessionTimeInfo) {
          const sessionTimeInfo = data.user.sessionTimeInfo;
          
          if (sessionTimeInfo.status === 'expired') {
            setExpirationResult({
              isExpired: true,
              timeRemaining: null,
              error: 'Session time window has expired'
            });

            // Clear session token and redirect to login
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login?expired=true');
            return;
          }

          // Set up precise expiration timer
          if (sessionTimeInfo.timeRemaining && sessionTimeInfo.timeRemaining > 0) {
            const sessionEndTime = Date.now() + sessionTimeInfo.timeRemaining;
            
            // Only set up new timer if session end time has changed
            if (sessionEndTimeRef.current !== sessionEndTime) {
              sessionEndTimeRef.current = sessionEndTime;
              
              // Clear existing timeout
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              // Set up precise expiration timer
              timeoutRef.current = setTimeout(async () => {
                console.log('Session expired at exact time - logging out user');
                
                // Clear session token and redirect to login
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login?expired=true');
              }, sessionTimeInfo.timeRemaining);
            }
          }

          // Session is still valid
          setExpirationResult({
            isExpired: false,
            timeRemaining: sessionTimeInfo.timeRemaining || null,
            error: null
          });
        }
      } catch (error) {
        console.error('Error checking session expiration:', error);
        setExpirationResult({
          isExpired: true,
          timeRemaining: null,
          error: 'Failed to verify session'
        });
      }
    };

    // Check immediately
    checkSessionExpiration();

    // Check every 10 seconds for more precise monitoring
    const interval = setInterval(checkSessionExpiration, 10000);

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  return expirationResult;
}
