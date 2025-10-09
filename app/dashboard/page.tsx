'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ROUTE_CATEGORIES, getAvailableRoutesForUser, getAllRoutes } from '@/lib/routes';
import { MapPin, Clock, LogOut, User, Lock, RefreshCw, Database, ChevronDown, ChevronRight, Moon, Sun, Trash2, MoreVertical } from 'lucide-react';
import SessionTimer from '@/components/SessionTimer';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { useSessionExpiration } from '@/lib/use-session-expiration';
import { useDarkMode } from '@/lib/dark-mode-context';
import toast, { Toaster } from 'react-hot-toast';

interface User {
  email: string;
  name: string;
  sessionStart: string;
  sessionEnd: string;
  routes: string[];
  isAdmin?: boolean;
  sessionTimeInfo?: {
    status: 'waiting' | 'active' | 'expired';
    display: {
      message: string;
      color: 'yellow' | 'green' | 'red';
      countdown?: string;
      progress?: number;
    };
    hasMapAccess: boolean;
    sessionStart: string;
    sessionEnd: string;
    currentTime: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [topoUsers, setTopoUsers] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingTopoUsers, setIsLoadingTopoUsers] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);
  const [hasFetchedTopoUsers, setHasFetchedTopoUsers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const router = useRouter();

  // Session expiration check
  const sessionExpiration = useSessionExpiration();

  useEffect(() => {
    validateSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validateSession = async () => {
    try {
      const response = await fetch('/api/auth/validate');
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Session validation error:', err);
      setError('Session validation failed');
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events:', data.message);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const fetchTopoUsers = useCallback(async () => {
    if (isLoadingTopoUsers) return; // Prevent multiple calls
    setIsLoadingTopoUsers(true);
    try {
      const response = await fetch('/api/topo-users');
      const data = await response.json();
      
      if (response.ok) {
        setTopoUsers(data.sessions || []);
      } else {
        console.error('Failed to fetch topo users:', data.message);
      }
    } catch (err) {
      console.error('Error fetching topo users:', err);
    } finally {
      setIsLoadingTopoUsers(false);
    }
  }, [isLoadingTopoUsers]);

  // Load events and topo users immediately for admin users
  useEffect(() => {
    if (user?.isAdmin && events.length === 0 && !isLoadingEvents && !hasFetchedEvents) {
      setHasFetchedEvents(true);
      fetchEvents();
    }
    if (user?.isAdmin && topoUsers.length === 0 && !isLoadingTopoUsers && !hasFetchedTopoUsers) {
      setHasFetchedTopoUsers(true);
      fetchTopoUsers();
    }
  }, [user?.isAdmin, events.length, topoUsers.length, isLoadingEvents, isLoadingTopoUsers, hasFetchedEvents, hasFetchedTopoUsers, fetchEvents, fetchTopoUsers]);

  // Lazy load events when user scrolls to calendar section
  const handleScroll = useCallback(() => {
    if (!user?.isAdmin || isLoadingEvents || isLoadingTopoUsers) return;
    
    const calendarSection = document.getElementById('weekly-calendar');
    if (calendarSection) {
      const rect = calendarSection.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        if (events.length === 0) {
          fetchEvents();
        }
        if (topoUsers.length === 0) {
          fetchTopoUsers();
        }
      }
    }
  }, [user?.isAdmin, events.length, topoUsers.length, isLoadingEvents, isLoadingTopoUsers, fetchEvents, fetchTopoUsers]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleForceRefresh = async () => {
    try {
      // Refresh data
      setUser(null);
      setIsLoading(true);
      
      // Force a fresh session validation
      await validateSession();
    } catch (err) {
      console.error('Force refresh failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete the admin account for ${user?.email}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteMessage('');

    try {
      const response = await fetch('/api/admin/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteMessage('✅ Account deleted successfully. You will be logged out.');
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        setDeleteMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setDeleteMessage('❌ Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setSyncProgress(0);
    
    try {
      // Step 1: Check cookies and re-login if needed
      setSyncProgress(5);
      setSyncMessage('Checking authentication...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSyncProgress(15);
      setSyncMessage('Connecting to TeamUp...');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setSyncProgress(25);
      setSyncMessage('Fetching calendar data...');
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setSyncProgress(60);
      setSyncMessage('Processing events...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const data = await response.json();
      
      setSyncProgress(80);
      setSyncMessage('Saving to database...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setSyncProgress(95);
      setSyncMessage('Finalizing sync...');
      await new Promise(resolve => setTimeout(resolve, 200));

      if (response.ok) {
        setSyncMessage(`✅ Sync completed! ${data.summary.newEvents} new events, ${data.summary.updatedEvents} updated events.`);
        toast.success(`Sync successful! ${data.summary.newEvents} new events, ${data.summary.updatedEvents} updated events.`, {
          duration: 4000,
          style: {
            background: '#21398F',
            color: '#fff',
          },
        });
        // Refresh events for admin users
        if (user?.isAdmin) {
          setHasFetchedEvents(false);
          setHasFetchedTopoUsers(false);
          fetchEvents();
          fetchTopoUsers();
        } else {
          // For regular users, refresh their session data to get updated times
          try {
            const sessionResponse = await fetch('/api/auth/validate', {
              method: 'GET',
              credentials: 'include'
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              if (sessionData.user) {
                // Update user state with fresh session data
                setUser(sessionData.user);
              }
            }
          } catch (error) {
            console.error('Error refreshing user session:', error);
          }
        }
      } else {
        setSyncMessage(`❌ Sync failed: ${data.message}`);
        toast.error(`Sync failed: ${data.message}`, {
          duration: 4000,
          style: {
            background: '#DC2626',
            color: '#fff',
          },
        });
      }
      
      setSyncProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setSyncMessage('❌ Network error during sync');
      setSyncProgress(0);
      toast.error('Network error during sync. Please try again.', {
        duration: 4000,
        style: {
          background: '#DC2626',
          color: '#fff',
        },
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncMessage('');
      }, 3000);
    }
  };

  const handleRouteClick = (routeId: string) => {
    // Find the route to get its path
    const route = getAllRoutes().find(r => r.id === routeId);
    if (!route) return;
    
    // Navigate to the specific route page in the same tab
    router.push(route.path);
  };

  const toggleCategory = (categoryId: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryId)) {
      newCollapsed.delete(categoryId);
    } else {
      newCollapsed.add(categoryId);
    }
    setCollapsedCategories(newCollapsed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const availableRoutes = getAvailableRoutesForUser(user?.routes || []);
  const sessionStart = new Date(user?.sessionStart || '').toLocaleString();
  const sessionEnd = new Date(user?.sessionEnd || '').toLocaleString();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* Fixed Header */}
    <header className={`fixed top-0 left-0 right-0 z-50 overflow-hidden transition-colors ${
      isDarkMode 
        ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' 
        : 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900'
    } text-white shadow-lg`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  SPPMap
                </h1>
              </div>
            </div>
                <div className="flex items-center space-x-6">
                  {/* Dark Mode Toggle */}
                  <Button
                    onClick={toggleDarkMode}
                    variant="outline"
                    size="sm"
                    className="text-white border-white/30 "
                  >
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>

                  {/* User Menu Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white border-white/30 "
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={`w-56  ${
                      isDarkMode 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/90 border-gray-200'
                    }`}>
                      <DropdownMenuItem onClick={handleLogout} className={`cursor-pointer ${
                        isDarkMode ? 'text-white hover:bg-white/20' : 'text-gray-900 hover:bg-gray-100'
                      }`}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                      {user?.isAdmin && (
                        <DropdownMenuItem onClick={handleDeleteAccount} className={`cursor-pointer ${
                          isDarkMode ? 'text-red-300 hover:bg-red-500/20' : 'text-red-600 hover:bg-red-50'
                        }`}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        
        {/* Session Timer - Mobile/Tablet - Only for regular users */}
        {/* {!user?.isAdmin && user?.sessionTimeInfo && (
          <div className="lg:hidden mb-8">
            <SessionTimer sessionTimeInfo={user.sessionTimeInfo} />
          </div>
        )} */}

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
            {/* Welcome Container */}
            <div className="flex-1 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                  </h2>
                  <p className={`text-base sm:text-lg mb-4 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {user?.isAdmin 
                      ? '⚡ Admin Dashboard - Manage system and sync calendar data' 
                      : 'Ready to explore your topographical routes?'
                    }
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {availableRoutes.length} routes available
                    </div>
                  </div>
                </div>
                
                {/* London Time Display */}
                <div className={`text-left sm:text-right ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <div className="text-sm font-medium">London Time</div>
                  <div className="text-lg font-bold">
                    {new Date().toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'Europe/London'
                    })}
                  </div>
                </div>
                
                {user?.isAdmin && (
                  <div className="ml-0 lg:ml-8 flex flex-col items-center lg:items-end justify-between h-full space-y-3">
                    <span className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-full font-bold shadow-lg border border-blue-500">
                      ⚡ ADMIN
                    </span>
                    <Button
                      onClick={handleSyncDatabase}
                      disabled={isSyncing}
                      className={`px-6 sm:px-8 lg:px-10 py-4 sm:py-6 lg:py-8 text-sm sm:text-base lg:text-lg font-bold rounded-xl hover:rounded-2xl transition-all duration-500 relative overflow-hidden w-full sm:w-64 lg:w-80 ${
                        isSyncing
                          ? 'bg-slate-900 text-white cursor-not-allowed shadow-2xl border-2 border-slate-700'
                          : 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl'
                      }`}
                    >
                      {isSyncing ? (
                        <div className="relative z-20 flex items-center justify-center w-full h-full">
                          <div className="text-center">
                            <div className="text-white font-black text-xl sm:text-2xl lg:text-3xl drop-shadow-2xl mb-1 tracking-tight">
                              {syncProgress}%
                            </div>
                            <div className="text-blue-200 text-xs font-medium tracking-wider opacity-80">
                              SYNCING
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full">
                          <Database className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                          <span>Sync Database</span>
                        </div>
                      )}
                      
                      {/* Water Wave Fill Effect */}
                      {isSyncing && (
                        <div className="absolute inset-0 overflow-hidden rounded-xl">
                          {/* Background */}
                          <div className="absolute inset-0 bg-slate-800/50 rounded-xl"></div>
                          
                          {/* Water waves filling from left to right */}
                          <div 
                            className="absolute inset-0 transition-all duration-1000 ease-out rounded-xl"
                            style={{ width: `${syncProgress}%` }}
                          >
                            {/* Base water fill */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 rounded-xl"></div>
                            
                            {/* Animated wave patterns */}
                            <div className="absolute inset-0 overflow-hidden rounded-xl">
                              {/* Wave 1 - Primary */}
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                                style={{ 
                                  animationDuration: '2s',
                                  transform: 'skewY(-2deg)',
                                  height: '120%',
                                  top: '-10%'
                                }}
                              />
                              
                              {/* Wave 2 - Secondary */}
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse"
                                style={{ 
                                  animationDuration: '3s',
                                  animationDelay: '0.5s',
                                  transform: 'skewY(1deg)',
                                  height: '110%',
                                  top: '-5%'
                                }}
                              />
                              
                              {/* Wave 3 - Tertiary */}
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"
                                style={{ 
                                  animationDuration: '2.5s',
                                  animationDelay: '1s',
                                  transform: 'skewY(-1deg)',
                                  height: '115%',
                                  top: '-7.5%'
                                }}
                              />
                              
                              {/* Wave 4 - Surface ripples */}
                              <div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse"
                                style={{ 
                                  animationDuration: '1.5s',
                                  animationDelay: '0.3s',
                                  transform: 'skewY(0.5deg)',
                                  height: '105%',
                                  top: '-2.5%'
                                }}
                              />
                            </div>
                            
                            {/* Water surface highlight */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-t-xl"></div>
                            
                            {/* Side edge highlight */}
                            <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-transparent via-white/30 to-transparent rounded-r-xl"></div>
                          </div>
                          
                          {/* Floating water droplets */}
                          <div className="absolute inset-0">
                            <div 
                              className="absolute bg-white/40 rounded-full animate-bounce"
                              style={{ 
                                width: '4px',
                                height: '4px',
                                left: '15%',
                                top: '20%',
                                animationDuration: '3s',
                                animationDelay: '0s'
                              }}
                            />
                            <div 
                              className="absolute bg-white/35 rounded-full animate-bounce"
                              style={{ 
                                width: '3px',
                                height: '3px',
                                left: '35%',
                                top: '60%',
                                animationDuration: '4s',
                                animationDelay: '1s'
                              }}
                            />
                            <div 
                              className="absolute bg-white/30 rounded-full animate-bounce"
                              style={{ 
                                width: '5px',
                                height: '5px',
                                left: '55%',
                                top: '30%',
                                animationDuration: '5s',
                                animationDelay: '2s'
                              }}
                            />
                            <div 
                              className="absolute bg-white/45 rounded-full animate-bounce"
                              style={{ 
                                width: '2px',
                                height: '2px',
                                left: '75%',
                                top: '70%',
                                animationDuration: '3.5s',
                                animationDelay: '0.5s'
                              }}
                            />
                            <div 
                              className="absolute bg-white/25 rounded-full animate-bounce"
                              style={{ 
                                width: '3px',
                                height: '3px',
                                left: '85%',
                                top: '40%',
                                animationDuration: '4.5s',
                                animationDelay: '1.5s'
                              }}
                            />
                          </div>
                          
                          {/* Water reflection effects */}
                          <div className="absolute inset-0">
                            <div 
                              className="absolute bg-white/10 rounded-full animate-ping"
                              style={{ 
                                width: '30px',
                                height: '30px',
                                left: '25%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                animationDuration: '4s',
                                animationDelay: '0s'
                              }}
                            />
                            <div 
                              className="absolute bg-white/8 rounded-full animate-ping"
                              style={{ 
                                width: '50px',
                                height: '50px',
                                left: '60%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                animationDuration: '5s',
                                animationDelay: '1s'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Session Timer - Desktop - Only for regular users */}
            {/* {!user?.isAdmin && user?.sessionTimeInfo && (
              <div className="hidden lg:block">
                <SessionTimer sessionTimeInfo={user.sessionTimeInfo} />
              </div>
            )} */}
          </div>
        </div>


            {/* Delete Message */}
            {deleteMessage && (
              <div className="mb-6">
                <Alert className={`${
                  deleteMessage.includes('✅') 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <AlertDescription className="font-medium">
                    {deleteMessage}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Admin Calendar Section */}
            {user?.isAdmin && (
              <div id="weekly-calendar" className="mb-8">
                <WeeklyCalendar events={events} topoUsers={topoUsers} isLoadingTopoUsers={isLoadingTopoUsers} user={user} onRefreshTopoUsers={fetchTopoUsers} />
              </div>
            )}

            {/* Route Categories */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Route Categories</h2>
            <div className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {availableRoutes.length} total routes
            </div>
          </div>
          
          {/* Main Groups */}
          <div className="space-y-12">
            {/* 1: Basics */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Basics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(0, 3).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                                className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 2: Pass through */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Pass through</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(3, 6).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                              className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 3: No Access */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>No Access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(6, 9).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                              className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 4: Advanced Rules */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Advanced Rules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(9, 13).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                              className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 5: General Routes */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>General Routes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(13, 16).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                              className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 6: Special Routes */}
            <div>
              <h3 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Special Routes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ROUTE_CATEGORIES.slice(16, 18).map((category) => {
                  const categoryRoutes = availableRoutes.filter(route => route.category === category.id);
                  if (categoryRoutes.length === 0) return null;
                  return (
                    <Card key={category.id} className={`backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl ${
                      isDarkMode ? 'bg-white/5' : 'bg-white/60'
                    }`}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-2">
                          {categoryRoutes.map((route) => (
                            <Button
                              key={route.id}
                              variant="outline"
                              className={`route-button w-full h-8 justify-center text-center p-0 ${
                                isDarkMode 
                                  ? 'border-white/20 hover:bg-white/10 text-white bg-white/5' 
                                  : 'border-gray-200 hover:bg-gray-50 text-gray-900 bg-white/80'
                              }`}
                              onClick={() => handleRouteClick(route.id)}
                            >
                              <div className="font-bold text-sm text-center">
                                {route.routeNumber}
                              </div>
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
          },
        }}
      />
    </div>
  );
}
