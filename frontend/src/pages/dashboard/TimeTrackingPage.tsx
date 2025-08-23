import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Play, 
  Square, 
  Timer, 
  Activity,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Camera,
  QrCode,
  Wifi,
  WifiOff
} from 'lucide-react';

interface TimeEntry {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours: number;
  status: 'checked_in' | 'checked_out' | 'break' | 'missed';
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    accuracy: number;
  };
  notes?: string;
  deviceInfo?: string;
  isLate?: boolean;
  breakDuration?: number;
}

interface WorkLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  isActive: boolean;
}

const TimeTrackingPage: React.FC = () => {
  const { user, isLoadingUser } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [workingTime, setWorkingTime] = useState('00:00:00');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { toast } = useToast();

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access time tracking.</p>
        </div>
      </div>
    );
  }

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate working time if checked in
  useEffect(() => {
    if (activeEntry && activeEntry.status === 'checked_in' && activeEntry.checkInTime) {
      const timer = setInterval(() => {
        const checkInTime = new Date(activeEntry.checkInTime!);
        const now = new Date();
        const diff = now.getTime() - checkInTime.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setWorkingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setWorkingTime('00:00:00');
    }
  }, [activeEntry]);

  // Load data on component mount
  useEffect(() => {
    loadTimeTrackingData();
  }, [loadTimeTrackingData]);

  // Get user location
  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          setLocationError('');
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timeout';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Check if user is within work location
  const isWithinWorkLocation = (userLat: number, userLon: number): WorkLocation | null => {
    for (const location of workLocations) {
      if (location.isActive) {
        const distance = calculateDistance(userLat, userLon, location.latitude, location.longitude);
        if (distance <= location.radius) {
          return location;
        }
      }
    }
    return null;
  };

  // Load time tracking data
  const loadTimeTrackingData = useCallback(async () => {
    try {
      // TODO: Replace with actual API calls
      const mockTimeEntries: TimeEntry[] = [
        {
          id: '1',
          date: new Date().toISOString().split('T')[0],
          checkInTime: '2024-02-22T09:00:00Z',
          checkOutTime: '2024-02-22T17:30:00Z',
          totalHours: 8.5,
          status: 'checked_out',
          location: {
            latitude: 6.5244, 
            longitude: 3.3792,
            address: 'Lagos Office, Nigeria',
            accuracy: 10
          },
          notes: 'Regular work day'
        }
      ];

      const mockWorkLocations: WorkLocation[] = [
        {
          id: '1',
          name: 'Main Office',
          address: 'Victoria Island, Lagos, Nigeria',
          latitude: 6.4281,
          longitude: 3.4219,
          radius: 100,
          isActive: true
        },
        {
          id: '2',
          name: 'Branch Office',
          address: 'Ikeja, Lagos, Nigeria', 
          latitude: 6.6018,
          longitude: 3.3515,
          radius: 50,
          isActive: true
        }
      ];

      setTimeEntries(mockTimeEntries);
      setWorkLocations(mockWorkLocations);

      // Check if there's an active entry
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = mockTimeEntries.find(entry => 
        entry.date === today && entry.status === 'checked_in'
      );
      setActiveEntry(todayEntry || null);

    } catch (error) {
      console.error('Failed to load time tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time tracking data',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      setIsCheckingIn(true);
      
      // Get current location
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      // Check if within work location
      const validLocation = isWithinWorkLocation(latitude, longitude);
      if (!validLocation) {
        setIsLocationModalOpen(true);
        return;
      }

      const checkInData = {
        location: {
          latitude,
          longitude,
          address: validLocation.name,
          accuracy: position.coords.accuracy
        },
        notes: checkInNotes,
        deviceInfo: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Call the actual API endpoint
      console.log('🔄 Calling check-in API...');
      const response = await apiClient.checkIn(checkInData);
      
      if (response.success && response.data) {
        console.log('✅ Check-in successful:', response.data);
        
        // Create new time entry from API response
        const newEntry: TimeEntry = {
          id: response.data.id || Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          checkInTime: response.data.check_in_time || new Date().toISOString(),
          totalHours: 0,
          status: 'checked_in',
          location: checkInData.location,
          notes: checkInData.notes,
          deviceInfo: checkInData.deviceInfo
        };

        setActiveEntry(newEntry);
        setTimeEntries(prev => [newEntry, ...prev]);
        setCheckInNotes('');
      } else {
        throw new Error(response.message || 'Check-in failed');
      }

      toast({
        title: 'Checked In Successfully',
        description: `Checked in at ${validLocation.name}`,
      });

    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Handle location modal retry
  const handleLocationRetry = async () => {
    try {
      setIsLocationModalOpen(false);
      await getCurrentLocation();
      // Retry check-in after getting location
      await handleCheckIn();
    } catch (error) {
      console.error('Location retry failed:', error);
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (!activeEntry) return;

    try {
      setIsCheckingOut(true);
      
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      // Call the actual API endpoint
      console.log('🔄 Calling check-out API...');
      const response = await apiClient.checkOut({ latitude, longitude });
      
      if (response.success && response.data) {
        console.log('✅ Check-out successful:', response.data);
        
        const checkOutTime = new Date();
        const checkInTime = new Date(activeEntry.checkInTime!);
        const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

        const updatedEntry: TimeEntry = {
          ...activeEntry,
          checkOutTime: response.data.check_out_time || checkOutTime.toISOString(),
          totalHours: response.data.hours_worked || Math.round(totalHours * 100) / 100,
          status: 'checked_out',
          notes: activeEntry.notes + (checkOutNotes ? ` | Checkout: ${checkOutNotes}` : '')
        };

        setActiveEntry(null);
        setTimeEntries(prev => prev.map(entry => 
          entry.id === activeEntry.id ? updatedEntry : entry
        ));
        setCheckOutNotes('');
      } else {
        throw new Error(response.message || 'Check-out failed');
      }

      toast({
        title: 'Checked Out Successfully',
        description: `Total working time: ${totalHours.toFixed(2)} hours`,
      });

    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast({
        title: 'Check-out Failed',
        description: error.message || 'Failed to check out. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadTimeTrackingData();
  }, [loadTimeTrackingData]);

  // Get weekly summary
  const getWeeklySummary = () => {
    const weekEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      return entryDate >= weekStart;
    });

    const totalHours = weekEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const daysWorked = weekEntries.filter(entry => entry.totalHours > 0).length;
    const averageHours = daysWorked > 0 ? totalHours / daysWorked : 0;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      daysWorked,
      averageHours: Math.round(averageHours * 100) / 100,
      onTimePercentage: 95 // TODO: Calculate based on actual data
    };
  };

  const weeklySummary = getWeeklySummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Time Tracking
        </h1>
        <p className="text-muted-foreground">Track your work hours and manage attendance</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Clock */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Current Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            {activeEntry?.status === 'checked_in' && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-green-700 mb-1">Working Time</div>
                <div className="text-2xl font-bold text-green-800">{workingTime}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in/Check-out Controls */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Time Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeEntry || activeEntry.status === 'checked_out' ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Optional check-in notes..."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  rows={2}
                />
                <Button 
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Check In
                    </>
                  )}
                </Button>
                
                {locationError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <WifiOff className="h-4 w-4" />
                    {locationError}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Currently Checked In</span>
                  </div>
                  <div className="text-sm text-green-600">
                    Since: {new Date(activeEntry.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {activeEntry.location && (
                    <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      {activeEntry.location.address}
                    </div>
                  )}
                </div>
                
                <Textarea
                  placeholder="Optional check-out notes..."
                  value={checkOutNotes}
                  onChange={(e) => setCheckOutNotes(e.target.value)}
                  rows={2}
                />
                
                <Button 
                  onClick={handleCheckOut}
                  disabled={isCheckingOut}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <Square className="mr-2 h-4 w-4" />
                      Check Out
                    </>
                  )}
                </Button>
              </div>
            )}

            {userLocation && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Wifi className="h-4 w-4" />
                Location detected
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card className="bg-gradient-card shadow-xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="text-xs text-muted-foreground">Total Hours</div>
                <div className="text-lg font-bold text-primary">{weeklySummary.totalHours}h</div>
              </div>
              <div className="text-center p-3 bg-background/50 rounded-lg border">
                <div className="text-xs text-muted-foreground">Days Worked</div>
                <div className="text-lg font-bold text-primary">{weeklySummary.daysWorked}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>On-time Performance</span>
                <span className="font-medium">{weeklySummary.onTimePercentage}%</span>
              </div>
              <Progress value={weeklySummary.onTimePercentage} className="h-2" />
            </div>
            
            <div className="text-center p-3 bg-background/50 rounded-lg border">
              <div className="text-xs text-muted-foreground">Average Hours/Day</div>
              <div className="text-lg font-bold text-primary">{weeklySummary.averageHours}h</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Time Entries
          </CardTitle>
          <CardDescription>Your recent check-in and check-out records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeEntries.length > 0 ? (
              timeEntries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <Badge 
                        variant={entry.status === 'checked_out' ? 'default' : 
                               entry.status === 'checked_in' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {entry.status.replace('_', ' ')}
                      </Badge>
                      {entry.isLate && (
                        <Badge variant="destructive" className="text-xs">
                          Late
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {entry.checkInTime && (
                        <span>In: {new Date(entry.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {entry.checkOutTime && (
                        <span>Out: {new Date(entry.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      <span>Total: {entry.totalHours}h</span>
                      {entry.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {entry.location.address}
                        </div>
                      )}
                    </div>
                    {entry.notes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Notes: {entry.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-foreground">{entry.totalHours}h</div>
                    {entry.status === 'checked_in' && (
                      <div className="text-xs text-green-600">Active</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No time entries yet</h3>
                <p className="text-muted-foreground">Start tracking your time by checking in.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Error Modal */}
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Location Verification Required
            </DialogTitle>
            <DialogDescription>
              You must be within a designated work location to check in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm">
              <p className="font-medium mb-2">Available work locations:</p>
              <div className="space-y-2">
                {workLocations.filter(loc => loc.isActive).map((location) => (
                  <div key={location.id} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground">{location.address}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {userLocation && (
              <div className="text-sm">
                <p className="font-medium text-red-600">Current location not within work premises</p>
                <p className="text-muted-foreground">Please move closer to a work location and try again.</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsLocationModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleLocationRetry} className="flex-1">
                Retry Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimeTrackingPage;