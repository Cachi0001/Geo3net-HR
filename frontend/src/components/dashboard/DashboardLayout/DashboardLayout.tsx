import React from 'react';
import { useAuth } from '../../../hooks/useAuth';
import NotificationBell from '../NotificationBell/NotificationBell';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  const { user, logout } = useAuth();

  return (
    <div className={`dashboard-layout ${className || ''}`}>
      <header className="dashboard-header">
        <div className="dashboard-header__brand">
          <h1 className="dashboard-header__title">Go3net-HR</h1>
        </div>
        <div className="dashboard-header__user-menu">
          <NotificationBell />
          <div className="user-info">
            <span className="user-info__name">{user?.fullName}</span>
            <span className="user-info__role">{user?.role}</span>
          </div>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
