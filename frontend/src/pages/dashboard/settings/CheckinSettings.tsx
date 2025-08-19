import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MapPin, 
  Smartphone, 
  Shield, 
  Clock, 
  Camera,
  Wifi,
  Navigation,
  Settings,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface CheckinSettings {
  id: string
  require_gps_verification: boolean
  gps_accuracy_threshold_meters: number
  allow_manual_checkin: boolean
  require_photo_verification: boolean
  allow_wifi_checkin: boolean
  wifi_networks: string[]
  checkin_reminder_enabled: boolean
  checkin_reminder_time: string
  checkout_reminder_enabled: boolean
  checkout_reminder_time: string
  auto_checkout_enabled: boolean
  auto_checkout_time: string
  break_tracking_enabled: boolean
  max_break_duration_minutes: number
  offline_checkin_enabled: boolean
  offline_sync_interval_minutes: number
  created_at: string
  updated_at: string
}

interface SettingsFormData {
  require_gps_verification: boolean
  gps_accuracy_threshold_meters: string
  allow_manual_checkin: boolean
  require_photo_verification: boolean
  allow_wifi_checkin: boolean
  wifi_networks: string
  checkin_reminder_enabled: boolean
  checkin_reminder_time: string
  checkout_reminder_enabled: boolean
  checkout_reminder_time: string
  auto_checkout_enabled: boolean
  auto_checkout_time: string
  break_tracking_enabled: boolean
  max_break_duration_minutes: string
  offline_checkin_enabled: boolean
  offline_sync_interval_minutes: string
}

