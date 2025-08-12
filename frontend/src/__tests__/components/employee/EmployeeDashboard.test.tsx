import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeDashboard } from '../../../components/employee'
import { AuthProvider } from '../../../contexts/AuthContext'
import { ToastProvider } from '../../../contexts/ToastContext'

// Mock the hooks
const mockApiCall = jest.fn()
const mockShowToast = jest.fn()

jest.mock('../../../hooks/useApi', () => ({
  useApi: () => ({
    apiCall: mockApiCall,
  }),
}))

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}))

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      role: 'employee',
    },
  }),
}))

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </AuthProvider>
)

describe('EmployeeDashboard', () => {
  const mockStats = {
    totalTasks: 10,
    completedTasks: 7,
    pendingTasks: 3,
    overdueTasks: 1,
    hoursWorkedThisWeek: 32.5,
    hoursWorkedThisMonth: 140.0,
    attendanceRate: 95,
  }

  const mockRecentActivity = [
    {
      id: '1',
      type: 'task' as const,
      title: 'Task Completed',
      description: 'Completed project documentation',
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: '2',
      type: 'checkin' as const,
      title: 'Checked In',
      description: 'Started work day',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockApiCall.mockImplementation((url) => {
      if (url.includes('stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (url.includes('recent-activity')) {
        return Promise.resolve({ data: mockRecentActivity })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it('renders dashboard with loading state initially', () => {
    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders dashboard with stats and activity after loading', async () => {
    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Good morning, John!')).toBeInTheDocument()
    })

    // Check stats are displayed
    expect(screen.getByText('7/10')).toBeInTheDocument() // completed/total tasks
    expect(screen.getByText('Tasks Completed')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // pending tasks
    expect(screen.getByText('32.5h')).toBeInTheDocument() // hours this week
    expect(screen.getByText('95%')).toBeInTheDocument() // attendance rate

    // Check recent activity
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Task Completed')).toBeInTheDocument()
    expect(screen.getByText('Checked In')).toBeInTheDocument()
  })

  it('shows overdue tasks alert when there are overdue tasks', async () => {
    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Overdue Tasks')).toBeInTheDocument()
      expect(screen.getByText('You have 1 overdue task that needs attention.')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiCall.mockRejectedValue(new Error('API Error'))

    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('API Error', 'error')
    })
  })

  it('displays correct greeting based on time of day', async () => {
    // Mock different times
    const originalDate = Date
    const mockDate = jest.fn(() => ({
      getHours: () => 14, // 2 PM
    }))
    global.Date = mockDate as any

    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Good afternoon, John!')).toBeInTheDocument()
    })

    global.Date = originalDate
  })

  it('formats relative time correctly', async () => {
    const recentActivity = [
      {
        id: '1',
        type: 'task' as const,
        title: 'Recent Task',
        description: 'Just completed',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
    ]

    mockApiCall.mockImplementation((url) => {
      if (url.includes('stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (url.includes('recent-activity')) {
        return Promise.resolve({ data: recentActivity })
      }
      return Promise.resolve({ data: [] })
    })

    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Just now')).toBeInTheDocument()
    })
  })

  it('handles empty recent activity', async () => {
    mockApiCall.mockImplementation((url) => {
      if (url.includes('stats')) {
        return Promise.resolve({ data: mockStats })
      }
      if (url.includes('recent-activity')) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })

    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument()
    })
  })

  it('calls API endpoints on mount', async () => {
    render(
      <TestWrapper>
        <EmployeeDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledWith('/api/employees/dashboard/stats', 'GET')
      expect(mockApiCall).toHaveBeenCalledWith('/api/employees/dashboard/recent-activity', 'GET')
    })
  })
})