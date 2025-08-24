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
  // Data will be loaded from API
  const stats = {
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingTasks: 0,
    completedTasks: 0,
    pendingLeaveRequests: 0
  }

  const recentActivities: any[] = []

  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Register a new employee',
      href: '/dashboard/employees/add',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Create Task',
      description: 'Assign a new task',
      href: '/dashboard/task-assignment',
      icon: Plus,
      color: 'bg-green-500'
    },
    {
      title: 'View Reports',
      description: 'Generate analytics',
      href: '/dashboard/analytics',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border border-blue-100">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">Here's what's happening at your company today.</p>
        </div>
        <div className="mt-3 sm:mt-0">
          <Button size="sm" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <Plus className="mr-2 h-4 w-4" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Overview Grid - Mobile First: 2x2, Tablet: 2x2, Desktop: 4x1 */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
            <CardTitle className="mobile-text-xs font-medium">Total Employees</CardTitle>
            <Users className="mobile-icon text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
            <CardTitle className="mobile-text-xs font-medium">Present Today</CardTitle>
            <CheckCircle className="mobile-icon text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)}% attendance
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
            <CardTitle className="mobile-text-xs font-medium">On Leave</CardTitle>
            <Calendar className="mobile-icon text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingLeaveRequests} pending requests
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
            <CardTitle className="mobile-text-xs font-medium">Active Tasks</CardTitle>
            <TrendingUp className="mobile-icon text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="mobile-text-base">Recent Activities</CardTitle>
            <CardDescription className="mobile-text-sm">
              Latest updates from your team
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-6">
            <div className="space-y-4 sm:space-y-6">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <Icon className={`mobile-icon ${activity.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="mobile-text-sm font-medium text-gray-900">
                          {activity.user}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {activity.action}
                        </p>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        {activity.time}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent activities</p>
                </div>
              )}
            </div>
            <div className="mt-4">
              <Link 
                to="/dashboard/activities" 
                className="text-xs sm:text-sm text-primary hover:underline flex items-center"
              >
                View all activities
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="mobile-text-base">Quick Actions</CardTitle>
            <CardDescription className="mobile-text-sm">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-2 sm:pt-6">
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="quick-action-card flex items-center space-x-3 min-h-[60px] mobile-content"
                  >
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm group-hover:text-primary transition-colors duration-200 overflow-hidden text-ellipsis whitespace-nowrap">{action.title}</h3>
                      <p className="text-xs text-gray-500 group-hover:text-foreground/80 transition-colors duration-200 overflow-hidden text-ellipsis line-clamp-1 hidden sm:block">{action.description}</p>
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
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No scheduled events for today</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardHome