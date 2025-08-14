import React, { useState, useEffect } from 'react'
import { Card, Button, Switch } from '../../common'
import { useTaskNotifications } from '../../../hooks/useTaskNotifications'
import { useToast } from '../../../hooks/useToast'
import { apiService } from '../../../services/api.service'
import './NotificationSettings.css'

interface NotificationPreferences {
  taskAssignments: boolean
  taskStatusChanges: boolean
  taskComments: boolean
  dueDateReminders: boolean
  bulkAssignments: boolean
  priorityChanges: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  reminderFrequency: 'immediate' | 'hourly' | 'daily'
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

const NotificationSettings: React.FC = () => {
  const { showToast } = useToast()
  const {
    isEnabled,
    hasPermission,
    isSubscribed,
    enableNotifications,
    disableNotifications,
    testNotification
  } = useTaskNotifications()

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    taskAssignments: true,
    taskStatusChanges: true,
    taskComments: true,
    dueDateReminders: true,
    bulkAssignments: true,
    priorityChanges: true,
    emailNotifications: true,
    pushNotifications: true,
    reminderFrequency: 'immediate',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.get('/notifications/preferences')
      if (response.data) {
        setPreferences(prev => ({ ...prev, ...response.data }))
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
      // Use default preferences if loading fails
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setIsSaving(true)
      await apiService.put('/notifications/preferences', preferences)
      showToast('success', 'Notification preferences saved successfully')
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
      showToast('error', 'Failed to save notification preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleQuietHoursChange = (key: keyof NotificationPreferences['quietHours'], value: any) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value
      }
    }))
  }

  const handleEnablePushNotifications = async () => {
    try {
      await enableNotifications()
      handlePreferenceChange('pushNotifications', true)
    } catch (error) {
      handlePreferenceChange('pushNotifications', false)
    }
  }

  const handleDisablePushNotifications = async () => {
    try {
      await disableNotifications()
      handlePreferenceChange('pushNotifications', false)
    } catch (error) {
      console.error('Failed to disable push notifications:', error)
    }
  }

  if (isLoading) {
    return (
      <Card className="notification-settings loading" padding="lg">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Loading notification settings...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="notification-settings">
      <Card className="settings-section" padding="lg">
        <div className="section-header">
          <h2>Notification Settings</h2>
          <p>Customize how and when you receive notifications about tasks and activities.</p>
        </div>

        {/* Push Notifications */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Push Notifications</h3>
            <p>Real-time browser notifications for immediate updates</p>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Enable Push Notifications</label>
              <span className="setting-description">
                Receive instant notifications in your browser
              </span>
            </div>
            <div className="setting-control">
              {!hasPermission ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnablePushNotifications}
                  className="permission-btn"
                >
                  Grant Permission
                </Button>
              ) : (
                <Switch
                  checked={isEnabled && preferences.pushNotifications}
                  onChange={(checked) => {
                    if (checked) {
                      handleEnablePushNotifications()
                    } else {
                      handleDisablePushNotifications()
                    }
                  }}
                  disabled={!hasPermission}
                />
              )}
            </div>
          </div>

          {hasPermission && (
            <div className="setting-item">
              <div className="setting-info">
                <label>Test Notifications</label>
                <span className="setting-description">
                  Send a test notification to verify everything is working
                </span>
              </div>
              <div className="setting-control">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={testNotification}
                  disabled={!isEnabled}
                >
                  Send Test
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Types */}
        <div className="settings-group">
          <div className="group-header">
            <h3>Notification Types</h3>
            <p>Choose which types of notifications you want to receive</p>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Task Assignments</label>
              <span className="setting-description">When tasks are assigned to you</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.taskAssignments}
                onChange={(checked) => handlePreferenceChange('taskAssignments', checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Status Changes</label>
              <span className="setting-description">When task status is updated</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.taskStatusChanges}
                onChange={(checked) => handlePreferenceChange('taskStatusChanges', checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Comments & Collaboration</label>
              <span className="setting-description">When someone comments on your tasks</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.taskComments}
                onChange={(checked) => handlePreferenceChange('taskComments', checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Due Date Reminders</label>
              <span className="setting-description">Reminders for upcoming task deadlines</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.dueDateReminders}
                onChange={(checked) => handlePreferenceChange('dueDateReminders', checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Priority Changes</label>
              <span className="setting-description">When task priority is increased</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.priorityChanges}
                onChange={(checked) => handlePreferenceChange('priorityChanges', checked)}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Bulk Assignments</label>
              <span className="setting-description">When multiple tasks are assigned at once</span>
            </div>
            <div className="setting-control">
              <Switch
                checked={preferences.bulkAssignments}
                onChange={(checked) => handlePreferenceChange('bulkAssignments', checked)}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <Button
            variant="primary"
            onClick={savePreferences}
            disabled={isSaving}
            className="save-btn"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default NotificationSettings