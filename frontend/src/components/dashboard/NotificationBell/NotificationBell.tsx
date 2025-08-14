import React, { useState } from 'react'
import { Button } from '../../common'
import './NotificationBell.css'

interface NotificationBellProps {
  className?: string
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount] = useState(0)

  return (
    <div className={`notification-bell ${className || ''}`}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <div className="bell-icon">🔔</div>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
          </div>
          
          <div className="notification-list">
            <div className="no-notifications">
              <div className="no-notifications-icon">🔔</div>
              <p>No notifications</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell