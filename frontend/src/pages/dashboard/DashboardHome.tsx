import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

const DashboardHome = () => {
  // TODO: Replace with actual data from API
  const stats = {
    totalEmployees: 156,
    presentToday: 142,
    onLeave: 8,
    pendingTasks: 23,
    completedTasks: 87,
    pendingLeaveRequests: 5
  }

  const recentActivities = [
    {
      id: 1,
      type: 'check-in',
      user: 'Sarah Johnson',
      action: 'checked in',
      time: '9:15 AM',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'leave-request',
      user: 'Mike Chen',
      action: 'requested leave',
      time: '8:45 AM',
      icon: Calendar,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'task-completed',
      user: 'Emily Davis',
      action: 'completed task',
      time: '8:30 AM',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      id: 4,
      type: 'late-arrival',
      user: 'John Smith',
      action: 'arrived late',
      time: '8:20 AM',
      icon: AlertCircle,
      color: 'text-orange-600'
    }
  ]

  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Register a new employee',
      href: '/dashboard/employees/new',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Create Task',
      description: 'Assign a new task',
      href: '/dashboard/tasks/new',
      icon: Plus,
      color: 'bg-green-500'
    },
    {
      title: 'View Reports',
      description: 'Generate analytics',
      href: '/dashboard/reports',
      icon: TrendingUp,
      color: 'bg-purple-500'
    },
    {
      title: 'Time Tracking',
      description: 'Monitor attendance',
      href: '/dashboard/time-tracking',
      icon: Clock,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2 text-lg">Here's what's happening at your company today.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Plus className="mr-2 h-5 w-5" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Overview Grid - Mobile First: 2x2, Tablet: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}% attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingLeaveRequests} pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activities */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest updates from your team
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentActivities.map((activity) => {
                const Icon = activity.icon
                return (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.time}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Link 
                to="/dashboard/activities" 
                className="text-sm text-primary hover:underline flex items-center"
              >
                View all activities
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="p-4 border rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 group flex items-center space-x-4"
                  >
                    <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{action.title}</h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>
            Upcoming meetings and events
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Team Standup</p>
                  <p className="text-sm text-gray-500">Daily sync with development team</p>
                </div>
              </div>
              <span className="text-sm font-medium text-blue-600">10:00 AM</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">HR Review Meeting</p>
                  <p className="text-sm text-gray-500">Monthly performance reviews</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">2:00 PM</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Client Presentation</p>
                  <p className="text-sm text-gray-500">Q4 project deliverables</p>
                </div>
              </div>
              <span className="text-sm font-medium text-orange-600">4:30 PM</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardHome