import React, { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Select, Button } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './OrganizationalChart.css'

interface Employee {
  id: string
  employeeId: string
  fullName: string
  email: string
  role: string
  departmentId?: string
  departmentName?: string
  positionId?: string
  positionTitle?: string
  managerId?: string
  profilePicture?: string
  isActive: boolean
  directReports?: Employee[]
}

interface Department {
  id: string
  name: string
  employees: Employee[]
}

interface OrganizationData {
  departments: Department[]
  totalEmployees: number
  activeEmployees: number
}

const OrganizationalChart: React.FC = () => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [viewMode, setViewMode] = useState<'hierarchy' | 'departments'>('departments')

  useEffect(() => {
    loadOrganizationData()
  }, [])

  const loadOrganizationData = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/employees/organizational-structure', 'GET')
      setOrganizationData(response.data)
    } catch (error: any) {
      showToast(error.message || 'Failed to load organizational data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getEmployeesByRole = (employees: Employee[]) => {
    const roleGroups: Record<string, Employee[]> = {}
    
    employees.forEach(employee => {
      if (!roleGroups[employee.role]) {
        roleGroups[employee.role] = []
      }
      roleGroups[employee.role].push(employee)
    })
    
    return roleGroups
  }

  const getRoleDisplayName = (role: string) => {
    return role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super-admin': return 'role-super-admin'
      case 'hr-admin': return 'role-hr-admin'
      case 'manager': return 'role-manager'
      case 'hr-staff': return 'role-hr-staff'
      case 'employee': return 'role-employee'
      default: return 'role-default'
    }
  }

  const filteredDepartments = selectedDepartment 
    ? organizationData?.departments.filter(dept => dept.id === selectedDepartment) || []
    : organizationData?.departments || []

  if (loading) {
    return (
      <div className="organizational-chart-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!organizationData) {
    return (
      <div className="organizational-chart-error">
        <p>Failed to load organizational data</p>
        <Button onClick={loadOrganizationData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="organizational-chart">
      <div className="organizational-chart-header">
        <div className="organizational-chart-title">
          <h1>Organizational Chart</h1>
          <p>View company structure and employee hierarchy</p>
        </div>
        
        <div className="organizational-chart-stats">
          <div className="stat-item">
            <span className="stat-value">{organizationData.totalEmployees}</span>
            <span className="stat-label">Total Employees</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{organizationData.activeEmployees}</span>
            <span className="stat-label">Active Employees</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{organizationData.departments.length}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>
      </div>

      <Card className="organizational-chart-controls">
        <div className="controls-row">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'departments' ? 'active' : ''}`}
              onClick={() => setViewMode('departments')}
            >
              By Departments
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
              onClick={() => setViewMode('hierarchy')}
            >
              By Hierarchy
            </button>
          </div>
          
          <Select
            placeholder="All Departments"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...organizationData.departments.map(dept => ({ 
                value: dept.id, 
                label: `${dept.name} (${dept.employees.length})` 
              }))
            ]}
          />
        </div>
      </Card>

      <div className="organizational-chart-content">
        {viewMode === 'departments' ? (
          <div className="departments-view">
            {filteredDepartments.map((department) => (
              <Card key={department.id} className="department-card">
                <div className="department-header">
                  <h2>{department.name}</h2>
                  <span className="department-count">
                    {department.employees.length} employee{department.employees.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="department-content">
                  {Object.entries(getEmployeesByRole(department.employees)).map(([role, employees]) => (
                    <div key={role} className="role-group">
                      <h3 className="role-title">
                        {getRoleDisplayName(role)} ({employees.length})
                      </h3>
                      
                      <div className="employees-grid">
                        {employees.map((employee) => (
                          <div key={employee.id} className={`employee-item ${getRoleColor(employee.role)}`}>
                            <div className="employee-avatar">
                              {employee.profilePicture ? (
                                <img src={employee.profilePicture} alt={employee.fullName} />
                              ) : (
                                <div className="employee-avatar-placeholder">
                                  {employee.fullName.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            
                            <div className="employee-details">
                              <h4>{employee.fullName}</h4>
                              <p>{employee.positionTitle || 'No position'}</p>
                              <span className="employee-id">ID: {employee.employeeId}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {department.employees.length === 0 && (
                    <div className="empty-department">
                      <p>No employees in this department</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="hierarchy-view">
            <Card className="hierarchy-card">
              <div className="hierarchy-content">
                <div className="hierarchy-level">
                  <h3>Leadership</h3>
                  <div className="hierarchy-employees">
                    {organizationData.departments
                      .flatMap(dept => dept.employees)
                      .filter(emp => ['super-admin', 'hr-admin'].includes(emp.role))
                      .map((employee) => (
                        <div key={employee.id} className={`hierarchy-employee ${getRoleColor(employee.role)}`}>
                          <div className="employee-avatar">
                            {employee.profilePicture ? (
                              <img src={employee.profilePicture} alt={employee.fullName} />
                            ) : (
                              <div className="employee-avatar-placeholder">
                                {employee.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          <div className="employee-info">
                            <h4>{employee.fullName}</h4>
                            <p>{getRoleDisplayName(employee.role)}</p>
                            <span>{employee.departmentName}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="hierarchy-level">
                  <h3>Management</h3>
                  <div className="hierarchy-employees">
                    {organizationData.departments
                      .flatMap(dept => dept.employees)
                      .filter(emp => emp.role === 'manager')
                      .map((employee) => (
                        <div key={employee.id} className={`hierarchy-employee ${getRoleColor(employee.role)}`}>
                          <div className="employee-avatar">
                            {employee.profilePicture ? (
                              <img src={employee.profilePicture} alt={employee.fullName} />
                            ) : (
                              <div className="employee-avatar-placeholder">
                                {employee.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          <div className="employee-info">
                            <h4>{employee.fullName}</h4>
                            <p>{employee.positionTitle}</p>
                            <span>{employee.departmentName}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="hierarchy-level">
                  <h3>Staff</h3>
                  <div className="hierarchy-employees">
                    {organizationData.departments
                      .flatMap(dept => dept.employees)
                      .filter(emp => ['hr-staff', 'employee'].includes(emp.role))
                      .map((employee) => (
                        <div key={employee.id} className={`hierarchy-employee ${getRoleColor(employee.role)}`}>
                          <div className="employee-avatar">
                            {employee.profilePicture ? (
                              <img src={employee.profilePicture} alt={employee.fullName} />
                            ) : (
                              <div className="employee-avatar-placeholder">
                                {employee.fullName.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          <div className="employee-info">
                            <h4>{employee.fullName}</h4>
                            <p>{employee.positionTitle}</p>
                            <span>{employee.departmentName}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationalChart