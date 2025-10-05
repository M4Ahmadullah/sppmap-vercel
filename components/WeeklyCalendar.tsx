'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
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
}

export default function WeeklyCalendar({ events, topoUsers = [], isLoadingTopoUsers = false }: WeeklyCalendarProps) {
  const { isDarkMode } = useDarkMode();
  
  // Get the week that contains the events (not necessarily current week)
  const getEventsWeek = useCallback(() => {
    if (events.length === 0) {
      // If no events, show current week in London timezone
      const now = new Date();
      return new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    }
    
    // Find the earliest event date to determine which week to show
    const earliestEvent = events.reduce((earliest, event) => {
      const eventDate = new Date(event.sessionStart);
      return eventDate < earliest ? eventDate : earliest;
    }, new Date(events[0].sessionStart));
    
    return earliestEvent;
  }, [events]);
  
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
    
    const now = new Date();
    const currentLondonTime = now.toLocaleString("sv-SE", {timeZone: "Europe/London"});
    
    // Find matching topo user session for this event
    const topoUserSession = topoUsers.find(topo => 
      topo.email === event.email && 
      topo.eventTitle === event.title
    );
    
    // Use buffered times from topo_users if available, otherwise use original times
    const sessionStart = topoUserSession?.sessionStart || event.sessionStart;
    const sessionEnd = topoUserSession?.sessionEnd || event.sessionEnd;
    
    if (currentLondonTime < sessionStart) {
      return { status: 'incoming', label: 'Incoming', color: 'blue' };
    } else if (currentLondonTime >= sessionStart && currentLondonTime <= sessionEnd) {
      return { status: 'active', label: 'Currently Active', color: 'green' };
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

  const weekDays = getWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  return (
    <Card className={`w-full backdrop-blur-sm ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center justify-between ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Schedule
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              ←
            </button>
            <button
              onClick={goToCurrentWeek}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isDarkMode 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={goToNextWeek}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className={`text-center font-semibold py-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[200px] p-2 rounded-lg border backdrop-blur-sm ${
                  isToday 
                    ? isDarkMode
                      ? 'bg-blue-500/20 border-blue-400/30'
                      : 'bg-blue-50 border-blue-200'
                    : isDarkMode
                      ? 'bg-white/5 border-white/10'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${
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
                        className={`text-xs rounded p-3 border shadow-sm backdrop-blur-sm min-h-[100px] ${
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
                        <div className={`space-y-1 mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{formatTime(event.sessionStart)} - {formatTime(event.sessionEnd)}</span>
                          </div>
                          <div className="text-xs">
                            Duration: {getDuration(event.sessionStart, event.sessionEnd)}
                          </div>
                        </div>
                        
                                {/* Status Badge */}
                                <div className="mt-2 flex justify-end">
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
          <div className="flex items-center justify-between">
            <span>Total sessions this week: {weekEvents.length}</span>
            <span>Unique users: {new Set(weekEvents.map(e => e.email)).size}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
