import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  MapPin, 
  Clock, 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';

interface AttendancePolicy {
  id: string;
  name: string;
  work_hours_start: string;
  work_hours_end: string;
  break_duration_minutes: number;
  late_arrival_threshold_minutes: number;
  overtime_threshold_minutes: number;
  require_location_verification: boolean;
  allow_early_checkin_minutes: number;
  allow_late_checkout_minutes: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_default: boolean;
  is_active: boolean;
}

const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'attendance';
  
  // Attendance Policies State
  const [attendancePolicies, setAttendancePolicies] = useState<AttendancePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  
  // Office Locations State
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  // Form State
  const [policyForm, setPolicyForm] = useState({
    name: '',
    work_hours_start: '09:00',
    work_hours_end: '17:00',
    break_duration_minutes: 60,
    late_arrival_threshold_minutes: 15,
    overtime_threshold_minutes: 480,
    require_location_verification: true,
    allow_early_checkin_minutes: 30,
    allow_late_checkout_minutes: 60,
    is_default: false,
    is_active: true,
  });

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendancePolicies();
    } else if (activeTab === 'locations') {
      loadOfficeLocations();
    }
  }, [activeTab]);

  const loadAttendancePolicies = async () => {
    try {
      setLoadingPolicies(true);
      const response = await apiClient.getAttendancePolicies();
      
      if (response.success && response.data) {
        setAttendancePolicies(response.data);
      } else {
        toast.error('Failed to load attendance policies');
      }
    } catch (error: any) {
      console.error('Error loading attendance policies:', error);
      toast.error('Failed to load attendance policies');
    } finally {
      setLoadingPolicies(false);
    }
  };

  const loadOfficeLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await apiClient.getLocations();
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setOfficeLocations(response.data);
      } else {
        setOfficeLocations([]); // Ensure it's always an array
        toast.error('Failed to load office locations');
      }
    } catch (error: any) {
      console.error('Error loading office locations:', error);
      setOfficeLocations([]); // Ensure it's always an array
      toast.error('Failed to load office locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const response = await apiClient.createAttendancePolicy(policyForm);
      
      if (response.success) {
        toast.success('Attendance policy created successfully');
        setShowCreatePolicy(false);
        resetPolicyForm();
        loadAttendancePolicies();
      } else {
        toast.error(response.message || 'Failed to create attendance policy');
      }
    } catch (error: any) {
      console.error('Error creating attendance policy:', error);
      toast.error('Failed to create attendance policy');
    }
  };

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;
    
    try {
      const response = await apiClient.updateAttendancePolicy(editingPolicy.id, policyForm);
      
      if (response.success) {
        toast.success('Attendance policy updated successfully');
        setEditingPolicy(null);
        resetPolicyForm();
        loadAttendancePolicies();
      } else {
        toast.error(response.message || 'Failed to update attendance policy');
      }
    } catch (error: any) {
      console.error('Error updating attendance policy:', error);
      toast.error('Failed to update attendance policy');
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance policy?')) return;
    
    try {
      const response = await apiClient.deleteAttendancePolicy(id);
      
      if (response.success) {
        toast.success('Attendance policy deleted successfully');
        loadAttendancePolicies();
      } else {
        toast.error(response.message || 'Failed to delete attendance policy');
      }
    } catch (error: any) {
      console.error('Error deleting attendance policy:', error);
      toast.error('Failed to delete attendance policy');
    }
  };

  const handleSetDefaultPolicy = async (id: string) => {
    try {
      const response = await apiClient.setDefaultAttendancePolicy(id);
      
      if (response.success) {
        toast.success('Default attendance policy updated');
        loadAttendancePolicies();
      } else {
        toast.error(response.message || 'Failed to set default policy');
      }
    } catch (error: any) {
      console.error('Error setting default policy:', error);
      toast.error('Failed to set default policy');
    }
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      name: '',
      work_hours_start: '09:00',
      work_hours_end: '17:00',
      break_duration_minutes: 60,
      late_arrival_threshold_minutes: 15,
      overtime_threshold_minutes: 480,
      require_location_verification: true,
      allow_early_checkin_minutes: 30,
      allow_late_checkout_minutes: 60,
      is_default: false,
      is_active: true,
    });
  };

  const startEditPolicy = (policy: AttendancePolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      work_hours_start: policy.work_hours_start,
      work_hours_end: policy.work_hours_end,
      break_duration_minutes: policy.break_duration_minutes,
      late_arrival_threshold_minutes: policy.late_arrival_threshold_minutes,
      overtime_threshold_minutes: policy.overtime_threshold_minutes,
      require_location_verification: policy.require_location_verification,
      allow_early_checkin_minutes: policy.allow_early_checkin_minutes,
      allow_late_checkout_minutes: policy.allow_late_checkout_minutes,
      is_default: policy.is_default,
      is_active: policy.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingPolicy(null);
    setShowCreatePolicy(false);
    resetPolicyForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and policies
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Attendance Policies Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Attendance Policies
                  </CardTitle>
                  <CardDescription>
                    Configure work hours, break times, and attendance rules
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowCreatePolicy(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPolicies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading attendance policies...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendancePolicies.map((policy) => (
                    <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{policy.name}</h3>
                          {policy.is_default && (
                            <Badge variant="default">Default</Badge>
                          )}
                          {!policy.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditPolicy(policy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!policy.is_default && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultPolicy(policy.id)}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy.id)}
                            disabled={policy.is_default}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Work Hours:</span>
                          <div className="font-medium">
                            {policy.work_hours_start} - {policy.work_hours_end}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Break Duration:</span>
                          <div className="font-medium">{policy.break_duration_minutes} min</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Late Threshold:</span>
                          <div className="font-medium">{policy.late_arrival_threshold_minutes} min</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Location Required:</span>
                          <div className="font-medium">
                            {policy.require_location_verification ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {attendancePolicies.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance policies found. Create your first policy to get started.
                    </div>
                  )}
                </div>
              )}

              {/* Create/Edit Policy Form */}
              {(showCreatePolicy || editingPolicy) && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle>
                      {editingPolicy ? 'Edit Attendance Policy' : 'Create New Attendance Policy'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="policyName">Policy Name</Label>
                        <Input
                          id="policyName"
                          value={policyForm.name}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Standard Work Hours"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={policyForm.is_active}
                            onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, is_active: checked }))}
                          />
                          <span className="text-sm">Active</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Work Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={policyForm.work_hours_start}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, work_hours_start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">Work End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={policyForm.work_hours_end}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, work_hours_end: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
                        <Input
                          id="breakDuration"
                          type="number"
                          value={policyForm.break_duration_minutes}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, break_duration_minutes: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lateThreshold">Late Arrival Threshold (minutes)</Label>
                        <Input
                          id="lateThreshold"
                          type="number"
                          value={policyForm.late_arrival_threshold_minutes}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, late_arrival_threshold_minutes: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="earlyCheckin">Early Check-in Allowed (minutes)</Label>
                        <Input
                          id="earlyCheckin"
                          type="number"
                          value={policyForm.allow_early_checkin_minutes}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, allow_early_checkin_minutes: parseInt(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lateCheckout">Late Check-out Allowed (minutes)</Label>
                        <Input
                          id="lateCheckout"
                          type="number"
                          value={policyForm.allow_late_checkout_minutes}
                          onChange={(e) => setPolicyForm(prev => ({ ...prev, allow_late_checkout_minutes: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={policyForm.require_location_verification}
                          onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, require_location_verification: checked }))}
                        />
                        <Label>Require location verification for check-in/out</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={policyForm.is_default}
                          onCheckedChange={(checked) => setPolicyForm(prev => ({ ...prev, is_default: checked }))}
                        />
                        <Label>Set as default policy</Label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      <Button 
                        onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {editingPolicy ? 'Update Policy' : 'Create Policy'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={cancelEdit}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Office Locations Tab */}
        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Office Locations
              </CardTitle>
              <CardDescription>
                Manage office locations and geofencing settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading office locations...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {officeLocations.map((location) => (
                    <div key={location.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {location.name}
                            {location.is_default && <Badge variant="default">Default</Badge>}
                          </h3>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                          <p className="text-xs text-muted-foreground">
                            Radius: {location.radius_meters}m | 
                            Coordinates: {location.latitude}, {location.longitude}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {officeLocations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No office locations found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Notification settings will be implemented here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                System configuration settings will be implemented here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;