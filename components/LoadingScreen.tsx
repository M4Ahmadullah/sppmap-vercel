'use client';

import { useDarkMode } from '@/lib/dark-mode-context';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { isDarkMode } = useDarkMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by showing a neutral state initially
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300`}>
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        </div>
        
        <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent ${
          isDarkMode 
            ? 'from-white to-blue-200 text-white' 
            : 'from-gray-900 to-blue-600 text-gray-900'
        }`}>
          SPPMap
        </h1>
        
        <p className={`text-xl font-medium mb-4 ${
          isDarkMode ? 'text-blue-200' : 'text-blue-600'
        }`}>
          {message}
        </p>
        
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full animate-pulse delay-100 ${
            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
          }`}></div>
          <div className={`w-2 h-2 rounded-full animate-pulse delay-200 ${
            isDarkMode ? 'bg-blue-400' : 'bg-blue-600'
          }`}></div>
        </div>
      </div>
    </div>
  );
}
