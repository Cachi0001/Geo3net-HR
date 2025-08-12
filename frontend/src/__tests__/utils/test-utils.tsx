import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { ToastProvider } from '../../contexts/ToastContext'
import { LoadingProvider } from '../../contexts/LoadingContext'

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
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
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Mock user for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'employee',
  employeeId: 'EMP001',
  departmentId: 'dept-1',
  positionId: 'pos-1',
  profileComplete: true,
}

// Mock API responses
export const mockApiResponses = {
  dashboardStats: {
    totalTasks: 10,
    completedTasks: 7,
    pendingTasks: 3,
    overdueTasks: 1,
    hoursWorkedThisWeek: 32.5,
    hoursWorkedThisMonth: 140.0,
    attendanceRate: 95,
  },
  recentActivity: [
    {
      id: '1',
      type: 'task',
      title: 'Task Completed',
      description: 'Completed project documentation',
      timestamp: new Date().toISOString(),
      status: 'completed',
    },
    {
      id: '2',
      type: 'checkin',
      title: 'Checked In',
      description: 'Started work day',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ],
  employees: [
    {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'employee',
      departmentId: 'dept-1',
      departmentName: 'Engineering',
      positionId: 'pos-1',
      positionTitle: 'Software Developer',
      isActive: true,
    },
    {
      id: '2',
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      role: 'manager',
      departmentId: 'dept-1',
      departmentName: 'Engineering',
      positionId: 'pos-2',
      positionTitle: 'Engineering Manager',
      isActive: true,
    },
  ],
  departments: [
    { id: 'dept-1', name: 'Engineering' },
    { id: 'dept-2', name: 'Human Resources' },
    { id: 'dept-3', name: 'Marketing' },
  ],
  positions: [
    { id: 'pos-1', title: 'Software Developer', departmentId: 'dept-1' },
    { id: 'pos-2', title: 'Engineering Manager', departmentId: 'dept-1' },
    { id: 'pos-3', title: 'HR Specialist', departmentId: 'dept-2' },
  ],
}

// Helper function to create mock API call
export const createMockApiCall = (responses: Record<string, any>) => {
  return jest.fn().mockImplementation((url: string) => {
    for (const [key, response] of Object.entries(responses)) {
      if (url.includes(key)) {
        return Promise.resolve({ data: response })
      }
    }
    return Promise.resolve({ data: [] })
  })
}

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))