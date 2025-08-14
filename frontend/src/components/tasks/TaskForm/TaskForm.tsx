import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select, LoadingSpinner } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskForm.css'

interface Employee {
  id: string
  fullName: string
  email: string
  department?: string
}

interface TaskFormProps {
  task?: Task | null
  onSave?: (task: Task) => void
  onCancel?: () => void
}

const TaskForm: React.FC<TaskFormProps> = ({
  task,
  onSave,
  onCancel
}) => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium' as Task['priority'],
    dueDate: ''
  })
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
      })
    }
  }, [task])

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await apiCall('/api/employees', 'GET')
      setEmployees(response.data || [])
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = 'Please select an assignee'
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || null
      }

      let response
      if (task) {
        // Update existing task
        response = await apiCall(`/api/tasks/${task.id}`, 'PUT', taskData)
        showToast('success', 'Task updated successfully')
      } else {
        // Create new task
        response = await apiCall('/api/tasks', 'POST', taskData)
        showToast('success', 'Task created successfully')
      }

      onSave?.(response.data)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.fullName} (${emp.email})`
  }))

  if (loadingEmployees) {
    return (
      <Card className="task-form-loading" padding="lg">
        <LoadingSpinner size="lg" />
        <p>Loading form...</p>
      </Card>
    )
  }

  return (
    <Card className="task-form" padding="lg">
      <div className="task-form-header">
        <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="task-form-content">
        <div className="form-group">
          <label htmlFor="title">Task Title *</label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter task title..."
            error={errors.title}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the task in detail..."
            rows={4}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            disabled={loading}
          />
          {errors.description && (
            <span className="error-message">{errors.description}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignedTo">Assign To *</label>
            <Select
              id="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              options={[
                { value: '', label: 'Select an employee...' },
                ...employeeOptions
              ]}
              error={errors.assignedTo}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              options={priorityOptions}
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            error={errors.dueDate}
            disabled={loading}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default TaskForm