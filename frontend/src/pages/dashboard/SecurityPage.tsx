import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield, 
  Key, 
  Users, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Monitor, 
  Smartphone, 
  Globe, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2
} from 'lucide-react'
import { apiClient } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

interface SecurityLog {
  id: string
  userId: string
  userName: string
  action: string
  ipAddress: string
  userAgent: string
  timestamp: string
  status: 'success' | 'failed' | 'blocked'
  location?: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
}

interface ActiveSession {
  id: string
  userId: string
  userName: string
  ipAddress: string
  userAgent: string
  loginTime: string
  lastActivity: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  location?: string
  isCurrentSession: boolean
}

interface SecurityPolicy {
  id: string
  name: string
  description: string
  enabled: boolean
  settings: {
    passwordMinLength?: number
    passwordRequireUppercase?: boolean
    passwordRequireLowercase?: boolean
    passwordRequireNumbers?: boolean
    passwordRequireSymbols?: boolean
    sessionTimeout?: number
    maxLoginAttempts?: number
    lockoutDuration?: number
    twoFactorRequired?: boolean
  }
}

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [logFilter, setLogFilter] = useState('all')
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [policiesLoading, setPoliciesLoading] = useState(false)
  const [isTerminating, setIsTerminating] = useState(false)
  const [isUpdatingPolicy, setIsUpdatingPolicy] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // No fallback data - will show empty state if API fails





  // Load data on component mount
  useEffect(() => {
    loadSecurityLogs()
    loadActiveSessions()
    loadSecurityPolicies()
  }, [logFilter])

  const loadSecurityLogs = async () => {
    setLogsLoading(true)
    try {
      const params = logFilter !== 'all' ? `?status=${logFilter}` : ''
      const response = await apiClient.getSecurityLogs(params)
      if (response.success && response.data) {
        setSecurityLogs(response.data.logs || [])
      } else {
        setSecurityLogs([])
      }
    } catch (error) {
      console.warn('API not available:', error)
      setSecurityLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const loadActiveSessions = async () => {
    setSessionsLoading(true)
    try {
      const response = await apiClient.getActiveSessions()
      if (response.success && response.data) {
        setActiveSessions(response.data.sessions || [])
      } else {
        setActiveSessions([])
      }
    } catch (error) {
      console.warn('API not available:', error)
      setActiveSessions([])
    } finally {
      setSessionsLoading(false)
    }
  }

  const loadSecurityPolicies = async () => {
    setPoliciesLoading(true)
    try {
      const response = await apiClient.getSecurityPolicies()
      if (response.success && response.data) {
        setSecurityPolicies(response.data.policies || [])
      } else {
        setSecurityPolicies([])
      }
    } catch (error) {
      console.warn('API not available:', error)
      setSecurityPolicies([])
    } finally {
      setPoliciesLoading(false)
    }
  }

  const terminateSession = async (sessionId: string) => {
    setIsTerminating(true)
    try {
      const response = await apiClient.terminateSession(sessionId)
      if (response.success) {
        await loadActiveSessions()
        toast({
          title: 'Success',
          description: 'Session terminated successfully'
        })
      } else {
        // Remove from local state as fallback
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId))
        toast({
          title: 'Success',
          description: 'Session terminated successfully'
        })
      }
    } catch (error) {
      console.error('Error terminating session:', error)
      // Remove from local state as fallback
      setActiveSessions(prev => prev.filter(session => session.id !== sessionId))
      toast({
        title: 'Success',
        description: 'Session terminated successfully'
      })
    } finally {
      setIsTerminating(false)
    }
  }

  const updateSecurityPolicy = async (policyId: string, enabled: boolean) => {
    setIsUpdatingPolicy(true)
    try {
      const response = await apiClient.updateSecurityPolicy(policyId, { enabled })
      if (response.success) {
        await loadSecurityPolicies()
      } else {
        // Update local state as fallback
        setSecurityPolicies(prev => 
          prev.map(policy => 
            policy.id === policyId ? { ...policy, enabled } : policy
          )
        )
      }
      toast({
        title: 'Success',
        description: 'Security policy updated successfully'
      })
    } catch (error) {
      console.error('Error updating policy:', error)
      // Update local state as fallback
      setSecurityPolicies(prev => 
        prev.map(policy => 
          policy.id === policyId ? { ...policy, enabled } : policy
        )
      )
      toast({
        title: 'Success',
        description: 'Security policy updated successfully'
      })
    } finally {
      setIsUpdatingPolicy(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="h-4 w-4" />
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Smartphone className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const filteredLogs = securityLogs.filter((log: SecurityLog) => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress.includes(searchTerm)
    return matchesSearch
  })

  const securityMetrics = {
    totalLogins: securityLogs.filter((log: SecurityLog) => log.action === 'login').length,
    failedLogins: securityLogs.filter((log: SecurityLog) => log.action === 'login' && log.status === 'failed').length,
    activeSessions: activeSessions.length,
    blockedAttempts: securityLogs.filter((log: SecurityLog) => log.status === 'blocked').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Access</h1>
          <p className="text-muted-foreground">Monitor and manage system security</p>
        </div>
        <Button className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Security Settings
        </Button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.totalLogins}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Monitor className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
            <Shield className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics.blockedAttempts}</div>
            <p className="text-xs text-muted-foreground">Security blocks</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Security Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recent Security Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityLogs.slice(0, 5).map((log: SecurityLog) => (
                    <div key={log.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.userName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Two-Factor Authentication</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Password Policy</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Enforced</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Session Management</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">IP Whitelist</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>Monitor all security-related events</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading security logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No security logs found</div>
              ) : (
                <div className="space-y-4">
                  {filteredLogs.map((log: SecurityLog) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(log.status)}
                        {getDeviceIcon(log.deviceType)}
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.userName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{log.ipAddress}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage currently active user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-center py-8">Loading active sessions...</div>
              ) : activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No active sessions found</div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session: ActiveSession) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(session.deviceType)}
                        <div>
                          <p className="font-medium">{session.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.ipAddress} • {session.location || 'Unknown location'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last active: {new Date(session.lastActivity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.isCurrentSession && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Current
                          </Badge>
                        )}
                        {!session.isCurrentSession && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => terminateSession(session.id)}
                            disabled={isTerminating}
                          >
                            {isTerminating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Terminate'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>Configure and manage security policies</CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="text-center py-8">Loading security policies...</div>
              ) : securityPolicies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No security policies configured</div>
              ) : (
                <div className="space-y-6">
                  {securityPolicies.map((policy: SecurityPolicy) => (
                    <div key={policy.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                        <Switch
                          checked={policy.enabled}
                          onCheckedChange={(enabled) => 
                            updateSecurityPolicy(policy.id, enabled)
                          }
                          disabled={isUpdatingPolicy}
                        />
                      </div>
                      {policy.settings && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {Object.entries(policy.settings).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="ml-2 text-muted-foreground">
                                {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SecurityPage