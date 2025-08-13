import React, { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner, Select } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './AttendanceHistory.css'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  totalHours: number
  status: 'present' | 'absent' | 'partial' | 'late'
  location?: {
    checkIn?: { latitude: number; longitude: number }
    checkOut?: { latitude: number; longitude: number }
  }
}

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  partialDays: number
  totalHours: number
  averageHours: number
}

const AttendanceHistory: React.FC = () => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    loadAttendanceData()
  }, [selectedPeriod])

  const loadAttendanceData = async () => {
    try {
      setLoading(true)
      const [recordsResponse, summaryResponse] = await Promise.all([
        apiCall(`/api/time-tracking/attendance?period=${selectedPeriod}`, 'GET'),
        apiCall(`/api/time-tracking/attendance/summary?period=${selectedPeriod}`, 'GET')
      ])
      
      setRecords(recordsResponse.data || [])
      setSummary(summaryResponse.data)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--'
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (hours: number) => {
    if (hours === 0) return '0h'
    
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

  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const statusConfig = {
      present: { label: 'Present', className: 'status-present' },
      absent: { label: 'Absent', className: 'status-absent' },
      partial: { label: 'Partial', className: 'status-partial' },
      late: { label: 'Late', className: 'status-late' }
    }

    const config = statusConfig[status]
    return (
      <span className={`status-badge ${config.className}`}>
        {config.label}
      </span>
    )
  }

  const periodOptions = [
    { value: 'current-week', label: 'This Week' },
    { value: 'current-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'current-year', label: 'This Year' }
  ]

  if (loading) {
    return (
      <div className="attendance-loading">
        <LoadingSpinner size="lg" />
        <p>Loading attendance history...</p>
      </div>
    )
  }

  return (
    <div className="attendance-history">
      {/* Header */}
      <div className="attendance-header">
        <div className="attendance-title">
          <h2>Attendance History</h2>
          <p>Track your work hours and attendance patterns</p>
        </div>

        <div className="attendance-controls">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={periodOptions}
            className="period-select"
          />

          <div className="view-toggle">
            <Button
              variant={selectedView === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('list')}
            >
              List
            </Button>
            <Button
              variant={selectedView === 'calendar' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('calendar')}
            >
              Calendar
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="attendance-summary">
          <Card className="summary-card" padding="md">
            <div className="summary-item">
              <div className="summary-value">{summary.presentDays}</div>
              <div className="summary-label">Present Days</div>
            </div>
          </Card>

          <Card className="summary-card" padding="md">
            <div className="summary-item">
              <div className="summary-value">{summary.absentDays}</div>
              <div className="summary-label">Absent Days</div>
            </div>
          </Card>

          <Card className="summary-card" padding="md">
            <div className="summary-item">
              <div className="summary-value">{formatDuration(summary.totalHours)}</div>
              <div className="summary-label">Total Hours</div>
            </div>
          </Card>

          <Card className="summary-card" padding="md">
            <div className="summary-item">
              <div className="summary-value">{formatDuration(summary.averageHours)}</div>
              <div className="summary-label">Avg Daily Hours</div>
            </div>
          </Card>
        </div>
      )}

      {/* Attendance Records */}
      {selectedView === 'list' ? (
        <Card className="attendance-list-card" padding="lg">
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No attendance records found</h3>
              <p>No attendance data available for the selected period.</p>
            </div>
          ) : (
            <div className="attendance-list">
              <div className="list-header">
                <div className="header-date">Date</div>
                <div className="header-checkin">Check In</div>
                <div className="header-checkout">Check Out</div>
                <div className="header-hours">Hours</div>
                <div className="header-status">Status</div>
              </div>

              <div className="list-body">
                {records.map((record) => (
                  <div key={record.id} className="attendance-row">
                    <div className="row-date">
                      <div className="date-primary">{formatDate(record.date)}</div>
                      <div className="date-secondary">
                        {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric' })}
                      </div>
                    </div>

                    <div className="row-checkin">
                      <div className="time-value">{formatTime(record.checkIn)}</div>
                      {record.location?.checkIn && (
                        <div className="location-indicator" title="Location recorded">📍</div>
                      )}
                    </div>

                    <div className="row-checkout">
                      <div className="time-value">{formatTime(record.checkOut)}</div>
                      {record.location?.checkOut && (
                        <div className="location-indicator" title="Location recorded">📍</div>
                      )}
                    </div>

                    <div className="row-hours">
                      <div className="hours-value">{formatDuration(record.totalHours)}</div>
                    </div>

                    <div className="row-status">
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="attendance-calendar-card" padding="lg">
          <div className="calendar-placeholder">
            <div className="calendar-icon">📅</div>
            <h3>Calendar View</h3>
            <p>Calendar view will be implemented in the next phase</p>
            <Button 
              variant="outline" 
              onClick={() => setSelectedView('list')}
            >
              Switch to List View
            </Button>
          </div>
        </Card>
      )}

      {/* Export Options */}
      {records.length > 0 && (
        <div className="attendance-actions">
          <Button variant="outline" size="sm">
            Export to CSV
          </Button>
          <Button variant="outline" size="sm">
            Generate Report
          </Button>
        </div>
      )}
    </div>
  )
}

export default AttendanceHistory