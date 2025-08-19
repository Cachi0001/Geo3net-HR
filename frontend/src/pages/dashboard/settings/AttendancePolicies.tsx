import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Coffee,
  Timer,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  Settings,
  Save,
  X
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface AttendancePolicy {
  id: string
  name: string
  work_hours_per_day: number
  work_days_per_week: number
  start_time: string
  end_time: string
  break_duration_minutes: number
  late_arrival_threshold_minutes: number
  overtime_threshold_minutes: number
  is_flexible_hours: boolean
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface PolicyFormData {
  name: string
  work_hours_per_day: string
  work_days_per_week: string
  start_time: string
  end_time: string
  break_duration_minutes: string
  late_arrival_threshold_minutes: string
  overtime_threshold_minutes: string
  is_flexible_hours: boolean
}

const AttendancePolicies = () => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null)
  const [formData, setFormData] = useState<PolicyFormData>({
    name: '',
    work_hours_per_day: '8',
    work_days_per_week: '5',
    start_time: '09:00',
    end_time: '17:00',
    break_duration_minutes: '60',
    late_arrival_threshold_minutes: '15',
    overtime_threshold_minutes: '480',
    is_flexible_hours: false
  })

  const queryClient = useQueryClient()

  // Fetch attendance policies
  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['attendance-policies'],
    queryFn: async () => {
      const response = await fetch('/api/settings/attendance-policies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch attendance policies')
      return response.json()
    }
  })

  // Create policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (data: PolicyFormData) => {
      const response = await fetch('/api/settings/attendance-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          work_hours_per_day: parseFloat(data.work_hours_per_day),
          work_days_per_week: parseInt(data.work_days_per_week),
          start_time: data.start_time,
          end_time: data.end_time,
          break_duration_minutes: parseInt(data.break_duration_minutes),
          late_arrival_threshold_minutes: parseInt(data.late_arrival_threshold_minutes),
          overtime_threshold_minutes: parseInt(data.overtime_threshold_minutes),
          is_flexible_hours: data.is_flexible_hours
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create attendance policy')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      setShowAddForm(false)
      resetForm()
      toast.success('Attendance policy created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: PolicyFormData }) => {
      const response = await fetch(`/api/settings/attendance-policies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          work_hours_per_day: parseFloat(data.work_hours_per_day),
          work_days_per_week: parseInt(data.work_days_per_week),
          start_time: data.start_time,
          end_time: data.end_time,
          break_duration_minutes: parseInt(data.break_duration_minutes),
          late_arrival_threshold_minutes: parseInt(data.late_arrival_threshold_minutes),
          overtime_threshold_minutes: parseInt(data.overtime_threshold_minutes),
          is_flexible_hours: data.is_flexible_hours
        })
      })
      if (!response.ok) throw new Error('Failed to update attendance policy')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      setEditingPolicy(null)
      resetForm()
      toast.success('Attendance policy updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Delete policy mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/settings/attendance-policies/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to delete attendance policy')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Attendance policy deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  // Set default policy mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/settings/attendance-policies/${id}/set-default`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to set default policy')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-policies'] })
      toast.success('Default attendance policy updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      work_hours_per_day: '8',
      work_days_per_week: '5',
      start_time: '09:00',
      end_time: '17:00',
      break_duration_minutes: '60',
      late_arrival_threshold_minutes: '15',
      overtime_threshold_minutes: '480',
      is_flexible_hours: false
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    const workHours = parseFloat(formData.work_hours_per_day)
    const workDays = parseInt(formData.work_days_per_week)
    const breakDuration = parseInt(formData.break_duration_minutes)
    const lateThreshold = parseInt(formData.late_arrival_threshold_minutes)
    const overtimeThreshold = parseInt(formData.overtime_threshold_minutes)

    if (isNaN(workHours) || workHours < 1 || workHours > 24) {
      toast.error('Work hours per day must be between 1 and 24')
      return
    }

    if (isNaN(workDays) || workDays < 1 || workDays > 7) {
      toast.error('Work days per week must be between 1 and 7')
      return
    }

    if (isNaN(breakDuration) || breakDuration < 0 || breakDuration > 480) {
      toast.error('Break duration must be between 0 and 480 minutes')
      return
    }

    if (isNaN(lateThreshold) || lateThreshold < 0 || lateThreshold > 120) {
      toast.error('Late arrival threshold must be between 0 and 120 minutes')
      return
    }

    if (isNaN(overtimeThreshold) || overtimeThreshold < 0) {
      toast.error('Overtime threshold must be a positive number')
      return
    }

    if (editingPolicy) {
      updatePolicyMutation.mutate({ id: editingPolicy.id, data: formData })
    } else {
      createPolicyMutation.mutate(formData)
    }
  }

  const handleEdit = (policy: AttendancePolicy) => {
    setEditingPolicy(policy)
    setFormData({
      name: policy.name,
      work_hours_per_day: policy.work_hours_per_day.toString(),
      work_days_per_week: policy.work_days_per_week.toString(),
      start_time: policy.start_time,
      end_time: policy.end_time,
      break_duration_minutes: policy.break_duration_minutes.toString(),
      late_arrival_threshold_minutes: policy.late_arrival_threshold_minutes.toString(),
      overtime_threshold_minutes: policy.overtime_threshold_minutes.toString(),
      is_flexible_hours: policy.is_flexible_hours
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingPolicy(null)
    resetForm()
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const policies = policiesData?.data?.policies || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Policies</h2>
          <p className="text-muted-foreground">
            Configure work hours, break times, and overtime rules for different employee groups
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Policy</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPolicy ? 'Edit Attendance Policy' : 'Add New Attendance Policy'}
            </CardTitle>
            <CardDescription>
              Define work schedules, break times, and attendance rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Policy Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Standard Office Hours, Flexible Schedule"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flexible">Schedule Type</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="flexible"
                        checked={formData.is_flexible_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_flexible_hours: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="flexible" className="text-sm font-normal">
                        Flexible working hours
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Work Schedule</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="work_hours">Hours per Day *</Label>
                    <Input
                      id="work_hours"
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={formData.work_hours_per_day}
                      onChange={(e) => setFormData(prev => ({ ...prev, work_hours_per_day: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work_days">Days per Week *</Label>
                    <Input
                      id="work_days"
                      type="number"
                      min="1"
                      max="7"
                      value={formData.work_days_per_week}
                      onChange={(e) => setFormData(prev => ({ ...prev, work_days_per_week: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Break and Overtime Rules */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Coffee className="h-5 w-5" />
                  <span>Break & Overtime Rules</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                    <Input
                      id="break_duration"
                      type="number"
                      min="0"
                      max="480"
                      value={formData.break_duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, break_duration_minutes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="late_threshold">Late Arrival Threshold (minutes)</Label>
                    <Input
                      id="late_threshold"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.late_arrival_threshold_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, late_arrival_threshold_minutes: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overtime_threshold">Overtime Threshold (minutes)</Label>
                    <Input
                      id="overtime_threshold"
                      type="number"
                      min="0"
                      value={formData.overtime_threshold_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, overtime_threshold_minutes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingPolicy ? 'Update Policy' : 'Create Policy'}</span>
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : policies.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No attendance policies found</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first attendance policy to define work schedules and rules.
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Policy
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          policies.map((policy: AttendancePolicy) => (
            <Card key={policy.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{policy.name}</h3>
                    {policy.is_default && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(policy)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePolicyMutation.mutate(policy.id)}
                      disabled={policy.is_default}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Work Schedule */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Work Schedule</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(policy.start_time)} - {formatTime(policy.end_time)}
                    </div>
                  </div>

                  {/* Work Hours */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hours/Day:</span>
                      <span className="font-medium">{policy.work_hours_per_day}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Days/Week:</span>
                      <span className="font-medium">{policy.work_days_per_week}</span>
                    </div>
                  </div>

                  {/* Break and Rules */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Coffee className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Break:</span>
                      </div>
                      <span className="font-medium">{policy.break_duration_minutes}min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Late threshold:</span>
                      </div>
                      <span className="font-medium">{policy.late_arrival_threshold_minutes}min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Overtime:</span>
                      </div>
                      <span className="font-medium">{Math.floor(policy.overtime_threshold_minutes / 60)}h {policy.overtime_threshold_minutes % 60}min</span>
                    </div>
                  </div>

                  {/* Flexible Hours Badge */}
                  {policy.is_flexible_hours && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      Flexible Hours
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${
                      policy.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-muted-foreground">
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {!policy.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDefaultMutation.mutate(policy.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Set Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default AttendancePolicies