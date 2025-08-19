import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings, 
  Database, 
  Shield, 
  Clock, 
  Globe,
  Mail,
  Key,
  Server,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Upload,
  Download,
  Loader2
} from 'lucide-react'

interface SystemConfig {
  id: string
  company_name: string
  company_logo_url?: string
  timezone: string
  date_format: string
  time_format: string
  currency: string
  language: string
  session_timeout_minutes: number
  password_min_length: number
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  password_expiry_days: number
  max_login_attempts: number
  lockout_duration_minutes: number
  backup_enabled: boolean
  backup_frequency: string
  backup_retention_days: number
  maintenance_mode: boolean
  maintenance_message: string
  api_rate_limit_per_minute: number
  file_upload_max_size_mb: number
  allowed_file_types: string[]
  email_smtp_host: string
  email_smtp_port: number
  email_smtp_username: string
  email_smtp_password: string
  email_smtp_secure: boolean
  email_from_address: string
  email_from_name: string
  created_at: string
  updated_at: string
}

interface ConfigFormData {
  company_name: string
  timezone: string
  date_format: string
  time_format: string
  currency: string
  language: string
  session_timeout_minutes: string
  password_min_length: string
  password_require_uppercase: boolean
  password_require_lowercase: boolean
  password_require_numbers: boolean
  password_require_symbols: boolean
  password_expiry_days: string
  max_login_attempts: string
  lockout_duration_minutes: string
  backup_enabled: boolean
  backup_frequency: string
  backup_retention_days: string
  maintenance_mode: boolean
  maintenance_message: string
  api_rate_limit_per_minute: string
  file_upload_max_size_mb: string
  allowed_file_types: string
  email_smtp_host: string
  email_smtp_port: string
  email_smtp_username: string
  email_smtp_password: string
  email_smtp_secure: boolean
  email_from_address: string
  email_from_name: string
}

