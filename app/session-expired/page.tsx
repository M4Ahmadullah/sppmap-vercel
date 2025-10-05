'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, LogIn } from 'lucide-react';
import { useDarkMode } from '@/lib/dark-mode-context';

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useDarkMode();
  
  const expired = searchParams.get('expired') === 'true';

  useEffect(() => {
    // Clear any stored session data
    localStorage.removeItem('user');
    sessionStorage.clear();
  }, []);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

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
              {expired 
                ? 'Your session has expired. Please log in again to continue.'
                : 'Your session is no longer valid. Please log in again.'
              }
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Session time window has ended</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLoginRedirect}
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

export default function SessionExpiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <SessionExpiredContent />
    </Suspense>
  );
}
