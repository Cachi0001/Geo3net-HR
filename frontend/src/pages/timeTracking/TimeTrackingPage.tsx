import React, { useState, useEffect } from 'react'
import { CheckInOut, AttendanceHistory } from '../../components/timeTracking'
import MobileCheckInOut from '../../components/timeTracking/MobileCheckInOut/MobileCheckInOut'
import { Button } from '../../components/common'
import './TimeTrackingPage.css'

const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'history' | 'mobile'>('checkin')
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
      
      // Auto-switch to mobile tab on mobile devices
      if (isMobileDevice && activeTab === 'checkin') {
        setActiveTab('mobile')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [activeTab])

  return (
    <div className="time-tracking-page">
      <div className="page-header">
        <h1>Time Tracking</h1>
        <p>Manage your work hours and attendance</p>
      </div>

      <div className="tab-navigation">
        <Button
          variant={activeTab === 'checkin' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('checkin')}
          className="tab-button"
        >
          Desktop Check-In
        </Button>
        <Button
          variant={activeTab === 'mobile' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('mobile')}
          className="tab-button"
        >
          📱 Mobile Check-In
        </Button>
        <Button
          variant={activeTab === 'history' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('history')}
          className="tab-button"
        >
          Attendance History
        </Button>
      </div>

      <div className="tab-content">
        {activeTab === 'checkin' ? (
          <CheckInOut />
        ) : activeTab === 'mobile' ? (
          <MobileCheckInOut />
        ) : (
          <AttendanceHistory />
        )}
      </div>

      {/* Mobile hint */}
      {isMobile && activeTab !== 'mobile' && (
        <div className="mobile-hint">
          <p>💡 For the best mobile experience, try the Mobile Check-In tab!</p>
        </div>
      )}
    </div>
  )
}

export default TimeTrackingPage