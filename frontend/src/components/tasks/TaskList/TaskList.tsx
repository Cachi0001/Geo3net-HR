import React, { useState, useEffect, useMemo } from 'react'
import { Card, Button, LoadingSpinner, Select, Input } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import TaskItem from '../TaskItem/TaskItem'
import './TaskList.css'

export interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  assignedBy: string
  assignedToName?: string
  assignedByName?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string | null
  completedAt: string | null
  completionNotes: string | null
  createdAt: string
  updatedAt: string
  commentsCount?: number
}

interface TaskListProps {
  onTaskSelect?: (task: Task) => void
  onTaskCreate?: () => void
  selectedTaskId?: string
}

const TaskList: React.FC<TaskListProps> = ({
  onTaskSelect,
  onTaskCreate,
  selectedTaskId
}) => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/tasks', 'GET')
      setTasks(response.data || [])
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !task.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false
      }

      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'me' && task.assignedTo !== user?.id) {
          return false
        }
        if (assigneeFilter === 'assigned-by-me' && task.assignedBy !== user?.id) {
          return false
        }
      }

      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          aValue = priorityOrder[a.priority]
          bValue = priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { todo: 1, in_progress: 2, completed: 3, cancelled: 4 }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a.createdAt
          bValue = b.createdAt
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      }
    })

    return filtered
  }, [tasks, searchTerm, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder, user?.id])

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleTaskDelete = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const assigneeOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'me', label: 'Assigned to Me' },
    { value: 'assigned-by-me', label: 'Assigned by Me' }
  ]

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Created Date' }
  ]

  if (loading) {
    return (
      <div className="task-list-loading">
        <LoadingSpinner size="lg" />
        <p>Loading tasks...</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      {/* Header */}
      <div className="task-list-header">
        <div className="task-list-title">
          <h2>Tasks</h2>
          <span className="task-count">({filteredTasks.length})</span>
        </div>
        
        {onTaskCreate && (
          <Button
            variant="primary"
            onClick={onTaskCreate}
            className="create-task-btn"
          >
            + New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="task-filters" padding="md">
        <div className="filter-row">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
            className="filter-select"
          />
          
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={priorityOptions}
            className="filter-select"
          />
          
          <Select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            options={assigneeOptions}
            className="filter-select"
          />
        </div>
        
        <div className="sort-row">
          <label>Sort by:</label>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
            className="sort-select"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </Card>

      {/* Task List */}
      <div className="task-items">
        {filteredTasks.length === 0 ? (
          <Card className="empty-state" padding="lg">
            <div className="empty-icon">📋</div>
            <h3>No tasks found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'
                ? 'Try adjusting your filters to see more tasks.'
                : 'Create your first task to get started.'
              }
            </p>
            {onTaskCreate && (
              <Button variant="primary" onClick={onTaskCreate}>
                Create Task
              </Button>
            )}
          </Card>
        ) : (
          filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onClick={() => onTaskSelect?.(task)}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default TaskList