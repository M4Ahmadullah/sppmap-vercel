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
  // Guard clause: don't render if sessionTimeInfo is null/undefined
  if (!sessionTimeInfo) {
    return null;
  }

  // Get current time in London timezone
  const getCurrentLondonTime = () => new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/London"}));
  const [currentTime, setCurrentTime] = useState(getCurrentLondonTime());
  const [timeInfo, setTimeInfo] = useState(sessionTimeInfo);
  const { isDarkMode } = useDarkMode();

  // Update timeInfo when sessionTimeInfo prop changes
  useEffect(() => {
    setTimeInfo(sessionTimeInfo);
  }, [sessionTimeInfo]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentLondonTime());
      // Update time info to reflect current time changes
      // This will trigger re-calculation of elapsed and remaining times
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    
    // Calculate elapsed time from session start to current time
    const startStr = typeof timeInfo.sessionStart === 'string' ? timeInfo.sessionStart : timeInfo.sessionStart.toISOString();
    const startTime = startStr.replace(/\+.*$/, ''); // Remove timezone
    const start = new Date(startTime);
    const now = new Date();
    
    const elapsedMs = now.getTime() - start.getTime();
    
    if (elapsedMs < 0) return '0m';
    
    const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate remaining time using API data
  const getRemainingTime = () => {
    if (timeInfo.status !== 'active') return '0m';
    
    // Use API data if available, otherwise calculate
    if (timeInfo.timeRemaining) {
      const remainingMs = timeInfo.timeRemaining;
      
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    
    // Fallback calculation
    const endStr = typeof timeInfo.sessionEnd === 'string' ? timeInfo.sessionEnd : timeInfo.sessionEnd.toISOString();
    const endTime = endStr.replace(/\+.*$/, ''); // Remove timezone
    const end = new Date(endTime);
    const now = new Date();
    
    const remainingMs = end.getTime() - now.getTime();
    
    if (remainingMs < 0) return '0m';
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format session times (with 15-minute buffer included)
  const formatSessionTimes = () => {
    // Parse the session times correctly
    const startStr = typeof timeInfo.sessionStart === 'string' ? timeInfo.sessionStart : timeInfo.sessionStart.toISOString();
    const endStr = typeof timeInfo.sessionEnd === 'string' ? timeInfo.sessionEnd : timeInfo.sessionEnd.toISOString();
    
    // Remove timezone info and parse as London time
    const startTime = startStr.replace(/\+.*$/, ''); // Remove +01:00
    const endTime = endStr.replace(/\+.*$/, ''); // Remove +01:00
    
    return {
      start: new Date(startTime).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      }),
      end: new Date(endTime).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      })
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
        {timeInfo.status === 'active' && timeInfo.display.progress !== undefined && (
          <div className="w-full rounded-full h-1.5 mb-2 overflow-hidden bg-white/10 backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${timeInfo.display.progress}%` }}
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

