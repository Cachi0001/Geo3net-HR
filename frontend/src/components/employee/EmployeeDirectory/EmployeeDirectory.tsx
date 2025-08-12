import React, { useState, useEffect, useMemo } from 'react'
import { Card, Input, Select, Button, LoadingSpinner } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './EmployeeDirectory.css'

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
  profilePicture?: string
  isActive: boolean
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

const EmployeeDirectory: React.FC = () => {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadDirectoryData()
  }, [])

  const loadDirectoryData = async () => {
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
      showToast('error', error.message || 'Failed to load employee directory')
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
      
      return matchesSearch && matchesDepartment && matchesPosition && matchesRole && employee.isActive
    })
  }, [employees, searchTerm, selectedDepartment, selectedPosition, selectedRole])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDepartment('')
    setSelectedPosition('')
    setSelectedRole('')
  }

  const getFilteredPositions = () => {
    if (!selectedDepartment) return positions
    return positions.filter(pos => pos.departmentId === selectedDepartment)
  }

  const getRoleOptions = () => {
    const roles = [...new Set(employees.map(emp => emp.role))]
    return roles.map(role => ({ value: role, label: role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) }))
  }

  if (loading) {
    return (
      <div className="employee-directory-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="employee-directory">
      <div className="employee-directory-header">
        <div className="employee-directory-title">
          <h1>Employee Directory</h1>
          <p>Find and connect with your colleagues</p>
        </div>
        
        <div className="employee-directory-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
              <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <Card className="employee-directory-filters">
        <div className="directory-filters-row">
          <Input
            placeholder="Search by name, email, or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="directory-search"
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
          
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!searchTerm && !selectedDepartment && !selectedPosition && !selectedRole}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <div className="employee-directory-results">
        <div className="directory-results-header">
          <span className="results-count">
            {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className={`employee-directory-list ${viewMode}`}>
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="employee-card" hoverable>
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
                  <h3>{employee.fullName}</h3>
                  <p className="employee-position">
                    {employee.positionTitle || 'No position assigned'}
                  </p>
                  <p className="employee-department">
                    {employee.departmentName || 'No department assigned'}
                  </p>
                  <p className="employee-role">
                    {employee.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                
                <div className="employee-contact">
                  <a href={`mailto:${employee.email}`} className="contact-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {employee.email}
                  </a>
                  
                  {employee.phone && (
                    <a href={`tel:${employee.phone}`} className="contact-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" fill="none"/>
                      </svg>
                      {employee.phone}
                    </a>
                  )}
                  
                  <span className="employee-id">ID: {employee.employeeId}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="directory-empty-state">
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
    </div>
  )
}

export default EmployeeDirectory