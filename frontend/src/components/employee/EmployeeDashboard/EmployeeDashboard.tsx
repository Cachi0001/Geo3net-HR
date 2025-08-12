import React, { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './EmployeeDashboard.css'

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  hoursWorkedThisWeek: number
  hoursWorkedThisMonth: number
  attendanceRate: number
}

interface RecentActivity {
  id: string
  type: 'task' | 'checkin' | 'checkout' | 'profile'
  title: string
  description: string
  timestamp: string
  status?: string
}

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const [statsResponse, activityResponse] = await Promise.all([
        apiCall('/api/employees/dashboard/stats', 'GET'),
        apiCall('/api/employees/dashboard/recent-activity', 'GET')
      ])
      
      setStats(statsResponse.data)
      setRecentActivity(activityResponse.data)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const formatHours = (hours: number) => {
    return `${hours.toFixed(1)}h`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        )
      case 'checkin':
      case 'checkout':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'profile':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        )
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="employee-dashboard-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="employee-dashboard">
      <div className="employee-dashboard-header">
        <div className="employee-dashboard-greeting">
          <h1>{getGreeting()}, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
          <p>Here's what's happening with your work today.</p>
        </div>
        
        <div className="employee-dashboard-actions">
          <Button variant="primary" size="md">
            Quick Check-in
          </Button>
        </div>
      </div>

      {stats && (
        <div className="employee-dashboard-stats">
          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon tasks">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className="dashboard-stat-info">
                <h3>{stats.completedTasks}/{stats.totalTasks}</h3>
                <p>Tasks Completed</p>
              </div>
            </div>
          </Card>

          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon pending">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="dashboard-stat-info">
                <h3>{stats.pendingTasks}</h3>
                <p>Pending Tasks</p>
              </div>
            </div>
          </Card>

          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon hours">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="dashboard-stat-info">
                <h3>{formatHours(stats.hoursWorkedThisWeek)}</h3>
                <p>Hours This Week</p>
              </div>
            </div>
          </Card>

          <Card className="dashboard-stat-card">
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-icon attendance">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="dashboard-stat-info">
                <h3>{stats.attendanceRate}%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="employee-dashboard-content">
        <div className="employee-dashboard-main">
          <Card className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="dashboard-quick-actions">
              <Button variant="outline" size="md" fullWidth>
                View My Tasks
              </Button>
              <Button variant="outline" size="md" fullWidth>
                Time Tracking
              </Button>
              <Button variant="outline" size="md" fullWidth>
                Request Time Off
              </Button>
              <Button variant="outline" size="md" fullWidth>
                Update Profile
              </Button>
            </div>
          </Card>

          {stats && stats.overdueTasks > 0 && (
            <Card className="dashboard-section alert">
              <div className="dashboard-alert">
                <div className="dashboard-alert-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="dashboard-alert-content">
                  <h3>Overdue Tasks</h3>
                  <p>You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} that need attention.</p>
                </div>
                <Button variant="primary" size="sm">
                  View Tasks
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="employee-dashboard-sidebar">
          <Card className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="dashboard-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="dashboard-activity-item">
                    <div className="dashboard-activity-icon">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="dashboard-activity-content">
                      <h4>{activity.title}</h4>
                      <p>{activity.description}</p>
                      <span className="dashboard-activity-time">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-activity-empty">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard