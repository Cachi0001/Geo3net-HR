import React, { useState } from 'react'
import { Card, Button } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskItem.css'

interface TaskItemProps {
  task: Task
  isSelected?: boolean
  onClick?: () => void
  onUpdate?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isSelected,
  onClick,
  onUpdate,
  onDelete
}) => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  const [updating, setUpdating] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`

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

  const handleStatusChange = async (newStatus: Task['status']) => {
    if (updating) return

    try {
      setUpdating(true)
      const response = await apiCall(`/api/tasks/${task.id}/status`, 'PATCH', {
        status: newStatus,
        completionNotes: newStatus === 'completed' ? 'Marked as completed' : null
      })
      
      onUpdate?.(response.data)
      showToast('success', `Task marked as ${newStatus.replace('_', ' ')}`)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update task status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return

    try {
      setUpdating(true)
      await apiCall(`/api/tasks/${task.id}`, 'DELETE')
      onDelete?.(task.id)
      showToast('success', 'Task deleted successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to delete task')
    } finally {
      setUpdating(false)
    }
  }

  const canEdit = user?.id === task.assignedBy || user?.id === task.assignedTo
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'

  return (
    <Card 
      className={`task-item ${isSelected ? 'selected' : ''} ${isOverdue ? 'overdue' : ''}`}
      padding="md"
      onClick={onClick}
    >
      <div className="task-item-header">
        <div className="task-title-section">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-badges">
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

        {canEdit && (
          <div className="task-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              disabled={updating}
              className="delete-btn"
            >
              🗑️
            </Button>
          </div>
        )}
      </div>

      <div className="task-description">
        {task.description}
      </div>

      <div className="task-meta">
        <div className="task-assignee">
          <span className="meta-label">Assigned to:</span>
          <span className="meta-value">{task.assignedTo || 'Unknown'}</span>
        </div>
        
        {task.dueDate && (
          <div className="task-due-date">
            <span className="meta-label">Due:</span>
            <span className={`meta-value ${isOverdue ? 'overdue-text' : ''}`}>
              {formatDate(task.dueDate)}
            </span>
          </div>
        )}

        <div className="task-comments">
          <span className="meta-label">💬</span>
          <span className="meta-value">0</span>
        </div>
      </div>

      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="task-quick-actions">
          {task.status === 'todo' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange('in_progress')
              }}
              disabled={updating}
            >
              Start Task
            </Button>
          )}
          
          {task.status === 'in_progress' && (
            <Button
              variant="success"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange('completed')
              }}
              disabled={updating}
            >
              Complete
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

export default TaskItem