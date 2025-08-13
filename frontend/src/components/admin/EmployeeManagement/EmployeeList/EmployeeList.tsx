import React, { useState, useEffect, useMemo } from 'react'
import { Card, Input, Select, Button, LoadingSpinner } from '../../../common'
import { CreateEmployeeForm } from '../'
import { useApiCall } from '../../../../hooks/useApiCall'
import { useToast } from '../../../../hooks/useToast'
import { useAuth } from '../../../../hooks/useAuth'
import './EmployeeList.css'

interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone?: string
  role: string
  departmentId?: string
  departmentName?: string
  positionId?: string
  positionTitle?: string
  startDate: string
  salary?: number
  employeeType: string
  accountStatus: string
  isActive: boolean
  profilePicture?: string
}

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
  departmentId: string
}

const EmployeeList: React.FC = () => {
  const { user } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadEmployeeData()
  }, [])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      
      const [employeesResponse, departmentsResponse, positionsResponse] = await Promise.all([
        apiCall('/api/employees', 'GET'),
        apiCall('/api/departments', 'GET'),
        apiCall('/api/positions', 'GET')
      ])
      
      setEmployees(employeesResponse.data)
      setDepartments(departmentsResponse.data)
      setPositions(positionsResponse.data)
    } catch (error: any) {
      showToast(error.message || 'Failed to load employee data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = !searchTerm || 
        employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = !selectedDepartment || employee.departmentId === selectedDepartment
      const matchesPosition = !selectedPosition || employee.positionId === selectedPosition
      const matchesRole = !selectedRole || employee.role === selectedRole
      const matchesStatus = !selectedStatus || employee.accountStatus === selectedStatus
      
      return matchesSearch && matchesDepartment && matchesPosition && matchesRole && matchesStatus
    })
  }, [employees, searchTerm, selectedDepartment, selectedPosition, selectedRole, selectedStatus])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDepartment('')
    setSelectedPosition('')
    setSelectedRole('')
    setSelectedStatus('')
  }

  const handleDeactivateEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return
    }

    try {
      await apiCall(`/api/employees/${employeeId}/deactivate`, 'PUT')
      showToast('success', 'Employee deactivated successfully')
      loadEmployeeData()
    } catch (error: any) {
      showToast(error.message || 'Failed to deactivate employee', 'error')
    }
  }

  const handleActivateEmployee = async (employeeId: string) => {
    try {
      await apiCall(`/api/employees/${employeeId}/activate`, 'PUT')
      showToast('success', 'Employee activated successfully')
      loadEmployeeData()
    } catch (error: any) {
      showToast(error.message || 'Failed to activate employee', 'error')
    }
  }

  const handleResendInvitation = async (employeeId: string) => {
    try {
      await apiCall(`/api/employees/${employeeId}/resend-invitation`, 'POST')
      showToast('success', 'Invitation email sent successfully')
    } catch (error: any) {
      showToast(error.message || 'Failed to send invitation', 'error')
    }
  }

  const getFilteredPositions = () => {
    if (!selectedDepartment) return positions
    return positions.filter(pos => pos.departmentId === selectedDepartment)
  }

  const getRoleOptions = () => {
    const roles = [...new Set(employees.map(emp => emp.role))]
    return roles.map(role => ({ 
      value: role, 
      label: role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
    }))
  }

  const getStatusOptions = () => {
    const statuses = [...new Set(employees.map(emp => emp.accountStatus))]
    return statuses.map(status => ({ 
      value: status, 
      label: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
    }))
  }

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge active'
      case 'pending_setup': return 'status-badge pending'
      case 'pending_verification': return 'status-badge pending'
      case 'inactive': return 'status-badge inactive'
      default: return 'status-badge'
    }
  }

  if (loading) {
    return (
      <div className="employee-list-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="employee-list">
      <div className="employee-list-header">
        <div className="employee-list-title">
          <h1>Employee Management</h1>
          <p>Manage your organization's employees</p>
        </div>
        
        <div className="employee-list-actions">
          <Button 
            variant="primary" 
            onClick={() => setShowCreateForm(true)}
          >
            Add Employee
          </Button>
        </div>
      </div>

      <Card className="employee-list-filters">
        <div className="filters-row">
          <Input
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <Select
            placeholder="All Departments"
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value)
              setSelectedPosition('') // Reset position when department changes
            }}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map(dept => ({ value: dept.id, label: dept.name }))
            ]}
          />
          
          <Select
            placeholder="All Positions"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            options={[
              { value: '', label: 'All Positions' },
              ...getFilteredPositions().map(pos => ({ value: pos.id, label: pos.title }))
            ]}
            disabled={!selectedDepartment}
          />
          
          <Select
            placeholder="All Roles"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              ...getRoleOptions()
            ]}
          />
          
          <Select
            placeholder="All Statuses"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              ...getStatusOptions()
            ]}
          />
          
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!searchTerm && !selectedDepartment && !selectedPosition && !selectedRole && !selectedStatus}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <div className="employee-list-results">
        <div className="results-header">
          <span className="results-count">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="employee-cards-grid">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="employee-card">
              <div className="employee-card-header">
                <div className="employee-avatar">
                  {employee.profilePicture ? (
                    <img src={employee.profilePicture} alt={employee.fullName} />
                  ) : (
                    <div className="employee-avatar-placeholder">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                  )}
                </div>
                
                <div className="employee-basic-info">
                  <h3>{employee.fullName}</h3>
                  <p className="employee-position">
                    {employee.positionTitle || 'No position assigned'}
                  </p>
                  <p className="employee-department">
                    {employee.departmentName || 'No department assigned'}
                  </p>
                </div>
                
                <div className="employee-status">
                  <span className={getStatusBadgeClass(employee.accountStatus)}>
                    {employee.accountStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="employee-card-details">
                <div className="detail-item">
                  <span className="detail-label">Employee ID:</span>
                  <span className="detail-value">{employee.employeeId}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{employee.email}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{employee.phone || 'Not provided'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Role:</span>
                  <span className="detail-value">
                    {employee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">
                    {new Date(employee.startDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Salary:</span>
                  <span className="detail-value">{formatSalary(employee.salary)}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">
                    {employee.employeeType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="employee-card-actions">
                {employee.accountStatus === 'pending_setup' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendInvitation(employee.id)}
                  >
                    Resend Invitation
                  </Button>
                )}
                
                {employee.isActive ? (
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => handleDeactivateEmployee(employee.id)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleActivateEmployee(employee.id)}
                  >
                    Activate
                  </Button>
                )}
                
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="employee-list-empty">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No employees found</h3>
            <p>Try adjusting your search criteria or filters.</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <CreateEmployeeForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={loadEmployeeData}
      />
    </div>
  )
}

export default EmployeeList