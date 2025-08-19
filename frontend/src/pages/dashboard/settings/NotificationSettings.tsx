import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  AlertTriangle,
  UserX,
  Timer,
  Calendar,
  Settings,
  Save,
  RefreshCw,
  Volume2,
  VolumeX,
  Info,
  CheckCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface NotificationSettings {
  id: string
  email_notifications_enabled: boolean
  push_notifications_enabled: boolean
  sms_notifications_enabled: boolean
  late_arrival_notifications: boolean
  late_arrival_threshold_minutes: number
  missed_checkout_notifications: boolean
  missed_checkout_threshold_hours: number
  overtime_notifications: boolean
  overtime_threshold_minutes: number
  absence_notifications: boolean
  break_overtime_notifications: boolean
  break_overtime_threshold_minutes: number
  daily_summary_enabled: boolean
  daily_summary_time: string
  weekly_summary_enabled: boolean
  weekly_summary_day: string
  weekly_summary_time: string
  notification_recipients: string[]
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  created_at: string
  updated_at: string
}

interface SettingsFormData {
  email_notifications_enabled: boolean
  push_notifications_enabled: boolean
  sms_notifications_enabled: boolean
  late_arrival_notifications: boolean
  late_arrival_threshold_minutes: string
  missed_checkout_notifications: boolean
  missed_checkout_threshold_hours: string
  overtime_notifications: boolean
  overtime_threshold_minutes: string
  absence_notifications: boolean
  break_overtime_notifications: boolean
  break_overtime_threshold_minutes: string
  daily_summary_enabled: boolean
  daily_summary_time: string
  weekly_summary_enabled: boolean
  weekly_summary_day: string
  weekly_summary_time: string
  notification_recipients: string
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
}

