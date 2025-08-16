import React, { useState, useEffect } from 'react'
import { StatsGrid } from '../../ui/StatsCard/StatsCard'
import { DashboardStats } from '../../../types/design-system'
import { dashboardService } from '../../../services/dashboard.service'
import { useAuth } from '../../../hooks/useAuth'
import styles from './ModernDashboard.module.css'

interface ModernDashboardProps {
  userRole: string
}

export const ModernDashboard: React.FC<ModernDashboardProps> = ({ userRole }) => {
  const [stats, setStats] = useState<DashboardStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const dashboardStats = await dashboardService.getDashboardStats(userRole)
        setStats(dashboardStats)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [userRole])

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'super-admin': 'Super Administrator',
      'hr-admin': 'HR Administrator',
      'manager': 'Manager',
      'hr-staff': 'HR Staff',
      'employee': 'Employee'
    }
    return roleMap[role] || 'Employee'
  }

  const getRoleDescription = (role: string) => {
    const descriptions: { [key: string]: string } = {
      'super-admin': 'Monitor system health, manage users, and oversee all operations.',
      'hr-admin': 'Manage employees, handle recruitment, and oversee HR operations.',
      'manager': 'Lead your team, assign tasks, and track performance.',
      'hr-staff': 'Support HR operations, assist with onboarding, and manage employee records.',
      'employee': 'Track your tasks, manage your time, and stay productive.'
    }
    return descriptions[role] || 'Welcome to your dashboard.'
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Unable to load dashboard</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h2 className={styles.roleTitle}>
            {getRoleDisplayName(userRole)} Dashboard
          </h2>
          <p className={styles.roleDescription}>
            {getRoleDescription(userRole)}
          </p>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </div>
          <div>
            <div className={styles.userName}>{user?.fullName}</div>
            <div className={styles.userRole}>{getRoleDisplayName(userRole)}</div>
          </div>
        </div>
      </div>

      <StatsGrid stats={stats} />

      {/* Role-specific content sections */}
      {userRole === 'super-admin' && (
        <div className={styles.roleSpecificContent}>
          <div className={styles.contentCard}>
            <h3>System Overview</h3>
            <p>Monitor system health, user activity, and security alerts from this central hub.</p>
          </div>
        </div>
      )}

      {userRole === 'hr-admin' && (
        <div className={styles.roleSpecificContent}>
          <div className={styles.contentCard}>
            <h3>HR Management Hub</h3>
            <p>Manage your workforce, track recruitment progress, and oversee HR operations.</p>
          </div>
        </div>
      )}

      {userRole === 'manager' && (
        <div className={styles.roleSpecificContent}>
          <div className={styles.contentCard}>
            <h3>Team Management</h3>
            <p>Lead your team effectively with task assignments, performance tracking, and team insights.</p>
          </div>
        </div>
      )}

      {userRole === 'employee' && (
        <div className={styles.roleSpecificContent}>
          <div className={styles.contentCard}>
            <h3>Your Workspace</h3>
            <p>Stay organized with your tasks, track your time, and manage your work efficiently.</p>
          </div>
        </div>
      )}
    </div>
  )
}