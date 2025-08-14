import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Input } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskCollaboration.css'

interface TaskActivity {
    id: string
    taskId: string
    userId: string
    userName: string
    userAvatar?: string
    type: 'comment' | 'status_change' | 'assignment' | 'priority_change' | 'due_date_change'
    content: string
    metadata?: Record<string, any>
    createdAt: string
}

interface OnlineUser {
    id: string
    name: string
    avatar?: string
    lastSeen: string
    isTyping?: boolean
}

interface TaskCollaborationProps {
    task: Task
    onTaskUpdate?: (task: Task) => void
}

const TaskCollaboration: React.FC<TaskCollaborationProps> = ({
    task,
    onTaskUpdate
}) => {
    const { user } = useAuth()
    const { apiCall } = useApiCall()
    const { showToast } = useToast()

    const [activities, setActivities] = useState<TaskActivity[]>([])
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
    const [newComment, setNewComment] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submittingComment, setSubmittingComment] = useState(false)

    const activitiesEndRef = useRef<HTMLDivElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        loadActivities()
        // In a real implementation, you would set up WebSocket connection here
        // setupWebSocketConnection()

        return () => {
            // Cleanup WebSocket connection
            // cleanupWebSocketConnection()
        }
    }, [task.id])

    useEffect(() => {
        scrollToBottom()
    }, [activities])

    const loadActivities = async () => {
        try {
            setLoading(true)
            const response = await apiCall(`/api/tasks/${task.id}/activities`, 'GET')
            setActivities(response.data || [])
        } catch (error: any) {
            showToast('error', error.message || 'Failed to load task activities')
        } finally {
            setLoading(false)
        }
    }

    const scrollToBottom = () => {
        activitiesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim()) return

        try {
            setSubmittingComment(true)
            const response = await apiCall(`/api/tasks/${task.id}/comments`, 'POST', {
                content: newComment.trim()
            })

            // Add the new activity to the list
            const newActivity: TaskActivity = {
                id: response.data.id,
                taskId: task.id,
                userId: user?.id || '',
                userName: user?.fullName || 'Unknown',
                userAvatar: undefined, // Avatar not available in current User type
                type: 'comment',
                content: newComment.trim(),
                createdAt: new Date().toISOString()
            }

            setActivities(prev => [...prev, newActivity])
            setNewComment('')
            showToast('success', 'Comment added successfully')
        } catch (error: any) {
            showToast('error', error.message || 'Failed to add comment')
        } finally {
            setSubmittingComment(false)
        }
    }

    const handleTyping = (value: string) => {
        setNewComment(value)

        if (!isTyping) {
            setIsTyping(true)
            // In real implementation, emit typing event via WebSocket
            // socket.emit('user_typing', { taskId: task.id, userId: user?.id })
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            // In real implementation, emit stop typing event via WebSocket
            // socket.emit('user_stop_typing', { taskId: task.id, userId: user?.id })
        }, 1000)
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

    const getActivityIcon = (type: TaskActivity['type']) => {
        switch (type) {
            case 'comment': return '💬'
            case 'status_change': return '🔄'
            case 'assignment': return '👤'
            case 'priority_change': return '⚡'
            case 'due_date_change': return '📅'
            default: return '📌'
        }
    }

    const getActivityColor = (type: TaskActivity['type']) => {
        switch (type) {
            case 'comment': return 'var(--color-go3net-blue)'
            case 'status_change': return 'var(--color-go3net-green)'
            case 'assignment': return 'var(--color-warning-500)'
            case 'priority_change': return 'var(--color-error-500)'
            case 'due_date_change': return 'var(--color-info-500)'
            default: return 'var(--color-secondary-500)'
        }
    }

    return (
        <Card className="task-collaboration" padding="lg">
            <div className="collaboration-header">
                <div className="collaboration-title">
                    <h3>Activity & Collaboration</h3>
                    {onlineUsers.length > 0 && (
                        <div className="online-users">
                            {onlineUsers.slice(0, 3).map(user => (
                                <div key={user.id} className="online-user" title={user.name}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} />
                                    ) : (
                                        <div className="user-initial">{user.name.charAt(0)}</div>
                                    )}
                                </div>
                            ))}
                            {onlineUsers.length > 3 && (
                                <div className="more-users">+{onlineUsers.length - 3}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="activities-container">
                {loading ? (
                    <div className="activities-loading">
                        <div className="loading-spinner" />
                        <p>Loading activities...</p>
                    </div>
                ) : activities.length === 0 ? (
                    <div className="no-activities">
                        <div className="no-activities-icon">💭</div>
                        <p>No activity yet. Be the first to add a comment!</p>
                    </div>
                ) : (
                    <div className="activities-list">
                        {activities.map(activity => (
                            <div key={activity.id} className={`activity-item ${activity.type}`}>
                                <div className="activity-avatar">
                                    {activity.userAvatar ? (
                                        <img src={activity.userAvatar} alt={activity.userName} />
                                    ) : (
                                        <div className="avatar-initial">{activity.userName.charAt(0)}</div>
                                    )}
                                </div>

                                <div className="activity-content">
                                    <div className="activity-header">
                                        <span className="activity-user">{activity.userName}</span>
                                        <span className="activity-time">{formatTimeAgo(activity.createdAt)}</span>
                                    </div>

                                    <div className="activity-body">
                                        <div
                                            className="activity-icon"
                                            style={{ color: getActivityColor(activity.type) }}
                                        >
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="activity-text">{activity.content}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={activitiesEndRef} />
                    </div>
                )}

                {/* Typing indicators */}
                {onlineUsers.some(u => u.isTyping) && (
                    <div className="typing-indicators">
                        {onlineUsers
                            .filter(u => u.isTyping)
                            .map(u => (
                                <div key={u.id} className="typing-indicator">
                                    <span>{u.name} is typing</span>
                                    <div className="typing-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Comment form */}
            <form onSubmit={handleCommentSubmit} className="comment-form">
                <div className="comment-input-container">
                    <Input
                        type="text"
                        value={newComment}
                        onChange={(e) => handleTyping(e.target.value)}
                        placeholder="Add a comment..."
                        disabled={submittingComment}
                        className="comment-input"
                    />
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={!newComment.trim() || submittingComment}
                        loading={submittingComment}
                        className="comment-submit"
                    >
                        Send
                    </Button>
                </div>
            </form>
        </Card>
    )
}

export default TaskCollaboration