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
    const interval = setInterval(async () => {
      const newCurrentTime = getCurrentLondonTime();
      setCurrentTime(newCurrentTime);
      
      // For active sessions, fetch fresh session data from API
      if (timeInfo && timeInfo.status === 'active') {
        try {
          const response = await fetch('/api/auth/validate');
          const data = await response.json();
          
          if (response.ok && data.user?.sessionTimeInfo) {
            setTimeInfo(data.user.sessionTimeInfo);
          }
        } catch (error) {
          console.error('Error fetching fresh session data:', error);
        }
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
    
    // Handle ISO format: "2025-10-09T19:15:00+01:00" -> "19:15"
    // Extract time part from ISO string
    const startTime = startStr.includes('T') ? startStr.split('T')[1]?.split('+')[0] : startStr;
    const endTime = endStr.includes('T') ? endStr.split('T')[1]?.split('+')[0] : endStr;
    
    return {
      start: startTime ? startTime.substring(0, 5) : '00:00', // Extract HH:MM
      end: endTime ? endTime.substring(0, 5) : '00:00'        // Extract HH:MM
    };
  };

  // Calculate extended window times with ±15 minute buffer
  const getExtendedWindowTimes = () => {
    const startStr = typeof timeInfo.sessionStart === 'string' ? timeInfo.sessionStart : timeInfo.sessionStart.toISOString();
    const endStr = typeof timeInfo.sessionEnd === 'string' ? timeInfo.sessionEnd : timeInfo.sessionEnd.toISOString();
    
    // Parse session times
    const sessionStart = new Date(startStr);
    const sessionEnd = new Date(endStr);
    
    // Add/subtract 15 minutes (15 * 60 * 1000 ms)
    const bufferMs = 15 * 60 * 1000;
    const extendedStart = new Date(sessionStart.getTime() - bufferMs);
    const extendedEnd = new Date(sessionEnd.getTime() + bufferMs);
    
    // Format times as HH:MM
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      });
    };
    
    return {
      start: formatTime(extendedStart),
      end: formatTime(extendedEnd)
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
        <p className={`text-xs font-semibold mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Session Windows</p>
        
        {/* Original Session Window */}
        <div className="mb-2">
          <p className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Original Session</p>
          <p className={`font-mono text-sm font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {sessionTimes.start} - {sessionTimes.end}
          </p>
        </div>
        
        {/* Extended Window with Buffer */}
        <div>
          <p className={`text-xs font-medium mb-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Login Access Window</p>
          <p className={`font-mono text-sm font-bold ${
            isDarkMode ? 'text-green-300' : 'text-green-700'
          }`}>
            {getExtendedWindowTimes().start} - {getExtendedWindowTimes().end}
          </p>
        </div>
        
        <p className={`text-xs mt-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>London Time (±15min buffer)</p>
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

