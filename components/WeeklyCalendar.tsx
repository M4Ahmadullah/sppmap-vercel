'use client';

import { useState, useEffect } from 'react';
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
}

export default function WeeklyCalendar({ events }: WeeklyCalendarProps) {
  const { isDarkMode } = useDarkMode();
  const [currentWeek, setCurrentWeek] = useState(new Date());
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

  // Filter events for current week
  useEffect(() => {
    const { start, end } = getWeekBounds(currentWeek);
    
    const filteredEvents = events.filter(event => {
      const eventDate = new Date(event.sessionStart);
      return eventDate >= start && eventDate <= end;
    });

    setWeekEvents(filteredEvents);
  }, [currentWeek, events]);

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
    setCurrentWeek(new Date());
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
                className={`min-h-[120px] p-2 rounded-lg border backdrop-blur-sm ${
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
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`text-xs rounded p-2 border shadow-sm backdrop-blur-sm ${
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
                      <div className={`space-y-1 mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{formatTime(event.sessionStart)} - {formatTime(event.sessionEnd)}</span>
                        </div>
                        <div className="text-xs">
                          Duration: {getDuration(event.sessionStart, event.sessionEnd)}
                        </div>
                      </div>
                    </div>
                  ))}
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
