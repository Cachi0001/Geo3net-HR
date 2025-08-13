import React, { useState, useEffect, useMemo } from 'react'
import { Card, Input, Select, Button, LoadingSpinner, Modal } from '../../common'
import { RoleGuard } from '../../auth'
import EmployeeCreationForm from '../EmployeeCreationForm/EmployeeCreationForm'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './EmployeeManagementList.css'

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

const EmployeeManagementList: React.FC = () => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [employeesResponse, departmentsResponse, positionsResponse] = await Promise.all([
        apiCall('/api/employees', 'GET'),
        apiCall('/api/departments', 'GET'),
        apiCall('/api/positions', 'GET')
      ])

      setEmployees(employeesResponse.data || [])
      setDepartments(departmentsResponse.data || [])
      setPositions(positionsResponse.data || [])
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load employee data')
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
      const matchesRole = !selectedRole || employee.role === selectedRole
      const matchesStatus = !selectedStatus || employee.accountStatus === selectedStatus

      return matchesSearch && matchesDepartment && matchesRole && matchesStatus
    })
  }, [employees, searchTerm, selectedDepartment, selectedRole, selectedStatus])

  const handleCreateEmployee = (newEmployee: Employee) => {
    setEmployees(prev => [newEmployee, ...prev])
    setShowCreateModal(false)
  }

  const handleDeactivateEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return
    }

    try {
      await apiCall(`/api/employees/${employeeId}/deactivate`, 'PUT')

      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employeeId
            ? { ...emp, isActive: false, accountStatus: 'inactive' }
            : emp
        )
      )

      showToast('success', 'Employee deactivated successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to deactivate employee')
    }
  }

  const handleActivateEmployee = async (employeeId: string) => {
    try {
      await apiCall(`/api/employees/${employeeId}/activate`, 'PUT')

      setEmployees(prev =>
        prev.map(emp =>
          emp.id === employeeId
            ? { ...emp, isActive: true, accountStatus: 'active' }
            : emp
        )
      )

      showToast('success', 'Employee activated successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to activate employee')
    }
  }

  const handleResendInvitation = async (employeeId: string) => {
    try {
      await apiCall(`/api/employees/${employeeId}/resend-invitation`, 'POST')
      showToast('success', 'Invitation email sent successfully')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send invitation')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDepartment('')
    setSelectedRole('')
    setSelectedStatus('')
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge-active'
      case 'pending_setup': return 'status-badge-pending'
      case 'pending_verification': return 'status-badge-pending'
      case 'inactive': return 'status-badge-inactive'
      default: return 'status-badge-default'
    }
  }

  if (loading) {
    return (
      <div className="employee-management-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="employee-management-list">
      <div className="employee-management-header">
        <div className="employee-management-title">
          <h1>Employee Management</h1>
          <p>Manage employee accounts, roles, and information</p>
        </div>

        <RoleGuard allowedRoles={['hr-admin', 'super-admin']}>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
          >
            Add Employee
          </Button>
        </RoleGuard>
      </div>

      <Card className="employee-management-filters">
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
            onChange={(e) => setSelectedDepartment(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map(dept => ({ value: dept.id, label: dept.name }))
            ]}
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
            disabled={!searchTerm && !selectedDepartment && !selectedRole && !selectedStatus}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <div className="employee-management-results">
        <div className="results-header">
          <span className="results-count">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="employee-list">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="employee-card">
              <div className="employee-card-content">
                <div className="employee-avatar">
                  {employee.profilePicture ? (
                    <img src={employee.profilePicture} alt={employee.fullName} />
                  ) : (
                    <div className="employee-avatar-placeholder">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </div>
                  )}
                </div>

                <div className="employee-info">
                  <div className="employee-name-section">
                    <h3>{employee.fullName}</h3>
                    <span className={`status-badge ${getStatusBadgeClass(employee.accountStatus)}`}>
                      {employee.accountStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  <p className="employee-position">
                    {employee.positionTitle || 'No position assigned'}
                  </p>
                  <p className="employee-department">
                    {employee.departmentName || 'No department assigned'}
                  </p>
                  <p className="employee-role">
                    {employee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>

                  <div className="employee-contact">
                    <span className="employee-email">{employee.email}</span>
                    {employee.phone && <span className="employee-phone">{employee.phone}</span>}
                    <span className="employee-id">ID: {employee.employeeId}</span>
                  </div>
                </div>

                <div className="employee-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(employee)
                      setShowDetailsModal(true)
                    }}
                  >
                    View Details
                  </Button>

                  <RoleGuard allowedRoles={['hr-admin', 'super-admin']}>
                    {employee.accountStatus === 'pending_setup' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendInvitation(employee.id)}
                      >
                        Resend Invitation
                      </Button>
                    )}

                    {employee.isActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivateEmployee(employee.id)}
                        className="deactivate-btn"
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActivateEmployee(employee.id)}
                        className="activate-btn"
                      >
                        Activate
                      </Button>
                    )}
                  </RoleGuard>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Employee"
        size="lg"
      >
        <EmployeeCreationForm
          onSuccess={handleCreateEmployee}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Employee Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Employee Details"
        size="md"
      >
        {selectedEmployee && (
          <div className="employee-details">
            <div className="employee-details-header">
              <div className="employee-avatar-large">
                {selectedEmployee.profilePicture ? (
                  <img src={selectedEmployee.profilePicture} alt={selectedEmployee.fullName} />
                ) : (
                  <div className="employee-avatar-placeholder">
                    {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="employee-details-info">
                <h3>{selectedEmployee.fullName}</h3>
                <p>{selectedEmployee.positionTitle}</p>
                <span className={`status-badge ${getStatusBadgeClass(selectedEmployee.accountStatus)}`}>
                  {selectedEmployee.accountStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>

            <div className="employee-details-content">
              <div className="detail-item">
                <label>Employee ID:</label>
                <span>{selectedEmployee.employeeId}</span>
              </div>
              <div className="detail-item">
                <label>Email:</label>
                <span>{selectedEmployee.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone:</label>
                <span>{selectedEmployee.phone || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <label>Department:</label>
                <span>{selectedEmployee.departmentName || 'Not assigned'}</span>
              </div>
              <div className="detail-item">
                <label>Position:</label>
                <span>{selectedEmployee.positionTitle || 'Not assigned'}</span>
              </div>
              <div className="detail-item">
                <label>Role:</label>
                <span>{selectedEmployee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              <div className="detail-item">
                <label>Start Date:</label>
                <span>{new Date(selectedEmployee.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmployeeManagementList