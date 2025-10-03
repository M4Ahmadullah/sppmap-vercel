'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRouteById } from '@/lib/routes';
import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';

export default function RoutePage() {
  const params = useParams();
  const router = useRouter();
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const routeId = params.id as string;
    const routeData = getRouteById(routeId);
    
    if (routeData) {
      // Redirect to the actual newtopo route
      router.push(`/newtopo/routes/${routeId}`);
    } else {
      setError('Route not found');
      setIsLoading(false);
    }
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading route...</p>
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

  if (!route) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="text-white border-white hover:bg-white hover:text-red-800 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">{route.name}</h1>
                <p className="text-red-200 text-sm">Topographical Route Navigation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-lg">{route.description}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Difficulty</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    route.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    route.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Time</p>
                  <p className="text-lg flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {route.estimatedTime}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Coordinates</p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {route.coordinates.lat.toFixed(6)}, {route.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map Placeholder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Map</CardTitle>
                <CardDescription>
                  Navigate through the {route.name} route
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-16 w-16 mx-auto mb-4" />
                    <p className="text-lg font-medium">Map Integration Coming Soon</p>
                    <p className="text-sm">Interactive topographical map will be displayed here</p>
                    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
                      <p className="text-sm font-medium">Route: {route.name}</p>
                      <p className="text-xs text-gray-600">
                        Coordinates: {route.coordinates.lat.toFixed(6)}, {route.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Navigation Instructions</CardTitle>
            <CardDescription>
              Follow these steps to complete the {route.name} route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Start Point</p>
                  <p className="text-sm text-gray-600">Begin at the designated starting location</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Follow Route</p>
                  <p className="text-sm text-gray-600">Navigate through the marked path following topographical guidelines</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Complete Route</p>
                  <p className="text-sm text-gray-600">Finish at the designated endpoint</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
