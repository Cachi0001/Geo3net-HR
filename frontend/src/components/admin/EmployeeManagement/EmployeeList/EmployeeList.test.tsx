import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeList } from '../'
import { AuthProvider } from '../../../../contexts/AuthContext'
import { ToastProvider } from '../../../../contexts/ToastContext'

// Mock the hooks
const mockApiCall = jest.fn()
const mockShowToast = jest.fn()

jest.mock('../../../../hooks/useApi', () => ({
  useApi: () => ({
    apiCall: mockApiCall,
  }),
}))

jest.mock('../../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}))

jest.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'hr-admin',
      fullName: 'HR Admin',
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

describe('EmployeeList', () => {
  const mockEmployees = [
    {
      id: '1',
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      role: 'employee',
      departmentId: 'dept1',
      departmentName: 'Engineering',
      positionId: 'pos1',
      positionTitle: 'Software Engineer',
      startDate: '2023-01-15',
      salary: 75000,
      employeeType: 'full-time',
      accountStatus: 'active',
      isActive: true,
    },
    {
      id: '2',
      employeeId: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1234567891',
      role: 'manager',
      departmentId: 'dept2',
      departmentName: 'Marketing',
      positionId: 'pos2',
      positionTitle: 'Marketing Manager',
      startDate: '2022-06-01',
      salary: 85000,
      employeeType: 'full-time',
      accountStatus: 'active',
      isActive: true,
    },
  ]

  const mockDepartments = [
    { id: 'dept1', name: 'Engineering' },
    { id: 'dept2', name: 'Marketing' },
  ]

  const mockPositions = [
    { id: 'pos1', title: 'Software Engineer', departmentId: 'dept1' },
    { id: 'pos2', title: 'Marketing Manager', departmentId: 'dept2' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockApiCall.mockImplementation((url) => {
      if (url === '/api/employees') {
        return Promise.resolve({ data: mockEmployees })
      }
      if (url === '/api/departments') {
        return Promise.resolve({ data: mockDepartments })
      }
      if (url === '/api/positions') {
        return Promise.resolve({ data: mockPositions })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it('renders employee list correctly', async () => {
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    // Check loading state initially
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Employee Management')).toBeInTheDocument()
    })

    // Check if employees are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('2 employees found')).toBeInTheDocument()
  })

  it('filters employees by search term', async () => {
    const user = userEvent
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Search for John
    const searchInput = screen.getByPlaceholderText('Search by name, email, or employee ID...')
    await user.type(searchInput, 'John')

    // Should show only John Doe
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.getByText('1 employee found')).toBeInTheDocument()
  })

  it('filters employees by department', async () => {
    const user = userEvent
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Filter by Engineering department
    const departmentSelect = screen.getByDisplayValue('All Departments')
    await user.selectOptions(departmentSelect, 'dept1')

    // Should show only John Doe (Engineering)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.getByText('1 employee found')).toBeInTheDocument()
  })

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search by name, email, or employee ID...')
    await user.type(searchInput, 'John')

    // Clear filters
    const clearButton = screen.getByText('Clear Filters')
    await user.click(clearButton)

    // Should show all employees again
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('2 employees found')).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })

  it('opens create employee form when add button is clicked', async () => {
    const user = userEvent
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Employee Management')).toBeInTheDocument()
    })

    // Click add employee button
    const addButton = screen.getByText('Add Employee')
    await user.click(addButton)

    // Should open create form modal
    expect(screen.getByText('Create New Employee')).toBeInTheDocument()
  })

  it('handles deactivate employee action', async () => {
    const user = userEvent
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true)
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click deactivate button for John Doe
    const deactivateButtons = screen.getAllByText('Deactivate')
    await user.click(deactivateButtons[0])

    // Should call API to deactivate
    expect(mockApiCall).toHaveBeenCalledWith('/api/employees/1/deactivate', 'PUT')
  })

  it('handles API errors gracefully', async () => {
    mockApiCall.mockRejectedValue(new Error('API Error'))

    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('API Error', 'error')
    })
  })

  it('displays empty state when no employees match filters', async () => {
    const user = userEvent
    
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Search for non-existent employee
    const searchInput = screen.getByPlaceholderText('Search by name, email, or employee ID...')
    await user.type(searchInput, 'NonExistent')

    // Should show empty state
    expect(screen.getByText('No employees found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or filters.')).toBeInTheDocument()
  })

  it('displays employee information correctly', async () => {
    render(
      <TestWrapper>
        <EmployeeList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Check employee details
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('EMP001')).toBeInTheDocument()
    expect(screen.getByText('$75,000.00')).toBeInTheDocument()
  })
})