import { useEffect, useState } from 'react';
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

          // Redirect to session expired page
          router.push('/session-expired?expired=true');
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

            // Redirect to session expired page
            router.push('/session-expired?expired=true');
            return;
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

    // Check every 30 seconds
    const interval = setInterval(checkSessionExpiration, 30000);

    return () => clearInterval(interval);
  }, [router]);

  return expirationResult;
}
