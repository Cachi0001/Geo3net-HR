import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Plus, Filter, Download, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ScheduleItem {
  id: string;
  employeeName: string;
  employeeId: string;
  date: string;
  shift: string;
  status: 'scheduled' | 'confirmed' | 'absent' | 'late';
  hours: number;
  department: string;
}

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager' || user?.role === 'hr-admin' || user?.role === 'super-admin';
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock schedule data
  const scheduleData: ScheduleItem[] = [
    { id: '1', employeeName: 'John Doe', employeeId: 'EMP001', date: '2024-03-22', shift: '09:00 - 17:00', status: 'confirmed', hours: 8, department: 'Engineering' },
    { id: '2', employeeName: 'Jane Smith', employeeId: 'EMP002', date: '2024-03-22', shift: '10:00 - 18:00', status: 'confirmed', hours: 8, department: 'Design' },
    { id: '3', employeeName: 'Mike Johnson', employeeId: 'EMP003', date: '2024-03-22', shift: '09:00 - 17:00', status: 'late', hours: 7.5, department: 'Engineering' },
    { id: '4', employeeName: 'Sarah Wilson', employeeId: 'EMP004', date: '2024-03-22', shift: '08:00 - 16:00', status: 'confirmed', hours: 8, department: 'QA' },
    { id: '5', employeeName: 'Alex Chen', employeeId: 'EMP005', date: '2024-03-22', shift: '11:00 - 19:00', status: 'absent', hours: 0, department: 'DevOps' },
  ];

  const scheduleSummary = {
    totalScheduled: scheduleData.length,
    confirmed: scheduleData.filter(item => item.status === 'confirmed').length,
    late: scheduleData.filter(item => item.status === 'late').length,
    absent: scheduleData.filter(item => item.status === 'absent').length,
    totalHours: scheduleData.reduce((sum, item) => sum + item.hours, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <UserCheck className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'absent': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
          Schedule Management
        </h1>
        <p className="text-muted-foreground">
          {isManager ? 'Manage team schedules and workforce planning' : 'View your schedule and shifts'}
        </p>
      </div>

      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Scheduled</p>
                <p className="text-2xl font-bold text-foreground">{scheduleSummary.totalScheduled}</p>
              </div>
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{scheduleSummary.confirmed}</p>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{scheduleSummary.late}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{scheduleSummary.absent}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground">{scheduleSummary.totalHours}h</p>
              </div>
              <Clock className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {isManager && (
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          )}
        </div>
      </div>

      {/* Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>
            Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scheduleData.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium">{item.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{item.employeeId} • {item.department}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{item.shift}</p>
                    <p className="text-sm text-muted-foreground">{item.hours}h scheduled</p>
                  </div>
                  
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('-', ' ')}
                  </Badge>

                  {isManager && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Overview
          </CardTitle>
          <CardDescription>Schedule overview for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center font-medium text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="border rounded-lg p-3 min-h-[120px] hover:bg-muted/50 transition-colors">
                <div className="text-sm font-medium mb-2">{18 + i}</div>
                <div className="space-y-1">
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {Math.floor(Math.random() * 8) + 5} staff
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(Math.random() * 60) + 40}h total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchedulePage;