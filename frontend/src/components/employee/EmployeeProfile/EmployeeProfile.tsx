import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Select, Textarea, LoadingSpinner } from '../../common'
import { useAuth } from '../../../hooks/useAuth'
import { useApiCall } from '../../../hooks/useApiCall'
import { useToast } from '../../../hooks/useToast'
import './EmployeeProfile.css'

interface EmployeeProfileData {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  bio?: string
  skills?: string[]
  profilePicture?: string
  employeeId?: string
  departmentId?: string
  positionId?: string
  startDate?: string
  role: string
  profileComplete: boolean
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

const EmployeeProfile: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { apiCall } = useApiCall()
  const { showToast } = useToast()
  
  const [profile, setProfile] = useState<EmployeeProfileData | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'contact' | 'emergency' | 'work'>('personal')

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      
      const [profileResponse, departmentsResponse, positionsResponse] = await Promise.all([
        apiCall('/api/employees/profile', 'GET'),
        apiCall('/api/departments', 'GET'),
        apiCall('/api/positions', 'GET')
      ])
      
      setProfile(profileResponse.data)
      setDepartments(departmentsResponse.data)
      setPositions(positionsResponse.data)
    } catch (error: any) {
      showToast('error', error.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof EmployeeProfileData, value: string) => {
    if (!profile) return
    
    setProfile(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const handleSkillsChange = (skillsString: string) => {
    const skills = skillsString.split(',').map(skill => skill.trim()).filter(Boolean)
    handleInputChange('skills', skills as any)
  }

  const handleSave = async () => {
    if (!profile) return
    
    try {
      setSaving(true)
      
      const response = await apiCall('/api/employees/profile', 'PUT', profile)
      
      setProfile(response.data)
      await updateProfile(response.data)
      
      showToast('success', 'Profile updated successfully!')
    } catch (error: any) {
      showToast('error', error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getFilteredPositions = () => {
    if (!profile?.departmentId) return []
    return positions.filter(pos => pos.departmentId === profile.departmentId)
  }

  const calculateProfileCompletion = () => {
    if (!profile) return 0
    
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 
      'address', 'city', 'state', 'zipCode', 'country',
      'emergencyContactName', 'emergencyContactPhone'
    ]
    
    const completedFields = requiredFields.filter(field => 
      profile[field as keyof EmployeeProfileData]
    ).length
    
    return Math.round((completedFields / requiredFields.length) * 100)
  }

  if (loading) {
    return (
      <div className="employee-profile-loading">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="employee-profile-error">
        <p>Failed to load profile data</p>
        <Button onClick={loadProfileData}>Retry</Button>
      </div>
    )
  }

  const completionPercentage = calculateProfileCompletion()

  return (
    <div className="employee-profile">
      <div className="employee-profile-header">
        <div className="employee-profile-info">
          <div className="employee-profile-avatar">
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt={profile.fullName} />
            ) : (
              <div className="employee-profile-avatar-placeholder">
                {profile.firstName?.[0]}{profile.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="employee-profile-details">
            <h1>{profile.fullName}</h1>
            <p>{profile.role}</p>
            {profile.employeeId && <span className="employee-id">ID: {profile.employeeId}</span>}
          </div>
        </div>
        
        <div className="employee-profile-actions">
          <div className="profile-completion">
            <div className="profile-completion-bar">
              <div 
                className="profile-completion-fill" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span>{completionPercentage}% Complete</span>
          </div>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            loading={saving}
            disabled={saving}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="employee-profile-content">
        <div className="employee-profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`profile-tab ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            Contact Details
          </button>
          <button
            className={`profile-tab ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
          >
            Emergency Contact
          </button>
          <button
            className={`profile-tab ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            Work Information
          </button>
        </div>

        <Card className="employee-profile-form">
          {activeTab === 'personal' && (
            <div className="profile-form-section">
              <h2>Personal Information</h2>
              
              <div className="profile-form-row">
                <Input
                  label="First Name"
                  value={profile.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Last Name"
                  value={profile.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  fullWidth
                  required
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={profile.email}
                disabled
                fullWidth
                helperText="Email cannot be changed. Contact HR if needed."
              />

              <div className="profile-form-row">
                <Input
                  label="Phone Number"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  fullWidth
                />
              </div>

              <Textarea
                label="Bio"
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                fullWidth
              />

              <Input
                label="Skills"
                value={profile.skills?.join(', ') || ''}
                onChange={(e) => handleSkillsChange(e.target.value)}
                placeholder="JavaScript, React, Node.js, etc."
                helperText="Separate skills with commas"
                fullWidth
              />
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="profile-form-section">
              <h2>Contact Details</h2>
              
              <Input
                label="Address"
                value={profile.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                fullWidth
              />

              <div className="profile-form-row">
                <Input
                  label="City"
                  value={profile.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  fullWidth
                />
                <Input
                  label="State/Province"
                  value={profile.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  fullWidth
                />
              </div>

              <div className="profile-form-row">
                <Input
                  label="ZIP/Postal Code"
                  value={profile.zipCode || ''}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Country"
                  value={profile.country || ''}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  fullWidth
                />
              </div>
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="profile-form-section">
              <h2>Emergency Contact</h2>
              
              <Input
                label="Contact Name"
                value={profile.emergencyContactName || ''}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                fullWidth
                required
              />

              <div className="profile-form-row">
                <Input
                  label="Contact Phone"
                  type="tel"
                  value={profile.emergencyContactPhone || ''}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  fullWidth
                  required
                />
                <Input
                  label="Relationship"
                  value={profile.emergencyContactRelation || ''}
                  onChange={(e) => handleInputChange('emergencyContactRelation', e.target.value)}
                  placeholder="e.g., Spouse, Parent, Sibling"
                  fullWidth
                />
              </div>
            </div>
          )}

          {activeTab === 'work' && (
            <div className="profile-form-section">
              <h2>Work Information</h2>
              
              <div className="profile-form-row">
                <Input
                  label="Employee ID"
                  value={profile.employeeId || ''}
                  disabled
                  fullWidth
                  helperText="Assigned by HR"
                />
                <Input
                  label="Start Date"
                  type="date"
                  value={profile.startDate || ''}
                  disabled
                  fullWidth
                  helperText="Set by HR"
                />
              </div>

              <div className="profile-form-row">
                <Select
                  label="Department"
                  value={profile.departmentId || ''}
                  onChange={(e) => {
                    handleInputChange('departmentId', e.target.value)
                    handleInputChange('positionId', '') // Reset position when department changes
                  }}
                  options={[
                    { value: '', label: 'Select Department' },
                    ...departments.map(dept => ({ value: dept.id, label: dept.name }))
                  ]}
                  fullWidth
                  disabled
                  helperText="Contact HR to change department"
                />
                <Select
                  label="Position"
                  value={profile.positionId || ''}
                  onChange={(e) => handleInputChange('positionId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Position' },
                    ...getFilteredPositions().map(pos => ({ value: pos.id, label: pos.title }))
                  ]}
                  fullWidth
                  disabled
                  helperText="Contact HR to change position"
                />
              </div>

              <Input
                label="Role"
                value={profile.role}
                disabled
                fullWidth
                helperText="Role is managed by HR"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default EmployeeProfile