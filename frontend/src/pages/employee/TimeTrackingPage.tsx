import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Timer,
  Play,
  Square,
  History,
  TrendingUp
} from 'lucide-react';

interface TimeEntry {
  id: string;
  employeeId: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  locationStatus?: string;
  totalHours?: number;
  status: 'checked_in' | 'checked_out' | 'break' | 'overtime';
  notes?: string;
  deviceInfo?: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckInData {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  notes?: string;
  deviceInfo?: string;
}

interface CheckOutData {
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  notes?: string;
  deviceInfo?: string;
}

const EmployeeTimeTrackingPage: React.FC = () => {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workingTime, setWorkingTime] = useState('00:00:00');
  const { toast } = useToast();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate working time if checked in
  useEffect(() => {
    if (activeEntry && activeEntry.status === 'checked_in') {
      const timer = setInterval(() => {
        const checkInTime = new Date(activeEntry.checkInTime);
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

  const loadTimeTrackingData = async () => {
    try {
      setLoading(true);
      
      // Load active entry
      const activeResponse = await apiClient.getActiveTimeEntry();
      if (activeResponse.success && activeResponse.data?.timeEntry) {
        setActiveEntry(activeResponse.data.timeEntry);
      }

      // Load recent time entries (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const entriesResponse = await apiClient.getTimeEntries({ startDate, endDate });
      if (entriesResponse.success && entriesResponse.data?.entries) {
        setTimeEntries(entriesResponse.data.entries);
      }
    } catch (error) {
      console.error('Failed to load time tracking data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load time tracking data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadTimeTrackingData();
  }, [loadTimeTrackingData]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false);
          setCurrentLocation(position);
          resolve(position);
        },
        (error) => {
          setLocationLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      setCheckInLoading(true);
      
      let location;
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: 'Current Location' // Could be enhanced with reverse geocoding
        };
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        // Continue without location
      }

      const checkInData: CheckInData = {
        location,
        notes: checkInNotes,
        deviceInfo: navigator.userAgent
      };

      const response = await apiClient.checkIn(checkInData);
      
      if (response.success) {
        setActiveEntry(response.data.timeEntry);
        setCheckInNotes('');
        toast({
          title: 'Success',
          description: 'Checked in successfully',
          variant: 'default'
        });
        
        // Reload data to get updated entries
        await loadTimeTrackingData();
      } else {
        throw new Error(response.message || 'Check-in failed');
      }
    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({
        title: 'Check-in Failed',
        description: error.message || 'Failed to check in. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckOutLoading(true);
      
      let location;
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: 'Current Location'
        };
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        // Continue without location
      }

      const checkOutData: CheckOutData = {
        location,
        notes: checkOutNotes,
        deviceInfo: navigator.userAgent
      };

      const response = await apiClient.checkOut(checkOutData);
      
      if (response.success) {
        setActiveEntry(null);
        setCheckOutNotes('');
        toast({
          title: 'Success',
          description: 'Checked out successfully',
          variant: 'default'
        });
        
        // Reload data to get updated entries
        await loadTimeTrackingData();
      } else {
        throw new Error(response.message || 'Check-out failed');
      }
    } catch (error: any) {
      console.error('Check-out failed:', error);
      toast({
        title: 'Check-out Failed',
        description: error.message || 'Failed to check out. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCheckOutLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'checked_out':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overtime':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading time tracking data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-8 w-8 text-primary" />
          Time Tracking
        </h1>
        <p className="text-muted-foreground">Track your work hours and attendance</p>
      </div>

      {/* Current Status Card */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Current Status
          </CardTitle>
          <CardDescription>
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {currentTime.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="text-center space-y-4">
            {activeEntry ? (
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-800 border-green-200 text-lg px-4 py-2">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Checked In
                </Badge>
                <div className="text-3xl font-bold text-primary">{workingTime}</div>
                <p className="text-sm text-muted-foreground">
                  Started at {formatTime(activeEntry.checkInTime)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-lg px-4 py-2">
                  <XCircle className="h-4 w-4 mr-2" />
                  Not Checked In
                </Badge>
                <div className="text-3xl font-bold text-muted-foreground">00:00:00</div>
                <p className="text-sm text-muted-foreground">
                  Ready to start your workday
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {!activeEntry ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    disabled={checkInLoading}
                  >
                    {checkInLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-5 w-5 mr-2" />
                    )}
                    Check In
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Check In to Work</DialogTitle>
                    <DialogDescription>
                      Record your arrival and start tracking your work hours
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkin-notes">Notes (Optional)</Label>
                      <Textarea
                        id="checkin-notes"
                        placeholder="Add any notes about your check-in..."
                        value={checkInNotes}
                        onChange={(e) => setCheckInNotes(e.target.value)}
                      />
                    </div>
                    
                    {locationLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting your location...
                      </div>
                    )}
                    
                    {currentLocation && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <MapPin className="h-4 w-4" />
                        Location detected
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-end">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button 
                        onClick={handleCheckIn}
                        disabled={checkInLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {checkInLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Check In
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="px-8 py-3"
                    disabled={checkOutLoading}
                  >
                    {checkOutLoading ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Square className="h-5 w-5 mr-2" />
                    )}
                    Check Out
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Check Out from Work</DialogTitle>
                    <DialogDescription>
                      End your workday and calculate your total hours
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Current Session</span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Started: {activeEntry && formatTime(activeEntry.checkInTime)}
                      </p>
                      <p className="text-sm text-blue-600">
                        Duration: {workingTime}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="checkout-notes">Notes (Optional)</Label>
                      <Textarea
                        id="checkout-notes"
                        placeholder="Add any notes about your work today..."
                        value={checkOutNotes}
                        onChange={(e) => setCheckOutNotes(e.target.value)}
                      />
                    </div>
                    
                    {locationLoading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Getting your location...
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-end">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button 
                        onClick={handleCheckOut}
                        disabled={checkOutLoading}
                        variant="destructive"
                      >
                        {checkOutLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Square className="h-4 w-4 mr-2" />
                        )}
                        Check Out
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      <Card className="bg-gradient-card shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Time Entries
          </CardTitle>
          <CardDescription>Your work history for the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No time entries found</p>
              <p className="text-sm text-muted-foreground">Start tracking your time by checking in</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">
                        {formatDate(entry.checkInTime)}
                      </div>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {entry.totalHours && (
                      <div className="text-sm font-medium text-primary">
                        {formatHours(entry.totalHours)}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Check In:</span>
                      <div className="font-medium">{formatTime(entry.checkInTime)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check Out:</span>
                      <div className="font-medium">
                        {entry.checkOutTime ? formatTime(entry.checkOutTime) : 'Not checked out'}
                      </div>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Notes:</span>
                      <div className="mt-1 text-foreground">{entry.notes}</div>
                    </div>
                  )}
                  
                  {(entry.checkInLocation || entry.checkOutLocation) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Location tracked</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeTimeTrackingPage;