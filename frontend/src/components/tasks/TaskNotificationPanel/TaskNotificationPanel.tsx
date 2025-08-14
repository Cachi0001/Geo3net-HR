import React from 'react'
import { Card, Button } from '../../common'
import { useTaskNotifications } from '../../../hooks/useTaskNotifications'
import './TaskNotificationPanel.css'

interface TaskNotificationPanelProps {
  className?: string
}

const TaskNotificationPanel: React.FC<TaskNotificationPanelProps> = ({ className }) => {
  const {
    isEnabled,
    hasPermission,
    isSubscribed,
    enableNotifications,
    disableNotifications,
    testNotification,
    recentNotifications,
    unreadCount,
    markAsRead,
    clearAll
  } = useTaskNotifications()

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffTime / (1000 * 60))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assignment': return '📋'
      case 'task_status_change': return '🔄'
      case 'task_comment': return '💬'
      case 'task_due_reminder': return '⏰'
      case 'bulk_task_assignment': return '📚'
      default: return '📌'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--color-error-500)'
      case 'medium': return 'var(--color-warning-500)'
      case 'low': return 'var(--color-go3net-green)'
      default: return 'var(--color-go3net-blue)'
    }
  }

  return (
    <Card className={`task-notification-panel ${className || ''}`} padding="lg">
      <div className="notification-panel-header">
        <div className="panel-title">
          <h3>Task Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="panel-actions">
          {!hasPermission && (
            <div className="permission-warning">
              <span className="warning-icon">⚠️</span>
              <span>Permission required</span>
            </div>
          )}
          
          {hasPermission && !isSubscribed && (
            <div className="subscription-warning">
              <span className="warning-icon">🔔</span>
              <span>Not subscribed</span>
            </div>
          )}
          
          {hasPermission && isSubscribed && (
            <div className="status-indicator">
              <div className={`status-dot ${isEnabled ? 'enabled' : 'disabled'}`} />
              <span>{isEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="notification-controls">
        {!isEnabled ? (
          <Button
            variant="primary"
            size="sm"
            onClick={enableNotifications}
            disabled={!hasPermission}
            className="enable-btn"
          >
            {!hasPermission ? 'Grant Permission First' : 'Enable Notifications'}
          </Button>
        ) : (
          <div className="control-buttons">
            <Button
              variant="ghost"
              size="sm"
              onClick={disableNotifications}
              className="disable-btn"
            >
              Disable
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testNotification}
              className="test-btn"
            >
              Test
            </Button>
          </div>
        )}
      </div>

      {isEnabled && (
        <div className="notifications-list">
          {recentNotifications.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">🔔</div>
              <p>No recent notifications</p>
              <span>You'll see task updates here</span>
            </div>
          ) : (
            <>
              <div className="notifications-header">
                <span className="notifications-count">
                  {recentNotifications.length} recent notifications
                </span>
                {recentNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="clear-all-btn"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="notifications-items">
                {recentNotifications.map((notification, index) => (
                  <div
                    key={`${notification.taskId}-${index}`}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => {
                      if (notification.url) {
                        window.location.href = notification.url
                      }
                      markAsRead(notification.taskId)
                    }}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTimeAgo(notification.timestamp)}</div>
                    </div>
                    
                    <div 
                      className="priority-indicator"
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export default TaskNotificationPanel