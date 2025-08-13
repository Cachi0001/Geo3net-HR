import React, { useState, useEffect } from 'react'
import { Card, LoadingSpinner, Button } from '../../../common'
import { useApiCall } from '../../../../hooks/useApiCall'
import { useToast } from '../../../../hooks/useToast'
import './OrganizationalChart.css'

interface Employee {
  id: string
  employeeId: string
  fullName: string
  email: string
  role: string
  departmentName?: string
  positionTitle?: string
  profilePicture?: string
  managerId?: string
  directReports: Employee[]
}

interface Department {
  id: string
  name: string
  employees: Employee[]
  managerId?: string
}

const OrganizationalChart: React.FC = () => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [orgData, setOrgData] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'departments'>('departments')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadOrganizationalData()
  }, [])

  const loadOrganizationalData = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/api/employees/organizational-structure', 'GET')
      setOrgData(response.data)
    } catch (error: any) {
      showToast(error.message || 'Failed to load organizational data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderEmployee = (employee: Employee, level: number = 0) => {
    const hasDirectReports = employee.directReports && employee.directReports.length > 0
    const isExpanded = expandedNodes.has(employee.id)

    return (
      <div key={employee.id} className="org-node" style={{ marginLeft: `${level * 40}px` }}>
        <div className="employee-node">
          <div className="employee-node-content">
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
              <p className="employee-position">{employee.positionTitle || 'No position'}</p>
              <p className="employee-department">{employee.departmentName || 'No department'}</p>
              <span className="employee-role">
                {employee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            
            {hasDirectReports && (
              <button
                className="expand-button"
                onClick={() => toggleNodeExpansion(employee.id)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {hasDirectReports && (
            <div className="direct-reports-count">
              {employee.directReports.length} direct report{employee.directReports.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {hasDirectReports && isExpanded && (
          <div className="direct-reports">
            {employee.directReports.map(report => renderEmployee(report, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderDepartmentView = () => {
    return (
      <div className="departments-view">
        {orgData.map(department => (
          <Card key={department.id} className="department-card">
            <div className="department-header">
              <h3>{department.name}</h3>
              <span className="employee-count">
                {department.employees.length} employee{department.employees.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="department-employees">
              {department.employees.map(employee => (
                <div key={employee.id} className="department-employee">
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
                    <p>{employee.positionTitle || 'No position'}</p>
                    <span className="employee-role">
                      {employee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              ))}
              
              {department.employees.length === 0 && (
                <div className="no-employees">
                  <p>No employees in this department</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  const renderHierarchyView = () => {
    // Find top-level managers (employees with no manager)
    const allEmployees = orgData.flatMap(dept => dept.employees)
    const topLevelManagers = allEmployees.filter(emp => !emp.managerId)
    
    return (
      <div className="hierarchy-view">
        {topLevelManagers.map(manager => renderEmployee(manager))}
        
        {topLevelManagers.length === 0 && (
          <div className="no-hierarchy">
            <p>No organizational hierarchy defined</p>
            <p>Set up manager relationships to see the hierarchy view</p>
          </div>
        )}
      </div>
    )
  }

  const getTotalEmployees = () => {
    return orgData.reduce((total, dept) => total + dept.employees.length, 0)
  }

  if (loading) {
    return (
      <div className="org-chart-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="organizational-chart">
      <div className="org-chart-header">
        <div className="org-chart-title">
          <h1>Organizational Chart</h1>
          <p>View your organization's structure and hierarchy</p>
        </div>
        
        <div className="org-chart-stats">
          <div className="stat-item">
            <span className="stat-value">{getTotalEmployees()}</span>
            <span className="stat-label">Total Employees</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{orgData.length}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>
      </div>

      <Card className="org-chart-controls">
        <div className="view-toggle">
          <Button
            variant={viewMode === 'departments' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('departments')}
          >
            Departments
          </Button>
          <Button
            variant={viewMode === 'hierarchy' ? 'primary' : 'ghost'}
            onClick={() => setViewMode('hierarchy')}
          >
            Hierarchy
          </Button>
        </div>
        
        <Button variant="outline" onClick={loadOrganizationalData}>
          Refresh
        </Button>
      </Card>

      <div className="org-chart-content">
        {viewMode === 'departments' ? renderDepartmentView() : renderHierarchyView()}
      </div>
    </div>
  )
}

export default OrganizationalChart