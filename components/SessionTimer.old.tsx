'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Lock, CheckCircle } from 'lucide-react';
import { useDarkMode } from '@/lib/dark-mode-context';

interface SessionTimerProps {
  sessionTimeInfo: {
    status: 'waiting' | 'active' | 'expired';
    display: {
      message: string;
      color: 'yellow' | 'green' | 'red';
      elapsedTime?: string;
      progress?: number;
    };
    hasMapAccess: boolean;
    sessionStart: string;
    sessionEnd: string;
    currentTime: string;
    sessionDuration?: string;
    elapsedTime?: string;
  };
}

export default function SessionTimer({ sessionTimeInfo }: SessionTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeInfo, setTimeInfo] = useState(sessionTimeInfo);
  const { isDarkMode } = useDarkMode();

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Recalculate time info based on current time
      // This would ideally come from the server, but for now we'll update locally
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (timeInfo.status) {
      case 'waiting':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'expired':
        return <Lock className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (timeInfo.display.color) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMapAccessIcon = () => {
    return timeInfo.hasMapAccess ? (
      <MapPin className="h-4 w-4 text-green-600" />
    ) : (
      <Lock className="h-4 w-4 text-red-600" />
    );
  };

  const formatSessionTimes = () => {
    const start = new Date(timeInfo.sessionStart);
    const end = new Date(timeInfo.sessionEnd);
    
    return {
      start: start.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      }),
      end: end.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      })
    };
  };

  const sessionTimes = formatSessionTimes();

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

      {/* Main Status Message */}
      <div className="text-center mb-3">
        <p className={`font-bold mb-2 text-sm ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {timeInfo.display.message}
        </p>
        
        {/* Countdown Timer */}
        {timeInfo.display.countdown && (
          <div className={`text-lg font-mono font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {timeInfo.display.countdown}
          </div>
        )}
        
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
      <div className={`flex items-center justify-center gap-2 p-2 rounded-lg border backdrop-blur-sm ${
        timeInfo.hasMapAccess 
          ? 'bg-green-500/10 border-green-400/20' 
          : 'bg-red-500/10 border-red-400/20'
      }`}>
        {getMapAccessIcon()}
        <span className={`font-semibold text-xs ${
          timeInfo.hasMapAccess 
            ? isDarkMode ? 'text-green-300' : 'text-green-700'
            : isDarkMode ? 'text-red-300' : 'text-red-700'
        }`}>
          {timeInfo.hasMapAccess ? 'Maps & Routes Available' : 'Maps & Routes Locked'}
        </span>
      </div>
    </div>
  );
}
