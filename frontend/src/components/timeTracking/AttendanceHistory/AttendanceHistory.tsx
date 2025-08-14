import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, LoadingSpinner, Select } from '../../common';
import { timeTrackingService, AttendanceRecord, AttendanceSummary } from '../../../services/timeTracking.service';
import { useToast } from '../../../hooks/useToast';
import './AttendanceHistory.css';

const AttendanceHistory: React.FC = () => {
  const { addToast } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedView, setSelectedView] = useState<'list' | 'calendar'>('list');

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsData, summaryData] = await Promise.all([
        timeTrackingService.getAttendanceHistory(selectedPeriod),
        timeTrackingService.getAttendanceSummary(selectedPeriod)
      ]);
      setRecords(recordsData);
      setSummary(summaryData);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Failed to load attendance data' });
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, addToast]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // ... (formatter functions and getStatusBadge are the same)

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  const formatDuration = (hours: number) => {
    if (hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };
  const getStatusBadge = (status: AttendanceRecord['status']) => {
    const statusConfig = {
      present: { label: 'Present', className: 'status-present' },
      absent: { label: 'Absent', className: 'status-absent' },
      partial: { label: 'Partial', className: 'status-partial' },
      late: { label: 'Late', className: 'status-late' }
    };
    const config = statusConfig[status];
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const periodOptions = [
    { value: 'current-week', label: 'This Week' },
    { value: 'current-month', label: 'This Month' },
    { value: 'last-month', label: 'Last Month' }
  ];

  if (loading) {
    return (
      <div className="attendance-loading">
        <LoadingSpinner size="lg" /><p>Loading attendance history...</p>
      </div>
    );
  }

  return (
    <div className="attendance-history">
      <div className="attendance-header">
        <div className="attendance-title"><h2>Attendance History</h2></div>
        <div className="attendance-controls">
          <Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} options={periodOptions} />
        </div>
      </div>

      {summary && (
        <div className="attendance-summary">
          <Card className="summary-card" padding="md"><div className="summary-item"><div className="summary-value">{summary.presentDays}</div><div className="summary-label">Present</div></div></Card>
          <Card className="summary-card" padding="md"><div className="summary-item"><div className="summary-value">{summary.absentDays}</div><div className="summary-label">Absent</div></div></Card>
          <Card className="summary-card" padding="md"><div className="summary-item"><div className="summary-value">{formatDuration(summary.totalHours)}</div><div className="summary-label">Total Hours</div></div></Card>
          <Card className="summary-card" padding="md"><div className="summary-item"><div className="summary-value">{formatDuration(summary.averageHours)}</div><div className="summary-label">Avg. Daily</div></div></Card>
        </div>
      )}

      <Card className="attendance-list-card" padding="lg">
        {records.length === 0 ? (
          <div className="empty-state"><h3>No records found</h3></div>
        ) : (
          <div className="attendance-list">
            <div className="list-header">
              <div className="header-date">Date</div><div className="header-checkin">Check In</div><div className="header-checkout">Check Out</div><div className="header-hours">Hours</div><div className="header-status">Status</div>
            </div>
            <div className="list-body">
              {records.map((record) => (
                <div key={record.id} className="attendance-row">
                  <div className="row-date">{formatDate(record.date)}</div>
                  <div className="row-checkin">{formatTime(record.checkIn)}</div>
                  <div className="row-checkout">{formatTime(record.checkOut)}</div>
                  <div className="row-hours">{formatDuration(record.totalHours)}</div>
                  <div className="row-status">{getStatusBadge(record.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceHistory;
