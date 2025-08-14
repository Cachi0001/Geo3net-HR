import React, { useState, useEffect } from 'react'
import { Card, Button, Select, Input, LoadingSpinner } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import { useAuth } from '../../../hooks/useAuth'
import { Task } from '../TaskList/TaskList'
import './TaskAssignment.css'

interface Employee {
  id: string
  fullName: string
  email: string
  department?: string
  role?: string
}

interface TaskAssignmentProps {
  task?: Task | null
  onAssignmentComplete?: (task: Task) => void
  onCancel?: () => void
  mode?: 'assign' | 'reassign' | 'bulk'
  selectedTasks?: Task[]
}

const TaskAssignment: React.FC<TaskAssignmentProps> = ({
  task,
  onAssignmentComplete,
  onCancel,
  mode = 'assign',
  selectedTasks = []
}) => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [assignmentNote, setAssignmentNote] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (task) {
      setSelectedEmployee(task.assignedTo)
      setPriority(task.priority)
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '')
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

    if (!selectedEmployee) {
      newErrors.selectedEmployee = 'Please select an employee to assign'
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dueDateObj < today) {
        newErrors.dueDate = 'Due date cannot be in the past'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      
      const assignmentData = {
        assignedTo: selectedEmployee,
        priority,
        dueDate: dueDate || null,
        assignmentNote: assignmentNote.trim() || null
      }

      if (mode === 'bulk' && selectedTasks.length > 0) {
        // Bulk assignment
        const promises = selectedTasks.map(t => 
          apiCall(`/api/tasks/${t.id}/assign`, 'PATCH', assignmentData)
        )
        
        const results = await Promise.all(promises)
        showToast('success', `Successfully assigned ${selectedTasks.length} tasks`)
        
        // Call completion handler for each task
        results.forEach(result => {
          onAssignmentComplete?.(result.data)
        })
      } else if (task) {
        // Single task assignment/reassignment
        const response = await apiCall(`/api/tasks/${task.id}/assign`, 'PATCH', assignmentData)
        showToast('success', mode === 'reassign' ? 'Task reassigned successfully' : 'Task assigned successfully')
        onAssignmentComplete?.(response.data)
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to assign task')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === 'selectedEmployee') setSelectedEmployee(value)
    if (field === 'assignmentNote') setAssignmentNote(value)
    if (field === 'priority') setPriority(value as Task['priority'])
    if (field === 'dueDate') setDueDate(value)
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const employeeOptions = employees.map(emp => ({
    value: emp.id,
    label: `${emp.fullName} (${emp.department || 'No Department'})`
  }))

  const getTitle = () => {
    if (mode === 'bulk') return `Assign ${selectedTasks.length} Tasks`
    if (mode === 'reassign') return 'Reassign Task'
    return 'Assign Task'
  }

  if (loadingEmployees) {
    return (
      <Card className="task-assignment-loading" padding="lg">
        <LoadingSpinner size="lg" />
        <p>Loading employees...</p>
      </Card>
    )
  }

  return (
    <Card className="task-assignment" padding="lg">
      <div className="task-assignment-header">
        <h2>{getTitle()}</h2>
        {mode === 'bulk' && (
          <p className="bulk-info">
            You are about to assign {selectedTasks.length} tasks to the selected employee
          </p>
        )}
        {task && (
          <div className="task-info">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleAssignment} className="task-assignment-form">
        <div className="form-group">
          <label htmlFor="selectedEmployee">Assign To *</label>
          <Select
            id="selectedEmployee"
            value={selectedEmployee}
            onChange={(e) => handleInputChange('selectedEmployee', e.target.value)}
            options={[
              { value: '', label: 'Select an employee...' },
              ...employeeOptions
            ]}
            error={errors.selectedEmployee}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <Select
              id="priority"
              value={priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              options={priorityOptions}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              error={errors.dueDate}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="assignmentNote">Assignment Note (Optional)</label>
          <textarea
            id="assignmentNote"
            value={assignmentNote}
            onChange={(e) => handleInputChange('assignmentNote', e.target.value)}
            placeholder="Add any specific instructions or context for this assignment..."
            rows={3}
            className="form-textarea"
            disabled={loading}
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
            {mode === 'bulk' ? 'Assign Tasks' : mode === 'reassign' ? 'Reassign Task' : 'Assign Task'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default TaskAssignment