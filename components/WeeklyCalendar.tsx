'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, MapPin, XCircle } from 'lucide-react';
import { useDarkMode } from '@/lib/dark-mode-context';

interface CalendarEvent {
  _id: string;
  title: string;
  email: string;
  name: string;
  sessionStart: string;
  sessionEnd: string;
  createdAt: string;
}

interface WeeklyCalendarProps {
  events: CalendarEvent[];
  topoUsers?: any[]; // Add topoUsers prop for status calculation
  isLoadingTopoUsers?: boolean; // Add loading state prop
  user?: any; // Add user prop to check if admin
}

export default function WeeklyCalendar({ events, topoUsers = [], isLoadingTopoUsers = false, user }: WeeklyCalendarProps) {
  const { isDarkMode } = useDarkMode();
  const [expiringSessions, setExpiringSessions] = useState<Set<string>>(new Set());
  const [expiredSessions, setExpiredSessions] = useState<Set<string>>(new Set());
  
  // Always show current week by default, regardless of events
  const getEventsWeek = useCallback(() => {
    // Always show current week in London timezone
    const now = new Date();
    return new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  }, []);
  
  const [currentWeek, setCurrentWeek] = useState(getEventsWeek());
  const [weekEvents, setWeekEvents] = useState<CalendarEvent[]>([]);

  // Get start and end of current week (Monday to Sunday)
  const getWeekBounds = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  // Update current week when events change and filter events for current week
  useEffect(() => {
    // Update the week to show the week containing the events
    const eventsWeek = getEventsWeek();
    setCurrentWeek(eventsWeek);
    
    const { start, end } = getWeekBounds(eventsWeek);
    
    const filteredEvents = events.filter(event => {
      // Events are now stored in London timezone, so direct comparison
      const eventDate = new Date(event.sessionStart);
      return eventDate >= start && eventDate <= end;
    });

    setWeekEvents(filteredEvents);
  }, [events, getEventsWeek]);

  // Get week days
  const getWeekDays = () => {
    const { start } = getWeekBounds(currentWeek);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return weekEvents.filter(event => {
      // Events are already stored in London timezone, so direct comparison
      const eventDate = new Date(event.sessionStart);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/London'
    });
  };

  // Calculate duration between start and end times
  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  // Determine session status (Incoming, Currently Active, Expired/Inactive)
  const getSessionStatus = (event: CalendarEvent) => {
    // Show loading state if topo users data is still being fetched
    if (isLoadingTopoUsers) {
      return { status: 'loading', label: 'Loading...', color: 'gray' };
    }
    
    // Check if this session was manually expired
    if (expiredSessions.has(event._id)) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    }
    
    const now = new Date();
    const currentLondonTime = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    
    // Find matching topo user session for this event
    const topoUserSession = topoUsers.find(topo => 
      topo.email.toLowerCase() === event.email.toLowerCase() && 
      topo.eventTitle === event.title
    );
    
    // Use buffered times from topo_users if available, otherwise use original times
    const sessionStart = topoUserSession?.sessionStart || event.sessionStart;
    const sessionEnd = topoUserSession?.sessionEnd || event.sessionEnd;
    
    // Convert time strings to Date objects for proper comparison
    // Handle timezone-aware comparison properly
    const sessionStartTime = new Date(sessionStart);
    const sessionEndTime = new Date(sessionEnd);
    
    // Convert current London time to proper Date object
    // currentLondonTime is in format "2025-10-06 13:20:34" (London time)
    const currentTime = new Date(currentLondonTime + '+01:00'); // Add London timezone offset
    
    // Debug logging removed - issue fixed
    
    if (currentTime < sessionStartTime) {
      return { status: 'incoming', label: 'Incoming', color: 'blue' };
    } else if (currentTime >= sessionStartTime && currentTime <= sessionEndTime) {
      return { status: 'active', label: 'Active', color: 'green' };
    } else {
      return { status: 'expired', label: 'Expired', color: 'red' };
    }
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    setCurrentWeek(new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"})));
  };

  const handleExpireSession = async (event: CalendarEvent) => {
    if (!user?.isAdmin) return;
    
    setExpiringSessions(prev => new Set(prev).add(event._id));
    
    try {
      const response = await fetch('/api/debug/expire-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: event.email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add to expired sessions set to update the badge immediately
        setExpiredSessions(prev => new Set(prev).add(event._id));
        console.log('Session expired successfully for:', event.email);
        
        // Trigger immediate session check and redirect
        console.log('🔄 Triggering immediate session check for expired user...');
        
        // Check if this is the current user's session that was expired
        const checkIfCurrentUser = async () => {
          try {
            const response = await fetch('/api/auth/validate', {
              method: 'GET',
              credentials: 'include'
            });
            const data = await response.json();
            
            if (!response.ok || !data.user) {
              console.log('🔄 Current user session is invalid - redirecting immediately');
              window.location.href = '/login';
              return;
            }
            
            // Check if the expired user matches the current user
            if (data.user.email.toLowerCase() === event.email.toLowerCase()) {
              console.log('🔄 Current user session was expired - redirecting immediately');
              window.location.href = '/login';
            } else {
              console.log('🔄 Different user session expired - current user remains logged in');
            }
          } catch (error) {
            console.error('Error checking current user session:', error);
            window.location.href = '/login';
          }
        };
        
        // Run the check immediately
        checkIfCurrentUser();
      } else {
        console.error('Failed to expire session:', data.error);
        alert('Failed to expire session: ' + data.error);
      }
    } catch (error) {
      console.error('Error expiring session:', error);
      alert('Error expiring session');
    } finally {
      setExpiringSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(event._id);
        return newSet;
      });
    }
  };

  const weekDays = getWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  return (
    <Card className={`w-full backdrop-blur-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="text-lg sm:text-xl font-semibold">Weekly Schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              ←
            </button>
            <button
              onClick={goToCurrentWeek}
              className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className={`px-2 sm:px-3 py-1 text-sm rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              →
            </button>
          </div>
        </CardTitle>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {weekStart.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short' 
          })} - {weekEnd.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className={`text-center font-semibold py-2 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[120px] sm:min-h-[150px] lg:min-h-[200px] p-1 sm:p-2 rounded-lg border backdrop-blur-sm ${
                  isToday 
                    ? isDarkMode
                      ? 'bg-blue-500/20 border-blue-400/30'
                      : 'bg-blue-50 border-blue-200'
                    : isDarkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${
                  isToday 
                    ? isDarkMode 
                      ? 'text-blue-300' 
                      : 'text-blue-700'
                    : isDarkMode
                      ? 'text-gray-300'
                      : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map((event) => {
                    const sessionStatus = getSessionStatus(event);
                    return (
                      <div
                        key={event._id}
                        className={`text-xs rounded p-2 sm:p-3 border shadow-sm backdrop-blur-sm min-h-[80px] sm:min-h-[100px] ${
                          isDarkMode
                            ? 'bg-white/10 border-white/20'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                          {event.name}
                        </div>
                        <div className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {event.email}
                        </div>
                        <div className={`space-y-1 mt-1 sm:mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{formatTime(event.sessionStart)} - {formatTime(event.sessionEnd)}</span>
                          </div>
                          <div className="text-xs">
                            Duration: {getDuration(event.sessionStart, event.sessionEnd)}
                          </div>
                        </div>
                        
                                {/* Status Badge */}
                                <div className="mt-1 sm:mt-2 flex justify-end">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs px-2 py-1 ${
                                      sessionStatus.color === 'green' 
                                        ? 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-300 dark:bg-green-500/10'
                                        : sessionStatus.color === 'blue'
                                        ? 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-300 dark:bg-blue-500/10'
                                        : sessionStatus.color === 'gray'
                                        ? 'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-300 dark:bg-gray-500/10'
                                        : 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-300 dark:bg-red-500/10'
                                    }`}
                                  >
                                    {sessionStatus.label}
                                  </Badge>
                                </div>
                                
                                {/* Expire Session Button - Only for Admins and Active/Incoming Sessions */}
                                {user?.isAdmin && sessionStatus.status !== 'expired' && (
                                  <div className="mt-1 sm:mt-2 flex justify-center">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleExpireSession(event)}
                                      disabled={expiringSessions.has(event._id)}
                                      className="text-xs px-2 py-1 h-6 w-full bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      {expiringSessions.has(event._id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                          Expiring...
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Expire Session
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {weekEvents.length === 0 && (
          <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <p>No sessions scheduled for this week</p>
          </div>
        )}
        
        <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>Total sessions this week: {weekEvents.length}</span>
            <span>Unique users: {new Set(weekEvents.map(e => e.email)).size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