const CheckinSettings = () => {
  const [formData, setFormData] = useState<SettingsFormData>({
    require_gps_verification: true,
    gps_accuracy_threshold_meters: '50',
    allow_manual_checkin: false,
    require_photo_verification: false,
    allow_wifi_checkin: true,
    wifi_networks: '',
    checkin_reminder_enabled: true,
    checkin_reminder_time: '09:00',
    checkout_reminder_enabled: true,
    checkout_reminder_time: '17:00',
    auto_checkout_enabled: false,
    auto_checkout_time: '18:00',
    break_tracking_enabled: true,
    max_break_duration_minutes: '60',
    offline_checkin_enabled: true,
    offline_sync_interval_minutes: '15'
  })

  const queryClient = useQueryClient()

  // Fetch checkin settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['checkin-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/checkin-settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch checkin settings')
      return response.json()
    },
    onSuccess: (data) => {
      if (data?.data?.settings) {
        const settings = data.data.settings
        setFormData({
          require_gps_verification: settings.require_gps_verification,
          gps_accuracy_threshold_meters: settings.gps_accuracy_threshold_meters.toString(),
          allow_manual_checkin: settings.allow_manual_checkin,
          require_photo_verification: settings.require_photo_verification,
          allow_wifi_checkin: settings.allow_wifi_checkin,
          wifi_networks: settings.wifi_networks.join(', '),
          checkin_reminder_enabled: settings.checkin_reminder_enabled,
          checkin_reminder_time: settings.checkin_reminder_time,
          checkout_reminder_enabled: settings.checkout_reminder_enabled,
          checkout_reminder_time: settings.checkout_reminder_time,
          auto_checkout_enabled: settings.auto_checkout_enabled,
          auto_checkout_time: settings.auto_checkout_time,
          break_tracking_enabled: settings.break_tracking_enabled,
          max_break_duration_minutes: settings.max_break_duration_minutes.toString(),
          offline_checkin_enabled: settings.offline_checkin_enabled,
          offline_sync_interval_minutes: settings.offline_sync_interval_minutes.toString()
        })
      }
    }
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const response = await fetch('/api/settings/checkin-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          require_gps_verification: data.require_gps_verification,
          gps_accuracy_threshold_meters: parseInt(data.gps_accuracy_threshold_meters),
          allow_manual_checkin: data.allow_manual_checkin,
          require_photo_verification: data.require_photo_verification,
          allow_wifi_checkin: data.allow_wifi_checkin,
          wifi_networks: data.wifi_networks.split(',').map(s => s.trim()).filter(s => s),
          checkin_reminder_enabled: data.checkin_reminder_enabled,
          checkin_reminder_time: data.checkin_reminder_time,
          checkout_reminder_enabled: data.checkout_reminder_enabled,
          checkout_reminder_time: data.checkout_reminder_time,
          auto_checkout_enabled: data.auto_checkout_enabled,
          auto_checkout_time: data.auto_checkout_time,
          break_tracking_enabled: data.break_tracking_enabled,
          max_break_duration_minutes: parseInt(data.max_break_duration_minutes),
          offline_checkin_enabled: data.offline_checkin_enabled,
          offline_sync_interval_minutes: parseInt(data.offline_sync_interval_minutes)
        })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update checkin settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-settings'] })
      toast.success('Check-in settings updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    const accuracy = parseInt(formData.gps_accuracy_threshold_meters)
    const breakDuration = parseInt(formData.max_break_duration_minutes)
    const syncInterval = parseInt(formData.offline_sync_interval_minutes)

    if (isNaN(accuracy) || accuracy < 5 || accuracy > 1000) {
      toast.error('GPS accuracy threshold must be between 5 and 1000 meters')
      return
    }

    if (isNaN(breakDuration) || breakDuration < 5 || breakDuration > 480) {
      toast.error('Max break duration must be between 5 and 480 minutes')
      return
    }

    if (isNaN(syncInterval) || syncInterval < 1 || syncInterval > 60) {
      toast.error('Sync interval must be between 1 and 60 minutes')
      return
    }

    updateSettingsMutation.mutate(formData)
  }

  const handleReset = () => {
    if (settingsData?.data?.settings) {
      const settings = settingsData.data.settings
      setFormData({
        require_gps_verification: settings.require_gps_verification,
        gps_accuracy_threshold_meters: settings.gps_accuracy_threshold_meters.toString(),
        allow_manual_checkin: settings.allow_manual_checkin,
        require_photo_verification: settings.require_photo_verification,
        allow_wifi_checkin: settings.allow_wifi_checkin,
        wifi_networks: settings.wifi_networks.join(', '),
        checkin_reminder_enabled: settings.checkin_reminder_enabled,
        checkin_reminder_time: settings.checkin_reminder_time,
        checkout_reminder_enabled: settings.checkout_reminder_enabled,
        checkout_reminder_time: settings.checkout_reminder_time,
        auto_checkout_enabled: settings.auto_checkout_enabled,
        auto_checkout_time: settings.auto_checkout_time,
        break_tracking_enabled: settings.break_tracking_enabled,
        max_break_duration_minutes: settings.max_break_duration_minutes.toString(),
        offline_checkin_enabled: settings.offline_checkin_enabled,
        offline_sync_interval_minutes: settings.offline_sync_interval_minutes.toString()
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
          <h2 className="text-2xl font-bold tracking-tight">Check-in Settings</h2>
          <p className="text-muted-foreground">
            Configure check-in/out verification methods, reminders, and tracking options
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
        {/* Location Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Location Verification</span>
            </CardTitle>
            <CardDescription>
              Configure GPS and location-based check-in verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Require GPS Verification</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Employees must be within the defined location radius to check in
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.require_gps_verification}
                onChange={(e) => setFormData(prev => ({ ...prev, require_gps_verification: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gps_accuracy">GPS Accuracy Threshold (meters)</Label>
                <Input
                  id="gps_accuracy"
                  type="number"
                  min="5"
                  max="1000"
                  value={formData.gps_accuracy_threshold_meters}
                  onChange={(e) => setFormData(prev => ({ ...prev, gps_accuracy_threshold_meters: e.target.value }))}
                  disabled={!formData.require_gps_verification}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values require more precise location (5-1000m)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wifi_networks">Trusted WiFi Networks</Label>
                <Input
                  id="wifi_networks"
                  value={formData.wifi_networks}
                  onChange={(e) => setFormData(prev => ({ ...prev, wifi_networks: e.target.value }))}
                  placeholder="Office WiFi, Guest Network (comma separated)"
                />
                <p className="text-xs text-muted-foreground">
                  Allow check-in when connected to these networks
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Allow WiFi-based Check-in</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable check-in when connected to trusted WiFi networks
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allow_wifi_checkin}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_wifi_checkin: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Allow Manual Check-in</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow employees to check in without location verification
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.allow_manual_checkin}
                onChange={(e) => setFormData(prev => ({ ...prev, allow_manual_checkin: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Verification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security & Verification</span>
            </CardTitle>
            <CardDescription>
              Additional security measures for check-in verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Require Photo Verification</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Employees must take a photo when checking in/out
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.require_photo_verification}
                onChange={(e) => setFormData(prev => ({ ...prev, require_photo_verification: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Enable Offline Check-in</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow check-in when device is offline (syncs when online)
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.offline_checkin_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, offline_checkin_enabled: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            {formData.offline_checkin_enabled && (
              <div className="space-y-2">
                <Label htmlFor="sync_interval">Offline Sync Interval (minutes)</Label>
                <Input
                  id="sync_interval"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.offline_sync_interval_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, offline_sync_interval_minutes: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  How often to sync offline check-ins when connection is restored
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reminders & Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Reminders & Automation</span>
            </CardTitle>
            <CardDescription>
              Configure automatic reminders and check-out settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-in Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <span className="font-medium">Check-in Reminders</span>
                    <p className="text-sm text-muted-foreground">
                      Send reminders to check in
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.checkin_reminder_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkin_reminder_enabled: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                </div>
                {formData.checkin_reminder_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="checkin_time">Reminder Time</Label>
                    <Input
                      id="checkin_time"
                      type="time"
                      value={formData.checkin_reminder_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkin_reminder_time: e.target.value }))}
                    />
                  </div>
                )}
              </div>

              {/* Check-out Reminders */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <span className="font-medium">Check-out Reminders</span>
                    <p className="text-sm text-muted-foreground">
                      Send reminders to check out
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.checkout_reminder_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkout_reminder_enabled: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                </div>
                {formData.checkout_reminder_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="checkout_time">Reminder Time</Label>
                    <Input
                      id="checkout_time"
                      type="time"
                      value={formData.checkout_reminder_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkout_reminder_time: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Auto Check-out */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Automatic Check-out</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically check out employees at a specific time
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.auto_checkout_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, auto_checkout_enabled: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.auto_checkout_enabled && (
                <div className="space-y-2">
                  <Label htmlFor="auto_checkout_time">Auto Check-out Time</Label>
                  <Input
                    id="auto_checkout_time"
                    type="time"
                    value={formData.auto_checkout_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_checkout_time: e.target.value }))}
                  />
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Employees who haven't checked out will be automatically checked out at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Break Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Break Tracking</span>
            </CardTitle>
            <CardDescription>
              Configure break time tracking and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <span className="font-medium">Enable Break Tracking</span>
                <p className="text-sm text-muted-foreground">
                  Allow employees to track break times
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.break_tracking_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, break_tracking_enabled: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            {formData.break_tracking_enabled && (
              <div className="space-y-2">
                <Label htmlFor="max_break_duration">Maximum Break Duration (minutes)</Label>
                <Input
                  id="max_break_duration"
                  type="number"
                  min="5"
                  max="480"
                  value={formData.max_break_duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_break_duration_minutes: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum allowed break duration per session (5-480 minutes)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default CheckinSettings