const SystemConfiguration = () => {
  const [formData, setFormData] = useState<ConfigFormData>({
    company_name: '',
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    time_format: '24',
    currency: 'USD',
    language: 'en',
    session_timeout_minutes: '480',
    password_min_length: '8',
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    password_expiry_days: '90',
    max_login_attempts: '5',
    lockout_duration_minutes: '30',
    backup_enabled: true,
    backup_frequency: 'daily',
    backup_retention_days: '30',
    maintenance_mode: false,
    maintenance_message: 'System is under maintenance. Please try again later.',
    api_rate_limit_per_minute: '100',
    file_upload_max_size_mb: '10',
    allowed_file_types: 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_username: '',
    email_smtp_password: '',
    email_smtp_secure: true,
    email_from_address: '',
    email_from_name: ''
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const { toast } = useToast()

  // Load initial configuration
  useEffect(() => {
    loadConfiguration()
  }, [])

  const loadConfiguration = async () => {
    try {
      setIsLoading(true)
      // Simulate API call - replace with actual API when available
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set default values with Go3net HR Management System
      setFormData(prev => ({
        ...prev,
        company_name: 'Go3net HR Management System',
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        email_from_name: 'Go3net HR System'
      }))
    } catch (error) {
      console.error('Failed to load configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to load system configuration',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfiguration = async (data: ConfigFormData) => {
    try {
      setIsSaving(true)
      // Simulate API call - replace with actual API when available
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast({
        title: 'Success',
        description: 'System configuration updated successfully'
      })
    } catch (error) {
      console.error('Failed to save configuration:', error)
      toast({
        title: 'Error',
        description: 'Failed to update system configuration',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const testEmailConfiguration = async () => {
    try {
      setIsTestingEmail(true)
      // Simulate API call - replace with actual API when available
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Success',
        description: 'Email configuration test successful'
      })
    } catch (error) {
      console.error('Email test failed:', error)
      toast({
        title: 'Error',
        description: 'Email test failed. Please check your configuration.',
        variant: 'destructive'
      })
    } finally {
      setIsTestingEmail(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.company_name.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      })
      return
    }

    const sessionTimeout = parseInt(formData.session_timeout_minutes)
    if (isNaN(sessionTimeout) || sessionTimeout < 5 || sessionTimeout > 1440) {
      toast({
        title: 'Error',
        description: 'Session timeout must be between 5 and 1440 minutes',
        variant: 'destructive'
      })
      return
    }

    const passwordLength = parseInt(formData.password_min_length)
    if (isNaN(passwordLength) || passwordLength < 6 || passwordLength > 50) {
      toast({
        title: 'Error',
        description: 'Password minimum length must be between 6 and 50 characters',
        variant: 'destructive'
      })
      return
    }

    const maxAttempts = parseInt(formData.max_login_attempts)
    if (isNaN(maxAttempts) || maxAttempts < 3 || maxAttempts > 20) {
      toast({
        title: 'Error',
        description: 'Max login attempts must be between 3 and 20',
        variant: 'destructive'
      })
      return
    }

    const fileSize = parseInt(formData.file_upload_max_size_mb)
    if (isNaN(fileSize) || fileSize < 1 || fileSize > 100) {
      toast({
        title: 'Error',
        description: 'File upload max size must be between 1 and 100 MB',
        variant: 'destructive'
      })
      return
    }

    saveConfiguration(formData)
  }

  const handleReset = () => {
    loadConfiguration()
    toast({
      title: 'Info',
      description: 'Configuration reset to default values'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
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
          <h2 className="text-2xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">
            Configure system-wide settings, security policies, and integrations
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
            disabled={isSaving}
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
            <CardDescription>
              Basic company information and regional settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Your Company Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value="Asia/Kolkata">India</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <select
                  id="date_format"
                  value={formData.date_format}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_format: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_format">Time Format</Label>
                <select
                  id="time_format"
                  value={formData.time_format}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_format: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="24">24 Hour</option>
                  <option value="12">12 Hour (AM/PM)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="INR">INR - Indian Rupee</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>
              Configure password policies and security measures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={formData.session_timeout_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, session_timeout_minutes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password_min_length">Password Minimum Length</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  min="6"
                  max="50"
                  value={formData.password_min_length}
                  onChange={(e) => setFormData(prev => ({ ...prev, password_min_length: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Password Requirements</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require_uppercase"
                    checked={formData.password_require_uppercase}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_require_uppercase: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor="require_uppercase">Require Uppercase Letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require_lowercase"
                    checked={formData.password_require_lowercase}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_require_lowercase: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor="require_lowercase">Require Lowercase Letters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require_numbers"
                    checked={formData.password_require_numbers}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_require_numbers: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor="require_numbers">Require Numbers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require_symbols"
                    checked={formData.password_require_symbols}
                    onChange={(e) => setFormData(prev => ({ ...prev, password_require_symbols: e.target.checked }))}
                    className="rounded border-gray-300 h-4 w-4"
                  />
                  <Label htmlFor="require_symbols">Require Special Characters</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password_expiry">Password Expiry (days)</Label>
                <Input
                  id="password_expiry"
                  type="number"
                  min="0"
                  value={formData.password_expiry_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, password_expiry_days: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">0 = never expires</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_attempts">Max Login Attempts</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  min="3"
                  max="20"
                  value={formData.max_login_attempts}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_login_attempts: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockout_duration"
                  type="number"
                  min="1"
                  value={formData.lockout_duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, lockout_duration_minutes: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>System Settings</span>
            </CardTitle>
            <CardDescription>
              Configure system behavior and performance settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_rate_limit">API Rate Limit (per minute)</Label>
                <Input
                  id="api_rate_limit"
                  type="number"
                  min="10"
                  value={formData.api_rate_limit_per_minute}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_rate_limit_per_minute: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_upload_size">Max File Upload Size (MB)</Label>
                <Input
                  id="file_upload_size"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.file_upload_max_size_mb}
                  onChange={(e) => setFormData(prev => ({ ...prev, file_upload_max_size_mb: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_file_types">Allowed File Types</Label>
              <Input
                id="allowed_file_types"
                value={formData.allowed_file_types}
                onChange={(e) => setFormData(prev => ({ ...prev, allowed_file_types: e.target.value }))}
                placeholder="jpg,jpeg,png,pdf,doc,docx,xls,xlsx"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of allowed file extensions
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Maintenance Mode</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable to prevent user access during maintenance
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.maintenance_mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                  className="rounded border-gray-300 h-4 w-4"
                />
              </div>
              {formData.maintenance_mode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Maintenance Message</Label>
                  <Input
                    id="maintenance_message"
                    value={formData.maintenance_message}
                    onChange={(e) => setFormData(prev => ({ ...prev, maintenance_message: e.target.value }))}
                    placeholder="System is under maintenance..."
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Backup Settings</span>
            </CardTitle>
            <CardDescription>
              Configure automated backup and data retention policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <span className="font-medium">Enable Automated Backups</span>
                <p className="text-sm text-muted-foreground">
                  Automatically backup system data
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.backup_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, backup_enabled: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
            </div>

            {formData.backup_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <select
                    id="backup_frequency"
                    value={formData.backup_frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, backup_frequency: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup_retention">Retention Period (days)</Label>
                  <Input
                    id="backup_retention"
                    type="number"
                    min="1"
                    value={formData.backup_retention_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, backup_retention_days: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Email Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure SMTP settings for sending system emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={formData.email_smtp_host}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_smtp_host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={formData.email_smtp_port}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_smtp_port: e.target.value }))}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_username">SMTP Username</Label>
                <Input
                  id="smtp_username"
                  value={formData.email_smtp_username}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_smtp_username: e.target.value }))}
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_password">SMTP Password</Label>
                <div className="relative">
                  <Input
                    id="smtp_password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.email_smtp_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_smtp_password: e.target.value }))}
                    placeholder="App password or SMTP password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_address">From Email Address</Label>
                <Input
                  id="from_address"
                  type="email"
                  value={formData.email_from_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_from_address: e.target.value }))}
                  placeholder="noreply@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={formData.email_from_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, email_from_name: e.target.value }))}
                  placeholder="Your Company HR"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smtp_secure"
                checked={formData.email_smtp_secure}
                onChange={(e) => setFormData(prev => ({ ...prev, email_smtp_secure: e.target.checked }))}
                className="rounded border-gray-300 h-4 w-4"
              />
              <Label htmlFor="smtp_secure">Use Secure Connection (TLS/SSL)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={testEmailConfiguration}
                disabled={isTestingEmail || !formData.email_smtp_host}
                className="flex items-center space-x-2"
              >
                {isTestingEmail ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                <span>Test Email Configuration</span>
              </Button>
              {isTestingEmail && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Testing...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                For Gmail, use an App Password instead of your regular password. Enable 2FA and generate an App Password in your Google Account settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

export default SystemConfiguration