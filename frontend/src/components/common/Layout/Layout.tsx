import React from 'react'
import { useAuth } from '../../../hooks/useAuth'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <h1 className="layout-title">Go3net HR</h1>
          <div className="layout-user-menu">
            <span className="layout-user-name">{user?.fullName}</span>
            <button 
              onClick={handleLogout}
              className="layout-logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <nav className="layout-nav">
        <div className="layout-nav-content">
          <a href="/dashboard" className="layout-nav-link">Dashboard</a>
          <a href="/employees" className="layout-nav-link">Employees</a>
          <a href="/tasks" className="layout-nav-link">Tasks</a>
          <a href="/time-tracking" className="layout-nav-link">Time Tracking</a>
          <a href="/profile" className="layout-nav-link">Profile</a>
        </div>
      </nav>
      
      <main className="layout-main">
        {children}
      </main>
    </div>
  )
}

export default Layout