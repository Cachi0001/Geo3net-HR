import React, { useState, useEffect } from 'react';
import { CheckInOut, AttendanceHistory } from '../../components/timeTracking';
import MobileCheckInOut from '../../components/timeTracking/MobileCheckInOut/MobileCheckInOut';
import LeaveManagement from '../../components/timeTracking/LeaveManagement/LeaveManagement';
import { Button } from '../../components/common';
import './TimeTrackingPage.css';

const TimeTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'history' | 'leave' | 'mobile'>('checkin');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);

      if (isMobileDevice && activeTab === 'checkin') {
        setActiveTab('mobile');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'checkin':
        return <CheckInOut />;
      case 'mobile':
        return <MobileCheckInOut />;
      case 'history':
        return <AttendanceHistory />;
      case 'leave':
        return <LeaveManagement />;
      default:
        return <CheckInOut />;
    }
  };

  return (
    <div className="time-tracking-page">
      <div className="page-header">
        <h1>Time & Attendance</h1>
        <p>Manage your work hours, attendance, and leave requests</p>
      </div>

      <div className="tab-navigation">
        <Button variant={activeTab === 'checkin' ? 'primary' : 'ghost'} onClick={() => setActiveTab('checkin')} className="tab-button">
          Desktop Check-In
        </Button>
        <Button variant={activeTab === 'mobile' ? 'primary' : 'ghost'} onClick={() => setActiveTab('mobile')} className="tab-button">
          📱 Mobile Check-In
        </Button>
        <Button variant={activeTab === 'history' ? 'primary' : 'ghost'} onClick={() => setActiveTab('history')} className="tab-button">
          Attendance History
        </Button>
        <Button variant={activeTab === 'leave' ? 'primary' : 'ghost'} onClick={() => setActiveTab('leave')} className="tab-button">
          Leave Management
        </Button>
      </div>

      <div className="tab-content">
        {renderContent()}
      </div>

      {isMobile && activeTab !== 'mobile' && (
        <div className="mobile-hint">
          <p>💡 For the best mobile experience, try the Mobile Check-In tab!</p>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingPage;
