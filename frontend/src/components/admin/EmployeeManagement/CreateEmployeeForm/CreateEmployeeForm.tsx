import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Card, Modal } from '../../../common'
import { useApiCall } from '../../../../hooks/useApiCall'
import { useToast } from '../../../../hooks/useToast'
import './CreateEmployeeForm.css'

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
  departmentId: string
}

interface CreateEmployeeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: string
  positionId: string
  startDate: string
  salary: string
  employeeType: string
  role: string
}

const CreateEmployeeForm: React.FC<CreateEmployeeFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    startDate: new Date().toISOString().split('T')[0],
    salary: '',
    employeeType: 'full-time',
    role: 'employee'
  })
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadFormData()
    }
  }, [isOpen])

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      
      const [departmentsResponse, positionsResponse] = await Promise.all([
        apiCall('/api/departments', 'GET'),
        apiCall('/api/positions', 'GET')
      ])
      
      setDepartments(departmentsResponse.data)
      setPositions(positionsResponse.data)
    } catch (error: any) {
      showToast(error.message || 'Failed to load form data', 'error')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Reset position when department changes
    if (field === 'departmentId') {
      setFormData(prev => ({ ...prev, positionId: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.departmentId) {
      newErrors.departmentId = 'Department is required'
    }

    if (!formData.positionId) {
      newErrors.positionId = 'Position is required'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!formData.salary.trim()) {
      newErrors.salary = 'Salary is required'
    } else if (isNaN(Number(formData.salary)) || Number(formData.salary) <= 0) {
      newErrors.salary = 'Please enter a valid salary amount'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const employeeData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        startDate: formData.startDate,
        salary: Number(formData.salary),
        employeeType: formData.employeeType,
        role: formData.role
      }
      
      await apiCall('/api/employees', 'POST', employeeData)
      
      showToast('success', 'Employee created successfully! Invitation email sent.')
      onSuccess()
      handleClose()
    } catch (error: any) {
      showToast(error.message || 'Failed to create employee', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      positionId: '',
      startDate: new Date().toISOString().split('T')[0],
      salary: '',
      employeeType: 'full-time',
      role: 'employee'
    })
    setErrors({})
    onClose()
  }

  const getFilteredPositions = () => {
    if (!formData.departmentId) return []
    return positions.filter(pos => pos.departmentId === formData.departmentId)
  }

  const employeeTypeOptions = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' }
  ]

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'hr-staff', label: 'HR Staff' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr-admin', label: 'HR Admin' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Employee"
      size="lg"
      footer={
        <div className="create-employee-modal-footer">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
            disabled={loading || loadingData}
          >
            Create Employee
          </Button>
        </div>
      }
    >
      <div className="create-employee-form">
        {loadingData ? (
          <div className="create-employee-loading">
            <p>Loading form data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Personal Information</h3>
              
              <div className="form-row">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  error={errors.firstName}
                  fullWidth
                  required
                  disabled={loading}
                />
                
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  error={errors.lastName}
                  fullWidth
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  fullWidth
                  required
                  disabled={loading}
                />
                
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  fullWidth
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Work Information</h3>
              
              <div className="form-row">
                <Select
                  label="Department"
                  value={formData.departmentId}
                  onChange={(e) => handleInputChange('departmentId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                  ]}
                  error={errors.departmentId}
                  fullWidth
                  required
                  disabled={loading}
                />
                
                <Select
                  label="Position"
                  value={formData.positionId}
                  onChange={(e) => handleInputChange('positionId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Position' },
                    ...getFilteredPositions().map(pos => ({ value: pos.id, label: pos.title }))
                  ]}
                  error={errors.positionId}
                  fullWidth
                  required
                  disabled={loading || !formData.departmentId}
                />
              </div>

              <div className="form-row">
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  error={errors.startDate}
                  fullWidth
                  required
                  disabled={loading}
                />
                
                <Input
                  label="Salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  error={errors.salary}
                  placeholder="0.00"
                  fullWidth
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <Select
                  label="Employee Type"
                  value={formData.employeeType}
                  onChange={(e) => handleInputChange('employeeType', e.target.value)}
                  options={employeeTypeOptions}
                  fullWidth
                  disabled={loading}
                />
                
                <Select
                  label="Role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  options={roleOptions}
                  fullWidth
                  disabled={loading}
                />
              </div>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}

export default CreateEmployeeForm