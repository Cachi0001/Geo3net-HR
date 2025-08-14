import React from 'react'
import './DashboardLayout.css'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  return (
    <div className={`dashboard-layout ${className || ''}`}>
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout