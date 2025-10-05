'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogIn, Clock } from 'lucide-react';
import { useDarkMode } from '@/lib/dark-mode-context';

interface ProtectedMapRouteProps {
  children: React.ReactNode;
  routeName?: string;
}

export default function ProtectedMapRoute({ children, routeName = "Map Route" }: ProtectedMapRouteProps) {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();
  const [isValidating, setIsValidating] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch('/api/auth/validate', {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || !data.user) {
          setIsExpired(true);
          setError(data.error || 'Session expired');
          return;
        }

        // Check if user is admin (no expiration for admins)
        if (data.user.isAdmin) {
          setIsValidating(false);
          return;
        }

        // For regular users, check session time info
        if (data.user.sessionTimeInfo) {
          const sessionTimeInfo = data.user.sessionTimeInfo;
          
          if (sessionTimeInfo.status === 'expired') {
            setIsExpired(true);
            setError('Session time window has expired');
            return;
          }

          // Session is still valid
          setIsValidating(false);
        } else {
          setIsExpired(true);
          setError('No session information available');
        }
      } catch (error) {
        console.error('Error validating session:', error);
        setIsExpired(true);
        setError('Failed to verify session');
      }
    };

    validateSession();

    // Check every 30 seconds
    const interval = setInterval(validateSession, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleSessionExpiredRedirect = () => {
    router.push('/session-expired?expired=true');
  };

  if (isValidating) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <Card className={`w-full max-w-md backdrop-blur-sm ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'
        }`}>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Validating session...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <Card className={`w-full max-w-md backdrop-blur-sm ${
          isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'
        }`}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-red-500/20 border border-red-500/30">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Session Expired
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className={`text-center ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <p className="mb-2">
                Your session has expired. Please log in again to access {routeName}.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Session time window has ended</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSessionExpiredRedirect}
                className="w-full bg-gradient-to-r from-[#21398F] to-[#1a2c7a] hover:from-[#1a2c7a] hover:to-[#131f5c] text-white"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Return to Login
              </Button>
            </div>

            <div className={`text-xs text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p>For security reasons, sessions automatically expire after your scheduled time window.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session is valid, render the map route
  return <>{children}</>;
}
