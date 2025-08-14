import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../../common';
import { useAuth } from '../../../hooks/useAuth';
import { timeTrackingService } from '../../../services/timeTracking.service';
import { useToast } from '../../../hooks/useToast';
import './CheckInOut.css';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface CheckInOutStatus {
  isCheckedIn: boolean;
  lastCheckIn?: string;
  lastCheckOut?: string;
  todayTotalHours?: number;
}

const CheckInOut: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [status, setStatus] = useState<CheckInOutStatus>({ isCheckedIn: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadStatus();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    // ... (location logic is the same)
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const statusData = await timeTrackingService.getCheckInStatus();
      setStatus(statusData);
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Failed to load check-in status' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await timeTrackingService.checkIn({
        timestamp: new Date().toISOString(),
        location: location,
      });
      addToast({ type: 'success', message: 'Successfully checked in!' });
      await loadStatus();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Failed to check in' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await timeTrackingService.checkOut({
        timestamp: new Date().toISOString(),
        location: location,
      });
      addToast({ type: 'success', message: 'Successfully checked out!' });
      await loadStatus();
    } catch (error: any) {
      addToast({ type: 'error', message: error.message || 'Failed to check out' });
    } finally {
      setActionLoading(false);
    }
  };

  // ... (formatters are the same)

  if (loading) {
    return <div className="check-in-out-loading"><LoadingSpinner size="lg" /><p>Loading...</p></div>;
  }

  return (
    <div className="check-in-out">
      <Card className="check-in-out-card" padding="lg">
        {/* The rest of the JSX remains the same as it was already well-structured */}
        <div className="check-in-out-header">
          <div className="current-time">
             <div className="time-display">{currentTime.toLocaleTimeString()}</div>
             <div className="date-display">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
        <div className="check-in-out-status">
          <div className={`status-indicator ${status.isCheckedIn ? 'checked-in' : 'checked-out'}`}>
            <div className="status-text">{status.isCheckedIn ? 'Checked In' : 'Checked Out'}</div>
          </div>
        </div>
        <div className="check-in-out-actions">
          {status.isCheckedIn ? (
            <Button variant="error" size="lg" fullWidth onClick={handleCheckOut} loading={actionLoading}>Check Out</Button>
          ) : (
            <Button variant="success" size="lg" fullWidth onClick={handleCheckIn} loading={actionLoading} disabled={!location}>Check In</Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CheckInOut;
