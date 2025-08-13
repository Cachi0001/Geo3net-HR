import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Textarea } from '../../common'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './EmployeeCreationForm.css'

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  title: string
  departmentId: string
}

interface EmployeeFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: string
  positionId: string
  startDate: string
  role: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelation: string
  notes: string
}

export interface EmployeeCreationFormProps {
  onSuccess?: (employee: any) => void
  onCancel?: () => void
  initialData?: Partial<EmployeeFormData>
}

const EmployeeCreationForm: React.FC<EmployeeCreationFormProps> = ({
  onSuccess,
  onCancel,
  initialData = {}
}) => {
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    positionId: '',
    startDate: new Date().toISOString().split('T')[0],
    role: 'employee',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Nigeria',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    notes: '',
    ...initialData
  })
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'emergency' | 'additional'>('basic')

  useEffect(() => {
    loadDepartmentsAndPositions()
  }, [])

  const loadDepartmentsAndPositions = async () => {
    try {
      const [departmentsResponse, positionsResponse] = await Promise.all([
        apiCall('/api/departments', 'GET'),
        apiCall('/api/positions', 'GET')
      ])
      
      setDepartments(departmentsResponse.data || [])
      setPositions(positionsResponse.data || [])
    } catch (error: any) {
      showToast(error.message || 'Failed to load departments and positions', 'error')
    }
  }

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Reset position when department changes
    if (field === 'departmentId' && value !== formData.departmentId) {
      setFormData(prev => ({ ...prev, positionId: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic Information
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
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Emergency Contact
    if (!formData.emergencyContactName.trim()) {
      newErrors.emergencyContactName = 'Emergency contact name is required'
    }
    if (!formData.emergencyContactPhone.trim()) {
      newErrors.emergencyContactPhone = 'Emergency contact phone is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Switch to the tab with the first error
      const errorFields = Object.keys(errors)
      if (errorFields.some(field => ['firstName', 'lastName', 'email', 'phone', 'departmentId', 'positionId', 'startDate', 'role'].includes(field))) {
        setActiveTab('basic')
      } else if (errorFields.some(field => ['address', 'city', 'state', 'zipCode', 'country'].includes(field))) {
        setActiveTab('contact')
      } else if (errorFields.some(field => ['emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation'].includes(field))) {
        setActiveTab('emergency')
      }
      return
    }

    setLoading(true)
    
    try {
      const response = await apiCall('/api/employees', 'POST', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        departmentId: formData.departmentId,
        positionId: formData.positionId,
        startDate: formData.startDate,
        role: formData.role,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        country: formData.country.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
        emergencyContactRelation: formData.emergencyContactRelation.trim(),
        notes: formData.notes.trim()
      })
      
      showToast('success', 'Employee created successfully! Invitation email sent.')
      onSuccess?.(response.data.employee)
    } catch (error: any) {
      showToast(error.message || 'Failed to create employee', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredPositions = () => {
    if (!formData.departmentId) return []
    return positions.filter(pos => pos.departmentId === formData.departmentId)
  }

  const roleOptions = [
    { value: 'employee', label: 'Employee' },
    { value: 'hr-staff', label: 'HR Staff' },
    { value: 'manager', label: 'Manager' },
    { value: 'hr-admin', label: 'HR Admin' }
  ]

  return (
    <Card className="employee-creation-form-card" padding="lg">
      <div className="employee-creation-form-header">
        <h2>Create New Employee</h2>
        <p>Add a new employee to the system and send them an invitation</p>
      </div>

      <div className="employee-creation-form-tabs">
        <button
          className={`form-tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
          type="button"
        >
          Basic Info
        </button>
        <button
          className={`form-tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
          type="button"
        >
          Contact Details
        </button>
        <button
          className={`form-tab ${activeTab === 'emergency' ? 'active' : ''}`}
          onClick={() => setActiveTab('emergency')}
          type="button"
        >
          Emergency Contact
        </button>
        <button
          className={`form-tab ${activeTab === 'additional' ? 'active' : ''}`}
          onClick={() => setActiveTab('additional')}
          type="button"
        >
          Additional Info
        </button>
      </div>

      <form onSubmit={handleSubmit} className="employee-creation-form">
        {activeTab === 'basic' && (
          <div className="form-section">
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
              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                options={roleOptions}
                error={errors.role}
                fullWidth
                required
                disabled={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="form-section">
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              error={errors.address}
              fullWidth
              disabled={loading}
            />

            <div className="form-row">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                error={errors.city}
                fullWidth
                disabled={loading}
              />
              <Input
                label="State/Province"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                error={errors.state}
                fullWidth
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <Input
                label="ZIP/Postal Code"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                error={errors.zipCode}
                fullWidth
                disabled={loading}
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                error={errors.country}
                fullWidth
                disabled={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="form-section">
            <Input
              label="Emergency Contact Name"
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              error={errors.emergencyContactName}
              fullWidth
              required
              disabled={loading}
            />

            <div className="form-row">
              <Input
                label="Emergency Contact Phone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                error={errors.emergencyContactPhone}
                fullWidth
                required
                disabled={loading}
              />
              <Input
                label="Relationship"
                value={formData.emergencyContactRelation}
                onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                error={errors.emergencyContactRelation}
                placeholder="e.g., Spouse, Parent, Sibling"
                fullWidth
                disabled={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="form-section">
            <Textarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional notes about the employee..."
              rows={6}
              fullWidth
              disabled={loading}
            />
          </div>
        )}

        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            Create Employee
          </Button>
        </div>
      </form>
    </Card>
  )
}

export default EmployeeCreationForm