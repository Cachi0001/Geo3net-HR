import React, { useState, useEffect } from 'react'
import { Card, Button, LoadingSpinner, Input } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskDetail.css'

interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  comment: string
  createdAt: string
}

interface TaskDetailProps {
  task: Task
  onUpdate?: (task: Task) => void
  onEdit?: () => void
  onClose?: () => void
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  task,
  onUpdate,
  onEdit,
  onClose
}) => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    loadComments()
  }, [task.id])

  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await apiCall(`/api/tasks/${task.id}/comments`, 'GET')
      setComments(response.data || [])
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await apiCall(`/api/tasks/${task.id}/comments`, 'POST', {
        comment: newComment.trim()
      })

      setComments(prev => [...prev, response.data])
      setNewComment('')
      showToast('success', 'Comment added successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStatusChange = async (newStatus: Task['status']) => {
    try {
      setUpdatingStatus(true)
      const response = await apiCall(`/api/tasks/${task.id}/status`, 'PATCH', {
        status: newStatus,
        completionNotes: newStatus === 'completed' ? 'Task completed' : null
      })

      onUpdate?.(response.data)
      showToast('success', `Task marked as ${newStatus.replace('_', ' ')}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update task status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const formatDate = (dateString: string) => {
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

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'var(--color-error-500)'
      case 'high': return 'var(--color-warning-500)'
      case 'medium': return 'var(--color-go3net-blue)'
      case 'low': return 'var(--color-secondary-500)'
      default: return 'var(--color-secondary-500)'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'var(--color-secondary-500)'
      case 'in_progress': return 'var(--color-go3net-blue)'
      case 'completed': return 'var(--color-go3net-green)'
      case 'cancelled': return 'var(--color-error-500)'
      default: return 'var(--color-secondary-500)'
    }
  }

  const canEdit = user?.id === task.assignedBy || user?.id === task.assignedTo
  const canChangeStatus = user?.id === task.assignedTo
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <div className="task-detail">
      {/* Header */}
      <div className="task-detail-header">
        <div className="task-detail-title">
          <h2>{task.title}</h2>
          <div className="task-detail-badges">
            <span
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            >
              {task.priority.toUpperCase()}
            </span>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(task.status) }}
            >
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="task-detail-actions">
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      {/* Task Info */}
      <Card className="task-info" padding="lg">
        <div className="task-description">
          <h3>Description</h3>
          <p>{task.description}</p>
        </div>

        <div className="task-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Assigned to:</span>
            <span className="meta-value">{task.assignedTo || 'Unknown'}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Assigned by:</span>
            <span className="meta-value">{task.assignedBy || 'Unknown'}</span>
          </div>

          {task.dueDate && (
            <div className="meta-item">
              <span className="meta-label">Due date:</span>
              <span className={`meta-value ${isOverdue ? 'overdue-text' : ''}`}>
                {new Date(task.dueDate).toLocaleDateString()}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}

          <div className="meta-item">
            <span className="meta-label">Created:</span>
            <span className="meta-value">{formatDate(task.createdAt)}</span>
          </div>

          {task.status === 'completed' && (
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span className="meta-value">Completed</span>
            </div>
          )}
        </div>

        {/* Status Actions */}
        {canChangeStatus && task.status !== 'completed' && task.status !== 'cancelled' && (
          <div className="status-actions">
            <h4>Update Status</h4>
            <div className="status-buttons">
              {task.status === 'todo' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updatingStatus}
                >
                  Start Task
                </Button>
              )}

              {task.status === 'in_progress' && (
                <>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleStatusChange('completed')}
                    disabled={updatingStatus}
                  >
                    Mark Complete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange('todo')}
                    disabled={updatingStatus}
                  >
                    Move to To Do
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Comments Section */}
      <Card className="task-comments" padding="lg">
        <h3>Comments ({comments.length})</h3>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="add-comment-form">
          <Input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            disabled={submittingComment}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!newComment.trim() || submittingComment}
            loading={submittingComment}
          >
            Add
          </Button>
        </form>

        {/* Comments List */}
        <div className="comments-list">
          {loading ? (
            <div className="comments-loading">
              <LoadingSpinner size="sm" />
              <span>Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{comment.userName}</span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <div className="comment-content">
                  {comment.comment}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}

export default TaskDetail