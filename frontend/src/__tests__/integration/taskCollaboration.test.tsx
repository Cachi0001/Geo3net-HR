import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { LoadingProvider } from '../../contexts/LoadingContext'
import TaskAssignment from '../../components/tasks/TaskAssignment/TaskAssignment'
import TaskNotification from '../../components/tasks/TaskNotification/TaskNotification'
import TaskCollaboration from '../../components/tasks/TaskCollaboration/TaskCollaboration'
import { Task } from '../../components/tasks/TaskList/TaskList'

// Mock API calls
jest.mock('../../hooks/useApiCall', () => ({
  useApiCall: () => ({
    apiCall: jest.fn().mockImplementation((url, method, data) => {
      if (url.includes('/employees')) {
        return Promise.resolve({
          data: [
            { id: '1', fullName: 'John Doe', email: 'john@example.com', department: 'Engineering' },
            { id: '2', fullName: 'Jane Smith', email: 'jane@example.com', department: 'Design' }
          ]
        })
      }
      if (url.includes('/assign')) {
        return Promise.resolve({
          data: { ...mockTask, assignedTo: data.assignedTo, priority: data.priority }
        })
      }
      if (url.includes('/activities')) {
        return Promise.resolve({
          data: [
            {
              id: '1',
              taskId: 'task-1',
              userId: 'user-1',
              userName: 'John Doe',
              type: 'comment',
              content: 'This is a test comment',
              createdAt: new Date().toISOString()
            }
          ]
        })
      }
      if (url.includes('/comments')) {
        return Promise.resolve({
          data: {
            id: '2',
            content: data.content,
            createdAt: new Date().toISOString()
          }
        })
      }
      return Promise.resolve({ data: {} })
    })
  })
}))

// Mock auth context
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'manager'
    }
  })
}))

// Mock toast context
jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}))

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task',
  assignedTo: 'user-2',
  assignedBy: 'user-1',
  assignedToName: 'Jane Smith',
  assignedByName: 'Test User',
  priority: 'medium',
  status: 'todo',
  dueDate: '2024-12-31',
  completedAt: null,
  completionNotes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  commentsCount: 1
}

const mockNotifications = [
  {
    id: '1',
    type: 'assignment' as const,
    taskId: 'task-1',
    taskTitle: 'Test Task',
    message: 'You have been assigned a new task',
    fromUser: 'user-1',
    fromUserName: 'Test User',
    createdAt: new Date().toISOString(),
    read: false,
    priority: 'medium' as const
  },
  {
    id: '2',
    type: 'comment' as const,
    taskId: 'task-1',
    taskTitle: 'Test Task',
    message: 'New comment added to your task',
    fromUser: 'user-2',
    fromUserName: 'Jane Smith',
    createdAt: new Date().toISOString(),
    read: true,
    priority: 'low' as const
  }
]

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <LoadingProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </LoadingProvider>
    </AuthProvider>
  </BrowserRouter>
)

