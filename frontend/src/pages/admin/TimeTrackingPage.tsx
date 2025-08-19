import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Calendar, 
  Users, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Play,
  Pause,
  Square,
  User,
  Building2,
  Timer,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
  CalendarDays,
  BarChart3
} from 'lucide-react';

interface TimeEntry {
  id: string;
  employee: {
    name: string;
    avatar: string;
    department: string;
    employeeId: string;
  };
  date: string;
  clockIn: string;
  clockOut?: string;
  breakTime: number; // in minutes
  totalHours: number;
  status: 'present' | 'late' | 'absent' | 'half_day' | 'working';
  project?: string;
  task?: string;
  notes?: string;
  location: 'office' | 'remote' | 'field';
}

interface WeeklyStats {
  employeeId: string;
  employeeName: string;
  department: string;
  totalHours: number;
  expectedHours: number;
  daysPresent: number;
  daysLate: number;
  daysAbsent: number;
  productivity: number;
}

// Mock data - replace with real API calls
const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    employee: {
      name: 'John Doe',
      avatar: 'JD',
      department: 'Engineering',
      employeeId: 'EMP001'
    },
    date: '2024-02-01',
    clockIn: '09:00',
    clockOut: '17:30',
    breakTime: 60,
    totalHours: 7.5,
    status: 'present',
    project: 'Authentication System',
    task: 'JWT Implementation',
    notes: 'Completed user login functionality',
    location: 'office'
  },
  {
    id: '2',
    employee: {
      name: 'Jane Smith',
      avatar: 'JS',
      department: 'Design',
      employeeId: 'EMP002'
    },
    date: '2024-02-01',
    clockIn: '09:15',
    clockOut: '17:45',
    breakTime: 45,
    totalHours: 7.75,
    status: 'late',
    project: 'Landing Page Redesign',
    task: 'UI Mockups',
    notes: 'Created high-fidelity mockups',
    location: 'remote'
  },
  {
    id: '3',
    employee: {
      name: 'Mike Johnson',
      avatar: 'MJ',
      department: 'Marketing',
      employeeId: 'EMP003'
    },
    date: '2024-02-01',
    clockIn: '08:45',
    clockOut: '16:45',
    breakTime: 60,
    totalHours: 7,
    status: 'present',
    project: 'Q1 Campaign',
    task: 'Content Strategy',
    location: 'office'
  },
  {
    id: '4',
    employee: {
      name: 'Sarah Wilson',
      avatar: 'SW',
      department: 'Human Resources',
      employeeId: 'EMP004'
    },
    date: '2024-02-01',
    clockIn: '09:00',
    clockOut: '13:00',
    breakTime: 30,
    totalHours: 3.5,
    status: 'half_day',
    project: 'Employee Onboarding',
    task: 'Process Review',
    notes: 'Medical appointment in afternoon',
    location: 'office'
  },
  {
    id: '5',
    employee: {
      name: 'David Brown',
      avatar: 'DB',
      department: 'Sales',
      employeeId: 'EMP005'
    },
    date: '2024-02-01',
    clockIn: '10:30',
    status: 'working',
    breakTime: 0,
    totalHours: 0,
    project: 'Client Meetings',
    task: 'Prospect Calls',
    location: 'field'
  },
  {
    id: '6',
    employee: {
      name: 'Alex Chen',
      avatar: 'AC',
      department: 'Engineering',
      employeeId: 'EMP006'
    },
    date: '2024-02-01',
    clockIn: '',
    clockOut: '',
    breakTime: 0,
    totalHours: 0,
    status: 'absent',
    notes: 'Sick leave',
    location: 'office'
  }
];

const mockWeeklyStats: WeeklyStats[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    totalHours: 37.5,
    expectedHours: 40,
    daysPresent: 5,
    daysLate: 0,
    daysAbsent: 0,
    productivity: 94
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    department: 'Design',
    totalHours: 38.75,
    expectedHours: 40,
    daysPresent: 4,
    daysLate: 1,
    daysAbsent: 0,
    productivity: 97
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Mike Johnson',
    department: 'Marketing',
    totalHours: 35,
    expectedHours: 40,
    daysPresent: 5,
    daysLate: 0,
    daysAbsent: 0,
    productivity: 88
  }
];

