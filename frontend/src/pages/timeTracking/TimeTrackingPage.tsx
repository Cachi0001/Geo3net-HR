import React, { useState } from 'react'
import { CheckInOut, AttendanceHistory } from '../../components/timeTracking'
import { Button } from '../../components/common'
import './TimeTrackingPage.css'

const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'history'>('checkin')

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
          Check In/Out
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
        ) : (
          <AttendanceHistory />
        )}
      </div>
    </div>
  )
}

export default TimeTrackingPage