describe('Task Collaboration Integration Tests', () => {
  describe('TaskAssignment Component', () => {
    it('should render task assignment form correctly', async () => {
      render(
        <TestWrapper>
          <TaskAssignment task={mockTask} />
        </TestWrapper>
      )

      expect(screen.getByText('Assign Task')).toBeInTheDocument()
      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    })

    it('should handle task assignment successfully', async () => {
      const user = userEvent.setup()
      const mockOnAssignmentComplete = jest.fn()

      render(
        <TestWrapper>
          <TaskAssignment 
            task={mockTask} 
            onAssignmentComplete={mockOnAssignmentComplete}
          />
        </TestWrapper>
      )

      // Wait for employees to load
      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument()
      })

      // Select an employee
      const assigneeSelect = screen.getByLabelText(/assign to/i)
      await user.selectOptions(assigneeSelect, '1')

      // Set priority
      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.selectOptions(prioritySelect, 'high')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /assign task/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnAssignmentComplete).toHaveBeenCalled()
      })
    })

    it('should handle bulk assignment mode', async () => {
      const selectedTasks = [mockTask, { ...mockTask, id: 'task-2', title: 'Task 2' }]
      
      render(
        <TestWrapper>
          <TaskAssignment 
            mode="bulk"
            selectedTasks={selectedTasks}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Assign 2 Tasks')).toBeInTheDocument()
      expect(screen.getByText(/you are about to assign 2 tasks/i)).toBeInTheDocument()
    })

    it('should validate form inputs', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <TaskAssignment task={mockTask} />
        </TestWrapper>
      )

      // Try to submit without selecting an employee
      const submitButton = screen.getByRole('button', { name: /assign task/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/please select an employee/i)).toBeInTheDocument()
      })
    })
  })

  describe('TaskNotification Component', () => {
    it('should render notifications correctly', () => {
      render(
        <TestWrapper>
          <TaskNotification notifications={mockNotifications} />
        </TestWrapper>
      )

      expect(screen.getByText('Task Notifications')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Unread count
      expect(screen.getByText('Test Task')).toBeInTheDocument()
      expect(screen.getByText('You have been assigned a new task')).toBeInTheDocument()
    })

    it('should handle mark as read functionality', async () => {
      const user = userEvent.setup()
      const mockOnMarkAsRead = jest.fn()

      render(
        <TestWrapper>
          <TaskNotification 
            notifications={mockNotifications}
            onMarkAsRead={mockOnMarkAsRead}
          />
        </TestWrapper>
      )

      // Click on unread notification
      const unreadNotification = screen.getByText('You have been assigned a new task')
      await user.click(unreadNotification)

      expect(mockOnMarkAsRead).toHaveBeenCalledWith('1')
    })

    it('should handle mark all as read', async () => {
      const user = userEvent.setup()
      const mockOnMarkAllAsRead = jest.fn()

      render(
        <TestWrapper>
          <TaskNotification 
            notifications={mockNotifications}
            onMarkAllAsRead={mockOnMarkAllAsRead}
          />
        </TestWrapper>
      )

      const markAllButton = screen.getByRole('button', { name: /mark all read/i })
      await user.click(markAllButton)

      expect(mockOnMarkAllAsRead).toHaveBeenCalled()
    })

    it('should show empty state when no notifications', () => {
      render(
        <TestWrapper>
          <TaskNotification notifications={[]} />
        </TestWrapper>
      )

      expect(screen.getByText('No Notifications')).toBeInTheDocument()
      expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument()
    })

    it('should handle show more/less functionality', async () => {
      const user = userEvent.setup()
      const manyNotifications = Array.from({ length: 10 }, (_, i) => ({
        ...mockNotifications[0],
        id: `notification-${i}`,
        message: `Notification ${i + 1}`
      }))

      render(
        <TestWrapper>
          <TaskNotification 
            notifications={manyNotifications}
            maxVisible={5}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Show 5 more')).toBeInTheDocument()

      const showMoreButton = screen.getByRole('button', { name: /show 5 more/i })
      await user.click(showMoreButton)

      expect(screen.getByText('Show less')).toBeInTheDocument()
    })
  })

  describe('TaskCollaboration Component', () => {
    it('should render collaboration interface correctly', async () => {
      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      expect(screen.getByText('Activity & Collaboration')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('should load and display activities', async () => {
      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('This is a test comment')).toBeInTheDocument()
      })
    })

    it('should handle comment submission', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      const commentInput = screen.getByPlaceholderText('Add a comment...')
      const sendButton = screen.getByRole('button', { name: /send/i })

      // Type a comment
      await user.type(commentInput, 'This is a new comment')
      
      // Submit comment
      await user.click(sendButton)

      await waitFor(() => {
        expect(commentInput).toHaveValue('')
      })
    })

    it('should disable send button when comment is empty', () => {
      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })

    it('should show empty state when no activities', async () => {
      // Mock empty activities response
      const mockApiCall = require('../../hooks/useApiCall').useApiCall
      mockApiCall.mockReturnValue({
        apiCall: jest.fn().mockResolvedValue({ data: [] })
      })

      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/no activity yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Integration Workflows', () => {
    it('should handle complete task assignment workflow', async () => {
      const user = userEvent.setup()
      const mockOnAssignmentComplete = jest.fn()

      render(
        <TestWrapper>
          <TaskAssignment 
            task={mockTask}
            onAssignmentComplete={mockOnAssignmentComplete}
          />
        </TestWrapper>
      )

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument()
      })

      // Fill out assignment form
      await user.selectOptions(screen.getByLabelText(/assign to/i), '1')
      await user.selectOptions(screen.getByLabelText(/priority/i), 'high')
      await user.type(screen.getByLabelText(/assignment note/i), 'Please complete this urgently')

      // Submit assignment
      await user.click(screen.getByRole('button', { name: /assign task/i }))

      await waitFor(() => {
        expect(mockOnAssignmentComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            assignedTo: '1',
            priority: 'high'
          })
        )
      })
    })

    it('should handle notification interaction workflow', async () => {
      const user = userEvent.setup()
      const mockOnNotificationClick = jest.fn()
      const mockOnMarkAsRead = jest.fn()

      render(
        <TestWrapper>
          <TaskNotification 
            notifications={mockNotifications}
            onNotificationClick={mockOnNotificationClick}
            onMarkAsRead={mockOnMarkAsRead}
          />
        </TestWrapper>
      )

      // Click on notification
      const notification = screen.getByText('You have been assigned a new task')
      await user.click(notification)

      expect(mockOnMarkAsRead).toHaveBeenCalledWith('1')
      expect(mockOnNotificationClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          type: 'assignment'
        })
      )
    })

    it('should handle collaboration comment workflow', async () => {
      const user = userEvent.setup()

      render(
        <TestWrapper>
          <TaskCollaboration task={mockTask} />
        </TestWrapper>
      )

      // Wait for activities to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Add a new comment
      const commentInput = screen.getByPlaceholderText('Add a comment...')
      await user.type(commentInput, 'Great progress on this task!')
      
      const sendButton = screen.getByRole('button', { name: /send/i })
      await user.click(sendButton)

      // Verify comment was added to the activity list
      await waitFor(() => {
        expect(screen.getByText('Great progress on this task!')).toBeInTheDocument()
      })
    })
  })
})