const NotificationSettings = () => {
  const [formData, setFormData] = useState<SettingsFormData>({
    email_notifications_enabled: true,
    push_notifications_enabled: true,
    sms_notifications_enabled: false,
    late_arrival_notifications: true,
    late_arrival_threshold_minutes: '15',
    missed_checkout_notifications: true,
    missed_checkout_threshold_hours: '2',
    overtime_notifications: true,
    overtime_threshold_minutes: '480',
    absence_notifications: true,
    break_overtime_notifications: true,
    break_overtime_threshold_minutes: '90',
    daily_summary_enabled: true,
    daily_summary_time: '18:00',
    weekly_summary_enabled: true,
    weekly_summary_day: 'friday',
    weekly_summary_time: '17:00',
    notification_recipients: '',
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  })

  const queryClient = useQueryClient()

  // Fetch notification settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notification-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch notification settings')
      return response.json()
    },
    onSuccess: (data) => {
      if (data?.data?.settings) {
        const settings = data.data.settings
        setFormData({
          email_notifications_enabled: settings.email_notifications_enabled,
          push_notifications_enabled: settings.push_notifications_enabled,
          sms_notifications_enabled: settings.sms_notifications_enabled,
          late_arrival_notifications: settings.late_arrival_notifications,
          late_arrival_threshold_minutes: settings.late_arrival_threshold_minutes.toString(),
          missed_checkout_notifications: settings.missed_checkout_notifications,
          missed_checkout_threshold_hours: settings.missed_checkout_threshold_hours.toString(),
          overtime_notifications: settings.overtime_notifications,
          overtime_threshold_minutes: settings.overtime_threshold_minutes.toString(),
          absence_notifications: settings.absence_notifications,
          break_overtime_notifications: settings.break_overtime_notifications,
          break_overtime_threshold_minutes: settings.break_overtime_threshold_minutes.toString(),
          daily_summary_enabled: settings.daily_summary_enabled,
          daily_summary_time: settings.daily_summary_time,
          weekly_summary_enabled: settings.weekly_summary_enabled,
          weekly_summary_day: settings.weekly_summary_day,
          weekly_summary_time: settings.weekly_summary_time,
          notification_recipients: settings.notification_recipients.join(', '),
          quiet_hours_enabled: settings.quiet_hours_enabled,
          quiet_hours_start: settings.quiet_hours_start,
          quiet_hours_end: settings.quiet_hours_end
        })
      }
    }
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch('/api/settings/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email_notifications_enabled: data.email_notifications_enabled,
          push_notifications_enabled: data.push_notifications_enabled,
          sms_notifications_enabled: data.sms_notifications_enabled,
          late_arrival_notifications: data.late_arrival_notifications,
          late_arrival_threshold_minutes: parseInt(data.late_arrival_threshold_minutes),
          missed_checkout_notifications: data.missed_checkout_notifications,
          missed_checkout_threshold_hours: parseInt(data.missed_checkout_threshold_hours),
          overtime_notifications: data.overtime_notifications,
          overtime_threshold_minutes: parseInt(data.overtime_threshold_minutes),
          absence_notifications: data.absence_notifications,
          break_overtime_notifications: data.break_overtime_notifications,
          break_overtime_threshold_minutes: parseInt(data.break_overtime_threshold_minutes),
          daily_summary_enabled: data.daily_summary_enabled,
          daily_summary_time: data.daily_summary_time,
          weekly_summary_enabled: data.weekly_summary_enabled,
          weekly_summary_day: data.weekly_summary_day,
          weekly_summary_time: data.weekly_summary_time,
          notification_recipients: data.notification_recipients.split(',').map(s => s.trim()).filter(s => s),
          quiet_hours_enabled: data.quiet_hours_enabled,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update notification settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
      toast.success('Notification settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const lateThreshold = parseInt(formData.late_arrival_threshold_minutes)
    const missedThreshold = parseInt(formData.missed_checkout_threshold_hours)
    const overtimeThreshold = parseInt(formData.overtime_threshold_minutes)
    const breakThreshold = parseInt(formData.break_overtime_threshold_minutes)

    if (isNaN(lateThreshold) || lateThreshold < 1 || lateThreshold > 120) {
      toast.error('Late arrival threshold must be between 1 and 120 minutes')
      return
    }

    if (isNaN(missedThreshold) || missedThreshold < 1 || missedThreshold > 24) {
      toast.error('Missed checkout threshold must be between 1 and 24 hours')
      return
    }

    if (isNaN(overtimeThreshold) || overtimeThreshold < 1) {
      toast.error('Overtime threshold must be a positive number')
      return
    }

    if (isNaN(breakThreshold) || breakThreshold < 1 || breakThreshold > 480) {
      toast.error('Break overtime threshold must be between 1 and 480 minutes')
      return
    }

    updateSettingsMutation.mutate(formData)
  }

  const handleReset = () => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings
      setFormData({
        email_notifications_enabled: settings.email_notifications_enabled,
        push_notifications_enabled: settings.push_notifications_enabled,
        sms_notifications_enabled: settings.sms_notifications_enabled,
        late_arrival_notifications: settings.late_arrival_notifications,
        late_arrival_threshold_minutes: settings.late_arrival_threshold_minutes.toString(),
        missed_checkout_notifications: settings.missed_checkout_notifications,
        missed_checkout_threshold_hours: settings.missed_checkout_threshold_hours.toString(),
        overtime_notifications: settings.overtime_notifications,
        overtime_threshold_minutes: settings.overtime_threshold_minutes.toString(),
        absence_notifications: settings.absence_notifications,
        break_overtime_notifications: settings.break_overtime_notifications,
        break_overtime_threshold_minutes: settings.break_overtime_threshold_minutes.toString(),
        daily_summary_enabled: settings.daily_summary_enabled,
        daily_summary_time: settings.daily_summary_time,
        weekly_summary_enabled: settings.weekly_summary_enabled,
        weekly_summary_day: settings.weekly_summary_day,
        weekly_summary_time: settings.weekly_summary_time,
        notification_recipients: settings.notification_recipients.join(', '),
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end
      })
      toast.info('Settings reset to saved values')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notification Settings</h2>
          <p className="text-muted-foreground">
            Configure attendance alerts, reminders, and notification preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={handleReset}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Channels</span>
            </CardTitle>
            <CardDescription>
              Choose how you want to receive attendance notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <span className="font-medium">Email</span>
                    <p className="text-sm text-muted-foreground">Email notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.email_notifications_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_notifications_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-medium">Push</span>
                    <p className="text-sm text-muted-foreground">Mobile push notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.push_notifications_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, push_notifications_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <div>
                    <span className="font-medium">SMS</span>
                    <p className="text-sm text-muted-foreground">Text message alerts</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.sms_notifications_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, sms_notifications_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Additional Recipients</Label>
              <Input
                id="recipients"
                value={formData.notification_recipients}
                onChange={(e) => setFormData(prev => ({ ...prev, notification_recipients: e.target.value }))}
                placeholder="admin@company.com, hr@company.com (comma separated)"
              />
              <p className="text-xs text-muted-foreground">
                Additional email addresses to receive notifications
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Attendance Alerts</span>
            </CardTitle>
            <CardDescription>
              Configure alerts for attendance violations and issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Late Arrival */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Late Arrival Alerts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notify when employees arrive late
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.late_arrival_notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, late_arrival_notifications: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.late_arrival_notifications && (
                <div className="space-y-2">
                  <Label htmlFor="late_threshold">Late Arrival Threshold (minutes)</Label>
                  <Input
                    id="late_threshold"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.late_arrival_threshold_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, late_arrival_threshold_minutes: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Missed Checkout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Missed Checkout Alerts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notify when employees forget to check out
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.missed_checkout_notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, missed_checkout_notifications: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.missed_checkout_notifications && (
                <div className="space-y-2">
                  <Label htmlFor="missed_threshold">Missed Checkout Threshold (hours)</Label>
                  <Input
                    id="missed_threshold"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.missed_checkout_threshold_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, missed_checkout_threshold_hours: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Overtime */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Overtime Alerts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notify when employees work overtime
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.overtime_notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, overtime_notifications: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.overtime_notifications && (
                <div className="space-y-2">
                  <Label htmlFor="overtime_threshold">Overtime Threshold (minutes)</Label>
                  <Input
                    id="overtime_threshold"
                    type="number"
                    min="1"
                    value={formData.overtime_threshold_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, overtime_threshold_minutes: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Absence */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Absence Alerts</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Notify when employees are absent without notice
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.absence_notifications}
                onChange={(e) => setFormData(prev => ({ ...prev, absence_notifications: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            {/* Break Overtime */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Extended Break Alerts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notify when break time exceeds limit
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.break_overtime_notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, break_overtime_notifications: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.break_overtime_notifications && (
                <div className="space-y-2">
                  <Label htmlFor="break_threshold">Break Overtime Threshold (minutes)</Label>
                  <Input
                    id="break_threshold"
                    type="number"
                    min="1"
                    max="480"
                    value={formData.break_overtime_threshold_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, break_overtime_threshold_minutes: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Summary Reports</span>
            </CardTitle>
            <CardDescription>
              Configure automated attendance summary reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <span className="font-medium">Daily Summary</span>
                  <p className="text-sm text-muted-foreground">
                    Send daily attendance summary
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.daily_summary_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_summary_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.daily_summary_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="daily_time">Daily Summary Time</Label>
                  <Input
                    id="daily_time"
                    type="time"
                    value={formData.daily_summary_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_summary_time: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Weekly Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <span className="font-medium">Weekly Summary</span>
                  <p className="text-sm text-muted-foreground">
                    Send weekly attendance summary
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.weekly_summary_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekly_summary_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.weekly_summary_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weekly_day">Day of Week</Label>
                    <select
                      id="weekly_day"
                      value={formData.weekly_summary_day}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekly_summary_day: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekly_time">Time</Label>
                    <Input
                      id="weekly_time"
                      type="time"
                      value={formData.weekly_summary_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, weekly_summary_time: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <VolumeX className="h-5 w-5" />
              <span>Quiet Hours</span>
            </CardTitle>
            <CardDescription>
              Configure quiet hours when notifications are suppressed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Enable Quiet Hours</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Suppress non-urgent notifications during specified hours
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.quiet_hours_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            {formData.quiet_hours_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet_start">Start Time</Label>
                  <Input
                    id="quiet_start"
                    type="time"
                    value={formData.quiet_hours_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet_end">End Time</Label>
                  <Input
                    id="quiet_end"
                    type="time"
                    value={formData.quiet_hours_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {formData.quiet_hours_enabled && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Critical alerts (security issues, system failures) will still be sent during quiet hours
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default NotificationSettings