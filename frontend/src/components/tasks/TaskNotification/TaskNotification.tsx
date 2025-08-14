import React, { useState, useEffect } from 'react'
import { Card, Button } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskNotification.css'

interface TaskNotification {
  id: string
  type: 'assignment' | 'status_change' | 'comment' | 'due_soon' | 'overdue'
  taskId: string
  taskTitle: string
  message: string
  fromUser?: string
  fromUserName?: string
  createdAt: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

interface TaskNotificationProps {
  notifications: TaskNotification[]
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onNotificationClick?: (notification: TaskNotification) => void
  onClearAll?: () => void
  maxVisible?: number
}

const TaskNotificationComponent: React.FC<TaskNotificationProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onClearAll,
  maxVisible = 5
}) => {
  const { user } = useAuth()
  const [visibleNotifications, setVisibleNotifications] = useState<TaskNotification[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const sortedNotifications = [...notifications].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    if (showAll) {
      setVisibleNotifications(sortedNotifications)
    } else {
      setVisibleNotifications(sortedNotifications.slice(0, maxVisible))
    }
  }, [notifications, showAll, maxVisible])

  const getNotificationIcon = (type: TaskNotification['type']) => {
    switch (type) {
      case 'assignment': return '📋'
      case 'status_change': return '🔄'
      case 'comment': return '💬'
      case 'due_soon': return '⏰'
      case 'overdue': return '🚨'
      default: return '📌'
    }
  }

  const getNotificationColor = (type: TaskNotification['type'], priority: TaskNotification['priority']) => {
    if (type === 'overdue' || priority === 'high') return 'var(--color-error-500)'
    if (type === 'due_soon' || priority === 'medium') return 'var(--color-warning-500)'
    return 'var(--color-go3net-blue)'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
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

  const handleNotificationClick = (notification: TaskNotification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (notifications.length === 0) {
    return (
      <Card className="task-notifications empty" padding="lg">
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No Notifications</h3>
          <p>You're all caught up! New task notifications will appear here.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="task-notifications" padding="lg">
      <div className="notifications-header">
        <div className="notifications-title">
          <h3>Task Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="clear-all-btn"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="notifications-list">
        {visibleNotifications.map(notification => (
          <div
            key={notification.id}
            className={`notification-item ${!notification.read ? 'unread' : ''} priority-${notification.priority}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-icon">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="notification-content">
              <div className="notification-header">
                <h4 className="notification-task-title">{notification.taskTitle}</h4>
                <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
              </div>
              
              <p className="notification-message">{notification.message}</p>
              
              {notification.fromUserName && (
                <div className="notification-from">
                  From: {notification.fromUserName}
                </div>
              )}
            </div>

            <div 
              className="notification-indicator"
              style={{ backgroundColor: getNotificationColor(notification.type, notification.priority) }}
            />
          </div>
        ))}
      </div>

      {notifications.length > maxVisible && (
        <div className="notifications-footer">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="show-more-btn"
          >
            {showAll ? 'Show less' : `Show ${notifications.length - maxVisible} more`}
          </Button>
        </div>
      )}
    </Card>
  )
}

export default TaskNotificationComponent