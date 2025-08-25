import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { 
  MapPin, 
  Clock, 
  Users, 
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building2,
  Loader2,
  RefreshCw,
  Eye,
  Navigation
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'checked_in' | 'checked_out';
  totalHours?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  checkInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  checkOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  date: string;
  notes?: string;
}

interface LocationInfo {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
}

const AttendanceMonitorPage: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<AttendanceRecord | null>(null);
  const { toast } = useToast();

  // Go3net HQ Location
  const officeLocation: LocationInfo = {
    name: 'Go3net HQ',
    address: '5, Francis Aghedo Close, Beside Rain-Oil Fuel Station, Berger, Lagos State',
    latitude: 6.5244,
    longitude: 3.3792,
    radius: 100
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAttendanceReport({
        startDate: selectedDate,
        endDate: selectedDate
      });
      
      if (response.success && response.data) {
        setAttendanceRecords(response.data.records || []);
      } else {
        console.warn('No attendance data received');
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive'
      });
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Attendance data refreshed'
    });
  };

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

  const getLocationStatus = (location?: { latitude: number; longitude: number }) => {
    if (!location) return { status: 'unknown', distance: null };
    
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    );
    
    const isWithinOffice = distance <= officeLocation.radius;
    
    return {
      status: isWithinOffice ? 'office' : 'remote',
      distance: Math.round(distance)
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-500', text: 'Present' },
      checked_in: { color: 'bg-blue-500', text: 'Checked In' },
      checked_out: { color: 'bg-gray-500', text: 'Checked Out' },
      late: { color: 'bg-yellow-500', text: 'Late' },
      absent: { color: 'bg-red-500', text: 'Absent' },
      early_leave: { color: 'bg-orange-500', text: 'Early Leave' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-500', text: status };
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getLocationBadge = (location?: { latitude: number; longitude: number }) => {
    const locationStatus = getLocationStatus(location);
    
    if (locationStatus.status === 'office') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <MapPin className="h-3 w-3 mr-1" />
          Office ({locationStatus.distance}m)
        </Badge>
      );
    } else if (locationStatus.status === 'remote') {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Navigation className="h-3 w-3 mr-1" />
          Remote ({locationStatus.distance}m away)
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unknown Location
        </Badge>
      );
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = (record.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.employeeNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const stats = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => ['present', 'checked_in', 'late'].includes(r.status)).length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    inOffice: attendanceRecords.filter(r => getLocationStatus(r.checkInLocation).status === 'office').length,
    remote: attendanceRecords.filter(r => getLocationStatus(r.checkInLocation).status === 'remote').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading attendance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance Monitor</h1>
          <p className="text-muted-foreground mt-1">Real-time employee attendance and location tracking</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Office Location Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
            Office Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{officeLocation.name}</p>
            <p className="text-sm text-muted-foreground">{officeLocation.address}</p>
            <div className="flex items-center gap-4 text-sm">
              <span>Lat: {officeLocation.latitude}</span>
              <span>Lng: {officeLocation.longitude}</span>
              <span>Radius: {officeLocation.radius}m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inOffice}</p>
                <p className="text-xs text-muted-foreground">In Office</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.remote}</p>
                <p className="text-xs text-muted-foreground">Remote</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records - {selectedDate}</CardTitle>
          <CardDescription>
            Real-time attendance tracking with GPS location verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found for the selected criteria</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{record.employeeName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.employeeNumber} • {record.department}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'Not checked in'}
                          </span>
                          {record.checkOutTime && (
                            <>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-sm">
                                {new Date(record.checkOutTime).toLocaleTimeString()}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                          {record.checkInLocation && getLocationBadge(record.checkInLocation)}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEmployee(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {record.totalHours && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total Hours: {record.totalHours.toFixed(2)}h
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Employee Location Details</CardTitle>
              <CardDescription>{selectedEmployee.employeeName} - {selectedEmployee.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Check-in Location</h4>
                  {selectedEmployee.checkInLocation ? (
                    <div className="space-y-1 text-sm">
                      <p>Lat: {selectedEmployee.checkInLocation.latitude}</p>
                      <p>Lng: {selectedEmployee.checkInLocation.longitude}</p>
                      <p>Distance from office: {getLocationStatus(selectedEmployee.checkInLocation).distance}m</p>
                      {selectedEmployee.checkInLocation.address && (
                        <p className="text-muted-foreground">{selectedEmployee.checkInLocation.address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No check-in location recorded</p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Check-out Location</h4>
                  {selectedEmployee.checkOutLocation ? (
                    <div className="space-y-1 text-sm">
                      <p>Lat: {selectedEmployee.checkOutLocation.latitude}</p>
                      <p>Lng: {selectedEmployee.checkOutLocation.longitude}</p>
                      <p>Distance from office: {getLocationStatus(selectedEmployee.checkOutLocation).distance}m</p>
                      {selectedEmployee.checkOutLocation.address && (
                        <p className="text-muted-foreground">{selectedEmployee.checkOutLocation.address}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Not checked out yet</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  if (selectedEmployee.checkInLocation) {
                    const url = `https://www.google.com/maps?q=${selectedEmployee.checkInLocation.latitude},${selectedEmployee.checkInLocation.longitude}`;
                    window.open(url, '_blank');
                  }
                }}>
                  View on Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AttendanceMonitorPage;