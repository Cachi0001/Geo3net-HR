import React, { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner } from '../../common'

import { useToast } from '../../../hooks/useToast'
import './SystemInitialization.css'

interface SystemStatus {
  needsInitialization: boolean
  totalUsers: number
  roleDistribution: Record<string, number>
  systemReady: boolean
}

const SystemInitialization: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/system/status')
      if (!response.ok) {
        throw new Error('Failed to fetch system status')
      }
      const status = await response.json()
      setSystemStatus(status)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to check system status')
    } finally {
      setLoading(false)
    }
  }

  const initializeSystem = async () => {
    try {
      setInitializing(true)
      const response = await fetch('/api/system/initialize', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to initialize system')
      }
      
      const result = await response.json()
      
      if (result.superAdminCreated && result.credentials) {
        setCredentials(result.credentials)
        showToast('success', 'System initialized successfully! Please save the super admin credentials.')
        await checkSystemStatus() // Refresh status
      } else {
        showToast('info', 'System was already initialized')
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to initialize system')
    } finally {
      setInitializing(false)
    }
  }

  const copyCredentials = () => {
    if (credentials) {
      const text = `Super Admin Credentials:\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
      navigator.clipboard.writeText(text)
      showToast('success', 'Credentials copied to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="system-init-loading">
        <LoadingSpinner size="lg" />
        <p>Checking system status...</p>
      </div>
    )
  }

  if (!systemStatus?.needsInitialization) {
    return (
      <div className="system-init-ready">
        <Card className="system-status-card" padding="lg">
          <div className="system-status-content">
            <div className="system-status-icon success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <h1>System Ready</h1>
            <p>The HR Management System is properly initialized and ready for use.</p>
            
            <div className="system-stats">
              <div className="stat-item">
                <span className="stat-value">{systemStatus?.totalUsers || 0}</span>
                <span className="stat-label">Total Users</span>
              </div>
              
              {Object.entries(systemStatus?.roleDistribution || {}).map(([role, count]) => (
                <div key={role} className="stat-item">
                  <span className="stat-value">{count}</span>
                  <span className="stat-label">{role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              ))}
            </div>
            
            <Button variant="primary" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="system-initialization">
      <Card className="system-init-card" padding="lg">
        <div className="system-init-content">
          <div className="system-init-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h1>System Initialization Required</h1>
          <p>
            Welcome to Go3net HR Management System! This appears to be a fresh installation 
            that needs to be initialized with a super administrator account.
          </p>
          
          <div className="init-steps">
            <div className="init-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Super Admin</h3>
                <p>Initialize the system with a super administrator account</p>
              </div>
            </div>
            
            <div className="init-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Save Credentials</h3>
                <p>Securely store the generated admin credentials</p>
              </div>
            </div>
            
            <div className="init-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Start Using System</h3>
                <p>Log in and begin setting up your HR system</p>
              </div>
            </div>
          </div>
          
          <div className="init-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={initializeSystem}
              loading={initializing}
              disabled={initializing}
              fullWidth
            >
              Initialize System
            </Button>
          </div>
        </div>
      </Card>

      {credentials && (
        <Card className="credentials-card" padding="lg">
          <div className="credentials-content">
            <div className="credentials-header">
              <div className="credentials-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Super Admin Credentials</h2>
            </div>
            
            <div className="credentials-warning">
              <p>
                <strong>Important:</strong> Please save these credentials securely. 
                You will need them to log in as the super administrator.
              </p>
            </div>
            
            <div className="credentials-details">
              <div className="credential-item">
                <label>Email:</label>
                <code>{credentials.email}</code>
              </div>
              <div className="credential-item">
                <label>Password:</label>
                <code>{credentials.password}</code>
              </div>
            </div>
            
            <div className="credentials-actions">
              <Button variant="outline" onClick={copyCredentials}>
                Copy Credentials
              </Button>
              <Button variant="primary" onClick={() => window.location.href = '/login'}>
                Go to Login
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SystemInitialization