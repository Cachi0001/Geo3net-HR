import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../../hooks/useNotifications';
import { Button } from '../../common';
import './NotificationBell.css';

const NotificationBell: React.FC = () => {
  const { notifications, stats, loadNotifications, loadStats } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load initial data when the component mounts
    loadNotifications(10); // Load latest 10 notifications
    loadStats();
  }, [loadNotifications, loadStats]);

  const unreadCount = stats?.total || 0;

  return (
    <div className="notification-bell">
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <div className="bell-icon">🔔</div>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <header className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && <Button variant="ghost" size="sm">Mark all as read</Button>}
          </header>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className={`notification-item ${notification.status === 'sent' ? 'unread' : ''}`}>
                  <p className="notification-message">{notification.body}</p>
                  <span className="notification-timestamp">{new Date(notification.createdAt).toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>You're all caught up!</p>
              </div>
            )}
          </div>

          <footer className="dropdown-footer">
            <Link to="/notifications" className="view-all-link">
              View All Notifications
            </Link>
          </footer>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
