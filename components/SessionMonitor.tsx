'use client';

import { useSessionMonitor } from '@/lib/use-session-monitor';
import { usePathname } from 'next/navigation';

export default function SessionMonitor() {
  const pathname = usePathname();
  
  // Don't run session monitoring on login page
  const shouldMonitor = pathname !== '/login';
  
  useSessionMonitor({
    checkInterval: shouldMonitor ? 5000 : 0, // Disable if on login page
    onSessionExpired: () => {
    }
  });

  // This component doesn't render anything
  return null;
}
