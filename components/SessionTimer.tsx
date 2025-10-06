'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Lock, CheckCircle } from 'lucide-react';
import { useDarkMode } from '@/lib/dark-mode-context';

interface SessionTimerProps {
  sessionTimeInfo: {
    status: 'waiting' | 'active' | 'expired';
    display: {
      message: string;
      color: 'yellow' | 'green' | 'red';
      progress?: number;
    };
    hasMapAccess: boolean;
    sessionStart: string | Date;
    sessionEnd: string | Date;
    currentTime: string | Date;
    timeRemaining?: number;
    timeElapsed?: number;
  } | null | undefined;
}

export default function SessionTimer({ sessionTimeInfo }: SessionTimerProps) {
  // Get current time in London timezone
  const getCurrentLondonTime = () => {
    const now = new Date();
    // Convert to London timezone properly
    return new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  };
  const [currentTime, setCurrentTime] = useState(getCurrentLondonTime());
  const [timeInfo, setTimeInfo] = useState(sessionTimeInfo);
  const { isDarkMode } = useDarkMode();

  // Update timeInfo when sessionTimeInfo prop changes
  useEffect(() => {
    setTimeInfo(sessionTimeInfo);
  }, [sessionTimeInfo]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCurrentTime = getCurrentLondonTime();
      setCurrentTime(newCurrentTime);
      
      // Update current time and recalculate elapsed/remaining times in real-time
      if (timeInfo && timeInfo.status === 'active') {
        // Get current London time properly
        const now = new Date();
        const currentLondonTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
        
        // Parse session times - they're in format "2025-10-06 15:35:00+01:00"
        // The +01:00 indicates London time (BST), so we need to handle this properly
        const sessionStartStr = typeof timeInfo.sessionStart === 'string' ? timeInfo.sessionStart : timeInfo.sessionStart.toISOString();
        const sessionEndStr = typeof timeInfo.sessionEnd === 'string' ? timeInfo.sessionEnd : timeInfo.sessionEnd.toISOString();
        
        // Convert session times to proper Date objects
        // Remove the +01:00 and treat as London local time
        const sessionStartClean = sessionStartStr.replace('+01:00', '').replace(' ', 'T');
        const sessionEndClean = sessionEndStr.replace('+01:00', '').replace(' ', 'T');
        
        const sessionStart = new Date(sessionStartClean);
        const sessionEnd = new Date(sessionEndClean);
        
        // Calculate elapsed and remaining time in real-time
        const elapsedMs = Math.max(0, currentLondonTime.getTime() - sessionStart.getTime());
        const remainingMs = Math.max(0, sessionEnd.getTime() - currentLondonTime.getTime());
        const totalSessionMs = sessionEnd.getTime() - sessionStart.getTime();
        const progress = totalSessionMs > 0 ? Math.min(100, Math.max(0, (elapsedMs / totalSessionMs) * 100)) : 0;
        
        // Debug logging
        console.log('SessionTimer Debug:', {
          currentLondonTime: currentLondonTime.toISOString(),
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString(),
          elapsedMs: elapsedMs,
          remainingMs: remainingMs,
          progress: progress,
          elapsedMinutes: Math.floor(elapsedMs / (1000 * 60)),
          remainingMinutes: Math.floor(remainingMs / (1000 * 60))
        });
        
        // Update timeInfo with real-time calculations
        setTimeInfo(prev => prev ? {
          ...prev,
          timeElapsed: elapsedMs,
          timeRemaining: remainingMs,
          currentTime: currentLondonTime.toISOString(),
          display: {
            ...prev.display,
            progress: progress
          }
        } : prev);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timeInfo]);

  // Guard clause: don't render if sessionTimeInfo is null/undefined
  if (!sessionTimeInfo || !timeInfo) {
    return null;
  }

  const getStatusIcon = () => {
    switch (timeInfo.status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'waiting':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (timeInfo.display.color) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMapAccessIcon = () => {
    return <MapPin className="h-4 w-4 text-green-600" />;
  };

  // Calculate session duration (with 15-minute buffer included)
  const getSessionDuration = () => {
    const start = typeof timeInfo.sessionStart === 'string' ? new Date(timeInfo.sessionStart) : timeInfo.sessionStart;
    const end = typeof timeInfo.sessionEnd === 'string' ? new Date(timeInfo.sessionEnd) : timeInfo.sessionEnd;
    
    // Session duration includes the 15-minute buffer on both sides
    const durationMs = end.getTime() - start.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate elapsed time using API data
  const getElapsedTime = () => {
    if (timeInfo.status !== 'active') return '0m';
    
    // Always use API data - it's already calculated correctly
    if (timeInfo.timeElapsed !== undefined) {
      const elapsedMs = timeInfo.timeElapsed;
      
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    return '0m';
  };

  // Calculate remaining time using API data
  const getRemainingTime = () => {
    if (timeInfo.status !== 'active') return '0m';
    
    // Always use API data - it's already calculated correctly
    if (timeInfo.timeRemaining !== undefined) {
      const remainingMs = timeInfo.timeRemaining;
      
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    return '0m';
  };

  // Format session times (with 15-minute buffer included)
  const formatSessionTimes = () => {
    // Extract time from London timezone strings
    const startStr = typeof timeInfo.sessionStart === 'string' ? timeInfo.sessionStart : timeInfo.sessionStart.toISOString();
    const endStr = typeof timeInfo.sessionEnd === 'string' ? timeInfo.sessionEnd : timeInfo.sessionEnd.toISOString();
    
    // Extract just the time part (HH:MM) from the London timezone string
    // Format: "2025-10-05 15:10:00+01:00" -> "15:10"
    const startTime = startStr.split(' ')[1]?.split('+')[0] || startStr;
    const endTime = endStr.split(' ')[1]?.split('+')[0] || endStr;
    
    return {
      start: startTime.substring(0, 5), // Extract HH:MM
      end: endTime.substring(0, 5)      // Extract HH:MM
    };
  };

  const sessionTimes = formatSessionTimes();
  const sessionDuration = getSessionDuration();
  const elapsedTime = getElapsedTime();

  return (
    <div className="backdrop-blur-xl rounded-xl border border-white/10 p-4 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`font-semibold text-sm ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Session Status</span>
        </div>
        <Badge className={`${getStatusColor()} font-semibold text-xs`}>
          {timeInfo.status.toUpperCase()}
        </Badge>
      </div>

      {/* Session Duration, Elapsed & Remaining Time */}
      <div className="text-center mb-3">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {/* Total Duration */}
          <div className={`p-2 rounded-lg border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/60 border-gray-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Duration</p>
            <p className={`font-mono text-sm font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{sessionDuration}</p>
          </div>
          
          {/* Elapsed Time */}
          <div className={`p-2 rounded-lg border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/60 border-gray-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Elapsed</p>
            <p className={`font-mono text-sm font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{elapsedTime}</p>
          </div>

          {/* Remaining Time */}
          <div className={`p-2 rounded-lg border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-white/5 border-white/10' 
              : 'bg-white/60 border-gray-200'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Remaining</p>
            <p className={`font-mono text-sm font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>{getRemainingTime()}</p>
          </div>
        </div>
        
        {/* Progress Bar for Active Session */}
        {timeInfo.status === 'active' && (
          <div className="w-full rounded-full h-1.5 mb-2 overflow-hidden bg-white/10 backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${timeInfo.display.progress || 0}%` }}
            />
          </div>
        )}
      </div>

      {/* Session Times */}
      <div className={`text-center p-2 rounded-lg border backdrop-blur-sm mb-3 ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white/60 border-gray-200'
      }`}>
        <p className={`text-xs font-semibold mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Session Window</p>
        <p className={`font-mono text-sm font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {sessionTimes.start} - {sessionTimes.end}
        </p>
        <p className={`text-xs mt-1 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>London Time</p>
      </div>

      {/* Map Access Status */}
      <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border backdrop-blur-sm bg-green-500/10 border-green-400/20`}>
        {getMapAccessIcon()}
        <span className={`font-semibold text-xs ${
          isDarkMode ? 'text-green-300' : 'text-green-700'
        }`}>
          Maps & Routes Available
        </span>
      </div>
    </div>
  );
}

