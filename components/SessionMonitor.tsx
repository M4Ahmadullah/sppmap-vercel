'use client';

import { useSessionMonitor } from '@/lib/use-session-monitor';

export default function SessionMonitor() {
  useSessionMonitor({
    checkInterval: 5000, // Check every 5 seconds for more responsive monitoring
    onSessionExpired: () => {
    }
  });

  // This component doesn't render anything
  return null;
}
