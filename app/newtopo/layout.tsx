'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDarkMode } from "@/lib/dark-mode-context";
import { useEffect } from "react";

export default function TopoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isDarkMode } = useDarkMode();

  // Completely disable scrolling on newTOPO routes
  useEffect(() => {
    // Disable scrolling on body
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.bottom = '0';
    
    // Disable scrolling on html
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.width = '100vw';
    
    // Disable scrollbar completely
    document.body.style.scrollbarWidth = 'none'; // Firefox
    (document.body.style as any).msOverflowStyle = 'none'; // IE/Edge
    
    // Additional iframe scroll prevention
    const handleIframeLoad = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        try {
          // Try to access iframe content and disable scrolling
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.body.style.overflow = 'hidden';
            iframeDoc.documentElement.style.overflow = 'hidden';
            iframeDoc.body.style.scrollbarWidth = 'none';
            (iframeDoc.body.style as any).msOverflowStyle = 'none';
          }
        } catch (error) {
          // Cross-origin iframe - can't access content
          console.log('Cannot access iframe content due to CORS policy');
        }
      });
    };
    
    // Listen for iframe loads
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      iframe.addEventListener('load', handleIframeLoad);
    });
    
    // Cleanup function to restore scrolling when leaving
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.body.style.scrollbarWidth = '';
      (document.body.style as any).msOverflowStyle = '';
      
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.width = '';
      
      // Remove iframe event listeners
      iframes.forEach(iframe => {
        iframe.removeEventListener('load', handleIframeLoad);
      });
    };
  }, []);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div 
      className="relative no-scrollbar" 
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Fixed Back to Dashboard Button */}
      <Button
        onClick={handleBackToDashboard}
        className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 ${
          isDarkMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500' 
            : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300'
        }`}
        size="sm"
      >
        <Home className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      
      <div style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {children}
      </div>
    </div>
  );
}
