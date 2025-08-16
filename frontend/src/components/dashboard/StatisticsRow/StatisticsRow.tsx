import React from 'react'
import { StatsGrid } from '../../ui/StatsCard/StatsCard'
import { EmployeeStatistics } from '../../../services/employee.service'
import { DashboardStats } from '../../../types/design-system'
import { Users, Building, UserPlus, Clock } from 'lucide-react'
import './StatisticsRow.css'

interface StatisticsRowProps {
  stats: EmployeeStatistics | null
  isLoading?: boolean
}

const StatisticsRow: React.FC<StatisticsRowProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="stats-row">
        <div className="stats-row__skeleton glass" />
        <div className="stats-row__skeleton glass" />
        <div className="stats-row__skeleton glass" />
      </div>
    )
  }

  const dashboardStats: DashboardStats[] = [
    {
      title: 'Total Employees',
      value: (stats?.totalEmployees ?? 0).toString(),
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Departments',
      value: (stats?.totalDepartments ?? 0).toString(),
      icon: Building,
      color: 'green'
    },
    {
      title: 'New This Month',
      value: (stats?.newThisMonth ?? 0).toString(),
      icon: UserPlus,
      color: 'purple',
      change: stats?.newThisMonth ? {
        type: 'positive',
        value: 12,
        period: 'last month'
      } : undefined
    },
    {
      title: 'Avg Tenure',
      value: `${stats?.averageTenure ?? 0} yrs`,
      icon: Clock,
      color: 'orange'
    }
  ]

  return (
    <div className="stats-row">
      <StatsGrid stats={dashboardStats} />
    </div>
  )
}

export default StatisticsRow
