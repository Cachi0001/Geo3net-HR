import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import {
  Activity,
  Clock,
  User,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreVertical,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  UserPlus,
  UserMinus,
  Settings,
  FileText,
  Shield
} from 'lucide-react';

interface ActivityLog {
  id: string;
  type: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'system' | 'security';
  action: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

// No fallback data - will show empty state if API fails

const ActivitiesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const { toast } = useToast();

  // Load activities
  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/activities');
      if (response.success && response.data) {
        setActivities(response.data.activities || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.warn('API not available:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadActivities();
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || activity.type === typeFilter;
    
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    const timeDiff = now.getTime() - activityTime.getTime();
    
    let matchesTime = true;
    if (timeFilter === 'hour') {
      matchesTime = timeDiff <= 60 * 60 * 1000; // Last hour
    } else if (timeFilter === 'day') {
      matchesTime = timeDiff <= 24 * 60 * 60 * 1000; // Last 24 hours
    } else if (timeFilter === 'week') {
      matchesTime = timeDiff <= 7 * 24 * 60 * 60 * 1000; // Last week
    }
    
    return matchesSearch && matchesType && matchesTime;
  });

  const getActivityIcon = (type: string) => {
    const iconMap = {
      login: UserPlus,
      logout: UserMinus,
      create: CheckCircle,
      update: Settings,
      delete: AlertCircle,
      view: Eye,
      system: Settings,
      security: Shield
    };
    
    const Icon = iconMap[type as keyof typeof iconMap] || Activity;
    return Icon;
  };

  const getActivityColor = (type: string) => {
    const colorMap = {
      login: 'text-green-600 bg-green-100',
      logout: 'text-orange-600 bg-orange-100',
      create: 'text-blue-600 bg-blue-100',
      update: 'text-purple-600 bg-purple-100',
      delete: 'text-red-600 bg-red-100',
      view: 'text-gray-600 bg-gray-100',
      system: 'text-indigo-600 bg-indigo-100',
      security: 'text-yellow-600 bg-yellow-100'
    };
    
    return colorMap[type as keyof typeof colorMap] || 'text-gray-600 bg-gray-100';
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      login: { color: 'bg-green-100 text-green-800', label: 'Login' },
      logout: { color: 'bg-orange-100 text-orange-800', label: 'Logout' },
      create: { color: 'bg-blue-100 text-blue-800', label: 'Create' },
      update: { color: 'bg-purple-100 text-purple-800', label: 'Update' },
      delete: { color: 'bg-red-100 text-red-800', label: 'Delete' },
      view: { color: 'bg-gray-100 text-gray-800', label: 'View' },
      system: { color: 'bg-indigo-100 text-indigo-800', label: 'System' },
      security: { color: 'bg-yellow-100 text-yellow-800', label: 'Security' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.view;
    
    return (
      <Badge className={`${config.color} border-0 text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Calculate activity statistics
  const totalActivities = activities.length;
  const todayActivities = activities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.timestamp);
    return activityDate.toDateString() === today.toDateString();
  }).length;
  
  const uniqueUsers = new Set(activities.map(activity => activity.userId)).size;
  const systemActivities = activities.filter(activity => activity.type === 'system').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-1">Monitor system activities and user actions</p>
        </div>
        <Button onClick={loadActivities} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold text-foreground">{totalActivities}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Activities</p>
                <p className="text-2xl font-bold text-foreground">{todayActivities}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Events</p>
                <p className="text-2xl font-bold text-foreground">{systemActivities}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Activity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="view">View</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="hour">Last Hour</SelectItem>
                <SelectItem value="day">Last 24 Hours</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          
          return (
            <Card key={activity.id} className="bg-gradient-card shadow-lg border-0">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{activity.action}</h3>
                      {getTypeBadge(activity.type)}
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{activity.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                          <AvatarFallback className="text-xs">
                            {activity.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span>{activity.userName}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeAgo(activity.timestamp)}</span>
                      </div>
                      
                      {activity.ipAddress && (
                        <span>IP: {activity.ipAddress}</span>
                      )}
                      
                      {activity.resource && (
                        <Badge variant="outline" className="text-xs">
                          {activity.resource}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No activities found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivitiesPage;