import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, LoadingSpinner } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useMobileLocation } from '../../../hooks/useMobileLocation'
import { useOfflineSync } from '../../../hooks/useOfflineSync'
import './MobileCheckInOut.css'

interface CheckInOutStatus {
  isCheckedIn: boolean
  lastCheckIn?: string
  lastCheckOut?: string
  currentSessionHours?: number
  todayTotalHours?: number
}



const MobileCheckInOut: React.FC = () => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  const { 
    location, 
    locationError, 
    isLoading: locationLoading, 
    requestLocation,
    watchLocation,
    clearWatch 
  } = useMobileLocation()
  const { 
    isOnline, 
    queueAction, 
    syncPendingActions,
    pendingActions 
  } = useOfflineSync()

  const [status, setStatus] = useState<CheckInOutStatus>({
    isCheckedIn: false
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wakeLock, setWakeLock] = useState<any>(null)
  const [batteryInfo, setBatteryInfo] = useState<any>(null)
  const [networkInfo, setNetworkInfo] = useState<any>(null)

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

  // Start location watching when component mounts
  useEffect(() => {
    if ('geolocation' in navigator) {
      watchLocation()
    }

    return () => {
      clearWatch()
    }
  }, [watchLocation, clearWatch])

  // Sync pending actions when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions()
        .then(() => {
          showToast('success', 'Synced offline actions')
          loadStatus()
        })
        .catch(() => {
          showToast('error', 'Failed to sync some actions')
        })
    }
  }, [isOnline, pendingActions.length, syncPendingActions, showToast])

  const loadStatus = async () => {
    try {
      setLoading(true)
      if (isOnline) {
        const response = await apiCall('/api/time-tracking/status', 'GET')
        setStatus(response.data)
      } else {
        // Load from local storage when offline
        const cachedStatus = localStorage.getItem('checkInStatus')
        if (cachedStatus) {
          setStatus(JSON.parse(cachedStatus))
        }
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load check-in status')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!location && !locationError) {
      showToast('warning', 'Getting your location...')
      requestLocation()
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

      if (isOnline) {
        await apiCall('/api/time-tracking/check-in', 'POST', checkInData)
        showToast('success', 'Successfully checked in!')
        await loadStatus()
      } else {
        // Queue action for offline sync
        queueAction('check-in', checkInData)
        
        // Update local status
        const newStatus = {
          ...status,
          isCheckedIn: true,
          lastCheckIn: checkInData.timestamp
        }
        setStatus(newStatus)
        localStorage.setItem('checkInStatus', JSON.stringify(newStatus))
        
        showToast('info', 'Checked in offline - will sync when online')
      }
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

      if (isOnline) {
        await apiCall('/api/time-tracking/check-out', 'POST', checkOutData)
        showToast('success', 'Successfully checked out!')
        await loadStatus()
      } else {
        // Queue action for offline sync
        queueAction('check-out', checkOutData)
        
        // Update local status
        const newStatus = {
          ...status,
          isCheckedIn: false,
          lastCheckOut: checkOutData.timestamp
        }
        setStatus(newStatus)
        localStorage.setItem('checkInStatus', JSON.stringify(newStatus))
        
        showToast('info', 'Checked out offline - will sync when online')
      }
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
      month: 'short',
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

  // Mobile-specific functions
  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        const wakeLockSentinel = await (navigator as any).wakeLock.request('screen')
        setWakeLock(wakeLockSentinel)
        showToast('info', 'Screen will stay awake')
      }
    } catch (error) {
      console.error('Wake lock error:', error)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release()
      setWakeLock(null)
      showToast('info', 'Screen wake lock released')
    }
  }

  // Get battery and network info
  useEffect(() => {
    const getBatteryInfo = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery()
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging
          })
        }
      } catch (error) {
        console.error('Battery API error:', error)
      }
    }

    const getNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        })
      }
    }

    getBatteryInfo()
    getNetworkInfo()
  }, [])

  if (loading) {
    return (
      <div className="mobile-checkin-loading">
        <LoadingSpinner size="lg" />
        <p>Loading check-in status...</p>
      </div>
    )
  }

  return (
    <div className={`mobile-checkin ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Connection Status */}
      <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        <div className="status-indicator">
          {isOnline ? '🟢' : '🔴'}
        </div>
        <span>{isOnline ? 'Online' : 'Offline'}</span>
        {pendingActions.length > 0 && (
          <span className="pending-count">({pendingActions.length} pending)</span>
        )}
      </div>

      <Card className="mobile-checkin-card" padding="lg">
        {/* Header */}
        <div className="mobile-header">
          <div className="user-greeting">
            <h2>Hello, {user?.fullName?.split(' ')[0]}</h2>
            <p className="current-date">{formatDate(currentTime)}</p>
          </div>
          
          <button 
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>

        {/* Large Time Display */}
        <div className="time-display-large">
          {formatTime(currentTime)}
        </div>

        {/* Status Display */}
        <div className="mobile-status">
          <div className={`status-circle ${status.isCheckedIn ? 'checked-in' : 'checked-out'}`}>
            <div className="status-icon">
              {status.isCheckedIn ? '✓' : '○'}
            </div>
          </div>
          
          <div className="status-text">
            <h3>{status.isCheckedIn ? 'Checked In' : 'Ready to Check In'}</h3>
            {status.isCheckedIn && status.lastCheckIn && (
              <p>Since {formatTime(new Date(status.lastCheckIn))}</p>
            )}
          </div>
        </div>

        {/* Session Info */}
        {status.isCheckedIn && (
          <div className="session-info-mobile">
            <div className="session-stat">
              <span className="stat-label">Current Session</span>
              <span className="stat-value">{formatDuration(getCurrentSessionDuration())}</span>
            </div>
            {status.todayTotalHours !== undefined && (
              <div className="session-stat">
                <span className="stat-label">Today's Total</span>
                <span className="stat-value">{formatDuration(status.todayTotalHours)}</span>
              </div>
            )}
          </div>
        )}

        {/* Location Status */}
        <div className="location-status-mobile">
          {locationLoading ? (
            <div className="location-loading">
              <LoadingSpinner size="sm" />
              <span>Getting location...</span>
            </div>
          ) : locationError ? (
            <div className="location-error">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <strong>Location Required</strong>
                <p>{locationError}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={requestLocation}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : location ? (
            <div className="location-success">
              <span className="success-icon">📍</span>
              <span>Location confirmed (±{Math.round(location.accuracy)}m)</span>
            </div>
          ) : null}
        </div>

        {/* Action Button */}
        <div className="mobile-action">
          {status.isCheckedIn ? (
            <Button
              variant="error"
              size="lg"
              fullWidth
              onClick={handleCheckOut}
              loading={actionLoading}
              disabled={actionLoading}
              className="checkout-btn-mobile"
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
              disabled={actionLoading || (locationLoading && !locationError)}
              className="checkin-btn-mobile"
            >
              {actionLoading ? 'Checking In...' : 'Check In'}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-mobile">
          <Button variant="ghost" size="sm" onClick={loadStatus}>
            Refresh
          </Button>
          {!isOnline && pendingActions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={syncPendingActions}>
              Sync ({pendingActions.length})
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={wakeLock ? releaseWakeLock : requestWakeLock}
          >
            {wakeLock ? 'Release Wake' : 'Keep Awake'}
          </Button>
        </div>

        {/* Device Info */}
        <div className="device-info-mobile">
          {batteryInfo && (
            <div className="battery-info">
              <span className={`battery-icon ${batteryInfo.charging ? 'charging' : ''}`}>
                🔋
              </span>
              <span>{batteryInfo.level}%</span>
            </div>
          )}
          
          {networkInfo && (
            <div className="network-info">
              <span className="network-type">{networkInfo.effectiveType?.toUpperCase()}</span>
              {networkInfo.downlink && (
                <span className="network-speed">{networkInfo.downlink}Mbps</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default MobileCheckInOut