const TimeTrackingPage: React.FC = () => {
  const [timeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [weeklyStats] = useState<WeeklyStats[]>(mockWeeklyStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.task?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || entry.employee.department === departmentFilter;
    const matchesDate = entry.date === selectedDate;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-gradient-secondary text-white';
      case 'late': return 'nav-accent-orange text-white';
      case 'absent': return 'bg-red-500 text-white';
      case 'half_day': return 'nav-accent-cyan text-white';
      case 'working': return 'bg-gradient-primary text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'half_day': return <Clock className="h-4 w-4" />;
      case 'working': return <Play className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getLocationBadge = (location: string) => {
    switch (location) {
      case 'office': return 'bg-blue-100 text-blue-800';
      case 'remote': return 'bg-green-100 text-green-800';
      case 'field': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const todayStats = {
    totalEmployees: timeEntries.length,
    present: timeEntries.filter(e => e.status === 'present').length,
    late: timeEntries.filter(e => e.status === 'late').length,
    absent: timeEntries.filter(e => e.status === 'absent').length,
    working: timeEntries.filter(e => e.status === 'working').length,
    avgHours: timeEntries.filter(e => e.totalHours > 0).reduce((sum, e) => sum + e.totalHours, 0) / timeEntries.filter(e => e.totalHours > 0).length || 0
  };

  const departments = [...new Set(timeEntries.map(entry => entry.employee.department))];

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    return timeString;
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor employee attendance and working hours</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="btn-primary">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.totalEmployees}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 nav-accent-orange rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <XCircle className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-2">
                <Play className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.working}</p>
              <p className="text-xs text-muted-foreground">Working</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="h-10 w-10 nav-accent-cyan rounded-lg flex items-center justify-center mx-auto mb-2">
                <Timer className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todayStats.avgHours.toFixed(1)}h</p>
              <p className="text-xs text-muted-foreground">Avg Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, ID, project, or task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="working">Working</option>
              </select>
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEntries.map((entry) => (
          <Card key={entry.id} className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {entry.employee.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{entry.employee.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {entry.employee.employeeId} • {entry.employee.department}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(entry.status)} text-xs px-2 py-1`}>
                    {getStatusIcon(entry.status)}
                    <span className="ml-1 capitalize">{entry.status.replace('_', ' ')}</span>
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Time Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">{formatTime(entry.clockIn)}</p>
                  <p className="text-xs text-blue-600">Clock In</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{formatTime(entry.clockOut || '--:--')}</p>
                  <p className="text-xs text-green-600">Clock Out</p>
                </div>
              </div>

              {/* Hours and Break */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">{formatHours(entry.totalHours)}</p>
                  <p className="text-xs text-purple-600">Total Hours</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                  <p className="text-lg font-bold text-orange-600">{entry.breakTime}m</p>
                  <p className="text-xs text-orange-600">Break Time</p>
                </div>
              </div>

              {/* Project and Task */}
              {(entry.project || entry.task) && (
                <div className="space-y-2">
                  {entry.project && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{entry.project}</p>
                    </div>
                  )}
                  {entry.task && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Task</p>
                      <p className="text-sm">{entry.task}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {entry.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <Badge className={`${getLocationBadge(entry.location)} text-xs px-2 py-1`}>
                  <Building2 className="h-3 w-3 mr-1" />
                  {entry.location}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Stats */}
      {weeklyStats.length > 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Weekly Performance Summary
            </CardTitle>
            <CardDescription>Employee productivity and attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyStats.map((stat) => (
                <div key={stat.employeeId} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {stat.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium">{stat.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{stat.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{stat.totalHours}h</p>
                      <p className="text-xs text-muted-foreground">Total Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{stat.daysPresent}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{stat.daysLate}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{stat.daysAbsent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{stat.productivity}%</p>
                      <p className="text-xs text-muted-foreground">Productivity</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEntries.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No time entries found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or date selection.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeTrackingPage;