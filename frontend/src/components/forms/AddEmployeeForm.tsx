import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Calendar, Building, DollarSign } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { apiClient } from '@/services/api'
import { toast } from 'sonner'
import type { CreateEmployeeData, Department, Position } from '@/types/employee.types'

interface EmployeeFormData {
  fullName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  address: string
  emergencyContact: string
  emergencyPhone: string
  departmentId: string
  positionId: string
  managerId: string
  hireDate: string
  salary: string
  skills: string[]
  notes: string
  sendInvitation: boolean
  accountSetupMethod: 'email_invitation' | 'manual_setup'
  password: string
  generatePassword: boolean
}

interface Manager {
  id: string
  fullName: string
  employeeId: string
}

// Enhanced validation function that matches backend requirements
const validateEmployeeForm = (data: EmployeeFormData): string[] => {
  const errors: string[] = []

  // Required fields as per project requirements
  if (!data.fullName?.trim()) {
    errors.push('Full name is required')
  }

  if (!data.email?.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  }

  if (!data.hireDate) {
    errors.push('Hire date is required')
  } else {
    const hireDate = new Date(data.hireDate)
    if (isNaN(hireDate.getTime())) {
      errors.push('Invalid hire date format')
    }
  }

  // Enhanced validation for mandatory profile completion
  if (!data.departmentId) {
    errors.push('Department is required - please complete mandatory profile information')
  }

  if (!data.positionId) {
    errors.push('Position is required - please complete mandatory profile information')
  }

  // Optional field validations
  if (data.salary && parseFloat(data.salary) < 0) {
    errors.push('Salary must be a positive number')
  }

  if (data.dateOfBirth) {
    const birthDate = new Date(data.dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid date of birth format')
    } else {
      const age = new Date().getFullYear() - birthDate.getFullYear()
      if (age < 16 || age > 80) {
        errors.push('Employee age must be between 16 and 80 years')
      }
    }
  }

  if (data.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
    errors.push('Invalid phone number format')
  }

  // Account setup validation
  if (data.accountSetupMethod === 'manual_setup') {
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters long for manual setup')
    }
  }

  return errors
}

// Utility function to generate a secure password
const generateSecurePassword = (): string => {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)] // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)] // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)] // Special character
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

const AddEmployeeForm: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    departmentId: '',
    positionId: '',
    managerId: '',
    hireDate: new Date().toISOString().split('T')[0],
    salary: '',
    skills: [],
    notes: '',
    sendInvitation: true,
    accountSetupMethod: 'email_invitation',
    password: '',
    generatePassword: true
  })

  // Load departments, positions, and managers on component mount
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true)
        
        // Load departments
        console.log('🏢 Loading departments...')
        const deptResponse = await apiClient.getDepartments()
        console.log('🏢 Department response:', deptResponse)
        if (deptResponse.success && deptResponse.data) {
          const departmentList = deptResponse.data.departments || []
          console.log('🏢 Departments loaded:', departmentList.length, 'departments')
          setDepartments(departmentList)
        } else {
          console.error('🏢 Failed to load departments:', deptResponse.message)
          toast.error('Failed to load departments: ' + (deptResponse.message || 'Unknown error'))
        }
        
        // Load positions - using mock data until positions API is implemented
        const mockPositions: Position[] = [
          { id: '1', title: 'Software Engineer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', title: 'Senior Software Engineer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', title: 'Project Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '4', title: 'Team Lead', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '5', title: 'HR Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '6', title: 'Finance Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
        setPositions(mockPositions)
        
        // Load managers (employees with manager role)
        const empResponse = await apiClient.getEmployees()
        if (empResponse.success && empResponse.data) {
          const managerList = empResponse.data.employees?.filter((emp: any) => 
            emp.position?.title?.toLowerCase().includes('manager') || 
            emp.position?.title?.toLowerCase().includes('lead') ||
            emp.position?.title?.toLowerCase().includes('supervisor')
          ) || []
          setManagers(managerList)
        }
      } catch (error) {
        console.error('Failed to load form data:', error)
        toast.error('Failed to load form data. Some dropdowns may be empty.')
      } finally {
        setLoadingData(false)
      }
    }
    
    loadFormData()
  }, [])

  // Auto-generate password when generatePassword is enabled
  useEffect(() => {
    if (formData.generatePassword && formData.accountSetupMethod === 'manual_setup' && !formData.password) {
      handleGeneratePassword()
    }
  }, [formData.generatePassword, formData.accountSetupMethod])

  const handleInputChange = (field: keyof EmployeeFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword()
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }))
    toast.success('New password generated!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced validation that matches backend requirements
    const validationErrors = validateEmployeeForm(formData)
    if (validationErrors.length > 0) {
      toast.error('Validation Failed', {
        description: validationErrors.join(', ')
      })
      return
    }

    try {
      setLoading(true)
      
      // Map form data to CreateEmployeeData type for backend consistency
      const employeeData: CreateEmployeeData = {
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
        departmentId: formData.departmentId || undefined,
        positionId: formData.positionId || undefined,
        managerId: formData.managerId && formData.managerId !== 'no-manager' ? formData.managerId : undefined,
        hireDate: formData.hireDate,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        skills: formData.skills,
        notes: formData.notes || undefined,
        sendInvitation: formData.accountSetupMethod === 'email_invitation' ? formData.sendInvitation : false,
        accountSetupMethod: formData.accountSetupMethod,
        password: formData.accountSetupMethod === 'manual_setup' ? formData.password : undefined
      }

      const response = await apiClient.createEmployee(employeeData)
      
      if (response.success) {
        toast.success('Employee created successfully!')
        if (response.data?.temporaryPassword) {
          toast.info(`Temporary password: ${response.data.temporaryPassword}`, {
            duration: 10000
          })
        } else if (formData.accountSetupMethod === 'manual_setup') {
          toast.info(`Employee can now login with the provided password`, {
            duration: 8000
          })
        }
        navigate('/dashboard/employees')
      } else {
        toast.error(response.message || 'Failed to create employee')
      }
    } catch (error) {
      console.error('Error creating employee:', error)
      toast.error('Failed to create employee. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/employees')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employees
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Employee</h1>
          <p className="text-muted-foreground mt-1">Create a new employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic personal details of the employee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Emergency contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Employment Details
            </CardTitle>
            <CardDescription>
              Job-related information and organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="Enter salary amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select value={formData.departmentId} onValueChange={(value) => handleInputChange('departmentId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <SelectItem value="loading-departments" disabled>Loading departments...</SelectItem>
                    ) : departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>No departments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionId">Position *</Label>
                <Select value={formData.positionId} onValueChange={(value) => handleInputChange('positionId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <SelectItem value="loading-positions" disabled>Loading positions...</SelectItem>
                    ) : positions.length > 0 ? (
                      positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-positions" disabled>No positions available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager (Optional)</Label>
                <Select value={formData.managerId} onValueChange={(value) => handleInputChange('managerId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No manager</SelectItem>
                    {loadingData ? (
                      <SelectItem value="loading-managers" disabled>Loading managers...</SelectItem>
                    ) : managers.length > 0 ? (
                      managers.map((mgr) => (
                        <SelectItem key={mgr.id} value={mgr.id}>
                          {mgr.fullName} ({mgr.employeeId})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Add relevant skills for this employee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Enter a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" onClick={handleAddSkill} variant="outline">
                Add
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Setup & Additional Information</CardTitle>
            <CardDescription>
              Configure account access and additional notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Setup Method */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Account Setup Method</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="email_invitation"
                    name="accountSetupMethod"
                    value="email_invitation"
                    checked={formData.accountSetupMethod === 'email_invitation'}
                    onChange={(e) => handleInputChange('accountSetupMethod', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <Label htmlFor="email_invitation" className="cursor-pointer">
                    Email Invitation (Recommended)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="manual_setup"
                    name="accountSetupMethod"
                    value="manual_setup"
                    checked={formData.accountSetupMethod === 'manual_setup'}
                    onChange={(e) => handleInputChange('accountSetupMethod', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <Label htmlFor="manual_setup" className="cursor-pointer">
                    Manual Setup (Set Password Now)
                  </Label>
                </div>
              </div>
              
              {/* Email Invitation Options */}
              {formData.accountSetupMethod === 'email_invitation' && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="sendInvitation"
                      checked={formData.sendInvitation}
                      onCheckedChange={(checked) => handleInputChange('sendInvitation', checked as boolean)}
                    />
                    <Label htmlFor="sendInvitation">
                      Send invitation email immediately
                    </Label>
                  </div>
                  <p className="text-sm text-blue-600">
                    Employee will receive an email with temporary login credentials and must set up their password on first login.
                  </p>
                </div>
              )}
              
              {/* Manual Setup Options */}
              {formData.accountSetupMethod === 'manual_setup' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
                  <p className="text-sm text-green-600 mb-3">
                    Set a password for the employee. They can login immediately with these credentials.
                  </p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="generatePassword"
                      checked={formData.generatePassword}
                      onCheckedChange={(checked) => {
                        handleInputChange('generatePassword', checked as boolean)
                        if (checked) {
                          handleGeneratePassword()
                        } else {
                          handleInputChange('password', '')
                        }
                      }}
                    />
                    <Label htmlFor="generatePassword">
                      Generate secure password automatically
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="text"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder={formData.generatePassword ? 'Password will be generated automatically' : 'Enter password (min 8 characters)'}
                        disabled={formData.generatePassword}
                        required={formData.accountSetupMethod === 'manual_setup'}
                        className={formData.generatePassword ? 'bg-gray-100' : ''}
                      />
                      {formData.generatePassword && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGeneratePassword}
                          className="whitespace-nowrap"
                        >
                          Regenerate
                        </Button>
                      )}
                    </div>
                    {formData.password && (
                      <p className="text-xs text-gray-600">
                        Password strength: {formData.password.length >= 12 ? 'Strong' : formData.password.length >= 8 ? 'Medium' : 'Weak'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes about this employee"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/employees')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Employee...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Employee
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddEmployeeForm