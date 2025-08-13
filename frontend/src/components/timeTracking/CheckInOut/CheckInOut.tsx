import React, { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './CheckInOut.css'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface CheckInOutStatus {
  isCheckedIn: boolean
  lastCheckIn?: string
  lastCheckOut?: string
  currentSessionHours?: number
  todayTotalHours?: number
}

const CheckInOut: React.FC = () => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [status, setStatus] = useState<CheckInOutStatus>({
    isCheckedIn: false
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load initial status
  useEffect(() => {
    loadStatus()
  }, [])

  // Get user location
  useEffect(() => {
    getCurrentLocation()
  }, [])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        })
        setLocationError(null)
      },
      (error) => {
        let errorMessage = 'Unable to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        setLocationError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/time-tracking/status', 'GET')
      setStatus(response.data)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load check-in status')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!location && !locationError) {
      showToast('warning', 'Getting your location...')
      getCurrentLocation()
      return
    }

    setActionLoading(true)
    try {
      const checkInData = {
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        } : null
      }

      await apiCall('/api/time-tracking/check-in', 'POST', checkInData)
      showToast('success', 'Successfully checked in!')
      await loadStatus()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to check in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      const checkOutData = {
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        } : null
      }

      await apiCall('/api/time-tracking/check-out', 'POST', checkOutData)
      showToast('success', 'Successfully checked out!')
      await loadStatus()
    } catch (error: any) {
      showToast('error', error.message || 'Failed to check out')
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    
    if (wholeHours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${wholeHours}h`
    } else {
      return `${wholeHours}h ${minutes}m`
    }
  }

  const getCurrentSessionDuration = () => {
    if (!status.isCheckedIn || !status.lastCheckIn) return 0
    
    const checkInTime = new Date(status.lastCheckIn)
    const now = new Date()
    const diffMs = now.getTime() - checkInTime.getTime()
    return diffMs / (1000 * 60 * 60) // Convert to hours
  }

  if (loading) {
    return (
      <div className="check-in-out-loading">
        <LoadingSpinner size="lg" />
        <p>Loading check-in status...</p>
      </div>
    )
  }

  return (
    <div className="check-in-out">
      <Card className="check-in-out-card" padding="lg">
        {/* Header */}
        <div className="check-in-out-header">
          <div className="current-time">
            <div className="time-display">{formatTime(currentTime)}</div>
            <div className="date-display">{formatDate(currentTime)}</div>
          </div>
          
          <div className="user-info">
            <div className="user-name">Hello, {user?.fullName}</div>
            <div className="user-role">{user?.role?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
          </div>
        </div>

        {/* Status Display */}
        <div className="check-in-out-status">
          <div className={`status-indicator ${status.isCheckedIn ? 'checked-in' : 'checked-out'}`}>
            <div className="status-icon">
              {status.isCheckedIn ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="status-text">
              {status.isCheckedIn ? 'Checked In' : 'Checked Out'}
            </div>
          </div>

          {status.isCheckedIn && status.lastCheckIn && (
            <div className="session-info">
              <div className="session-duration">
                <span className="label">Current Session:</span>
                <span className="value">{formatDuration(getCurrentSessionDuration())}</span>
              </div>
              <div className="check-in-time">
                <span className="label">Checked in at:</span>
                <span className="value">{formatTime(new Date(status.lastCheckIn))}</span>
              </div>
            </div>
          )}

          {status.todayTotalHours !== undefined && (
            <div className="daily-summary">
              <div className="daily-hours">
                <span className="label">Today's Total:</span>
                <span className="value">{formatDuration(status.todayTotalHours)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Location Status */}
        {locationError ? (
          <div className="location-error">
            <div className="error-icon">⚠️</div>
            <div className="error-message">
              <strong>Location Required:</strong> {locationError}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={getCurrentLocation}
                className="retry-location-btn"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : location ? (
          <div className="location-success">
            <div className="success-icon">📍</div>
            <div className="location-info">
              Location confirmed (±{Math.round(location.accuracy)}m accuracy)
            </div>
          </div>
        ) : (
          <div className="location-loading">
            <LoadingSpinner size="sm" />
            <span>Getting your location...</span>
          </div>
        )}

        {/* Action Button */}
        <div className="check-in-out-actions">
          {status.isCheckedIn ? (
            <Button
              variant="error"
              size="lg"
              fullWidth
              onClick={handleCheckOut}
              loading={actionLoading}
              disabled={actionLoading}
              className="check-out-btn"
            >
              {actionLoading ? 'Checking Out...' : 'Check Out'}
            </Button>
          ) : (
            <Button
              variant="success"
              size="lg"
              fullWidth
              onClick={handleCheckIn}
              loading={actionLoading}
              disabled={actionLoading || (!location && !locationError)}
              className="check-in-btn"
            >
              {actionLoading ? 'Checking In...' : 'Check In'}
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        {(status.lastCheckIn || status.lastCheckOut) && (
          <div className="quick-stats">
            <div className="stats-grid">
              {status.lastCheckIn && (
                <div className="stat-item">
                  <div className="stat-label">Last Check-in</div>
                  <div className="stat-value">
                    {new Date(status.lastCheckIn).toLocaleDateString() === new Date().toLocaleDateString() 
                      ? formatTime(new Date(status.lastCheckIn))
                      : new Date(status.lastCheckIn).toLocaleDateString()
                    }
                  </div>
                </div>
              )}
              
              {status.lastCheckOut && (
                <div className="stat-item">
                  <div className="stat-label">Last Check-out</div>
                  <div className="stat-value">
                    {new Date(status.lastCheckOut).toLocaleDateString() === new Date().toLocaleDateString() 
                      ? formatTime(new Date(status.lastCheckOut))
                      : new Date(status.lastCheckOut).toLocaleDateString()
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default CheckInOut