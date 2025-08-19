import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Clock, 
  Bell, 
  Shield, 
  Building, 
  Users,
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import LocationManagement from './settings/LocationManagement'
import AttendancePolicies from './settings/AttendancePolicies'
import CheckinSettings from './settings/CheckinSettings'
import NotificationSettings from './settings/NotificationSettings'
import SystemConfiguration from './settings/SystemConfiguration'

type SettingsTab = 'locations' | 'attendance' | 'checkin' | 'notifications' | 'system'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('locations')

  const tabs = [
    {
      id: 'locations' as const,
      name: 'Office Locations',
      icon: MapPin,
      description: 'Manage office locations and geofencing',
      color: 'text-blue-600'
    },
    {
      id: 'attendance' as const,
      name: 'Attendance Policies',
      icon: Clock,
      description: 'Configure work hours and attendance rules',
      color: 'text-green-600'
    },
    {
      id: 'checkin' as const,
      name: 'Check-in Settings',
      icon: CheckCircle,
      description: 'Set up check-in/out requirements',
      color: 'text-purple-600'
    },
    {
      id: 'notifications' as const,
      name: 'Notifications',
      icon: Bell,
      description: 'Configure alerts and notifications',
      color: 'text-orange-600'
    },
    {
      id: 'system' as const,
      name: 'System Config',
      icon: SettingsIcon,
      description: 'General system settings',
      color: 'text-gray-600'
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'locations':
        return <LocationManagement />
      case 'attendance':
        return <AttendancePolicies />
      case 'checkin':
        return <CheckinSettings />
      case 'notifications':
        return <NotificationSettings />
      case 'system':
        return <SystemConfiguration />
      default:
        return <LocationManagement />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings for your organization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">Super Admin Access</span>
        </div>
      </div>

      {/* Settings Navigation - Mobile First: 2x3, Tablet: 3x2, Desktop: 5x1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <Card 
              key={tab.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isActive 
                  ? 'ring-2 ring-primary shadow-md bg-primary/5' 
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-primary/10' : 'bg-accent'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      isActive ? 'text-primary' : tab.color
                    }`} />
                  </div>
                  <div>
                    <h3 className={`font-medium text-sm ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}>
                      {tab.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default SettingsPage