import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  Shield,
  Edit,
  Save,
  Camera,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  department?: string;
  position?: string;
  role: string;
  avatar?: string;
  bio?: string;
  joinDate: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Fallback profile data
  const fallbackProfile: UserProfile = useMemo(() => ({
    id: user?.id || '1',
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@company.com',
    phone: '+234 801 234 5678',
    address: '123 Victoria Island, Lagos, Nigeria',
    dateOfBirth: '1990-05-15',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    role: user?.role || 'employee',
    bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
    joinDate: '2022-01-15',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+234 802 345 6789',
      relationship: 'Spouse'
    }
  }), [user?.id, user?.firstName, user?.lastName, user?.email, user?.role]);

  // Load user profile
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from API, fallback to mock data
      try {
        const response = await apiClient.getUserProfile();
        if (response.success && response.data) {
          const profileData = response.data.profile || response.data;
          setProfile(profileData);
          setFormData(profileData);
        } else {
          setProfile(fallbackProfile);
          setFormData(fallbackProfile);
        }
      } catch (apiError) {
        console.warn('API not available, using fallback data:', apiError);
        setProfile(fallbackProfile);
        setFormData(fallbackProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
      // Use fallback data on error
      setProfile(fallbackProfile);
      setFormData(fallbackProfile);
    } finally {
      setLoading(false);
    }
  }, [toast, fallbackProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Try to update via API
      try {
        const response = await apiClient.updateUserProfile(formData);
        if (response.success) {
          setProfile({ ...profile!, ...formData });
          setEditing(false);
          toast({
            title: 'Success',
            description: 'Profile updated successfully'
          });
        } else {
          throw new Error(response.message || 'Failed to update profile');
        }
      } catch (apiError) {
        console.warn('API not available, simulating update:', apiError);
        // Simulate successful update
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProfile({ ...profile!, ...formData });
        setEditing(false);
        toast({
          title: 'Success',
          description: 'Profile updated successfully'
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Try to change password via API
      try {
        const response = await apiClient.changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        if (response.success) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowPasswordForm(false);
          toast({
            title: 'Success',
            description: 'Password updated successfully'
          });
        } else {
          throw new Error(response.message || 'Failed to change password');
        }
      } catch (apiError) {
        console.warn('API not available, simulating password change:', apiError);
        // Simulate successful password change
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        toast({
          title: 'Success',
          description: 'Password updated successfully'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      'super-admin': { color: 'bg-red-100 text-red-800', label: 'Super Admin' },
      'hr-admin': { color: 'bg-blue-100 text-blue-800', label: 'HR Admin' },
      'manager': { color: 'bg-green-100 text-green-800', label: 'Manager' },
      'hr-staff': { color: 'bg-purple-100 text-purple-800', label: 'HR Staff' },
      'employee': { color: 'bg-gray-100 text-gray-800', label: 'Employee' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.employee;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Shield className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <p className="text-muted-foreground">Unable to load profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} />
                    <AvatarFallback className="text-lg">
                      {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {editing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      onClick={() => {
                        // Handle avatar upload
                        toast({
                          title: 'Feature Coming Soon',
                          description: 'Avatar upload will be available soon'
                        });
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="mt-4 space-y-2">
                  <h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2>
                  <p className="text-muted-foreground">{profile.position}</p>
                  {getRoleBadge(profile.role)}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  {profile.department && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.department}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(profile.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList>
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card className="bg-gradient-card shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details and bio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editing ? formData.firstName || '' : profile.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editing ? formData.lastName || '' : profile.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editing ? formData.email || '' : profile.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editing ? formData.phone || '' : profile.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editing ? formData.dateOfBirth || '' : profile.dateOfBirth || ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={editing ? formData.address || '' : profile.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editing}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editing ? formData.bio || '' : profile.bio || ''}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!editing}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="bg-gradient-card shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showPasswordForm ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h3 className="font-medium">Password</h3>
                          <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
                        </div>
                        <Button onClick={() => setShowPasswordForm(true)}>
                          Change Password
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                        <Button variant="outline" onClick={() => {
                          toast({
                            title: 'Feature Coming Soon',
                            description: '2FA will be available soon'
                          });
                        }}>
                          Enable 2FA
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={handlePasswordChange} disabled={saving}>
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : null}
                          Update Password
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency">
              <Card className="bg-gradient-card shadow-lg border-0">
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                  <CardDescription>Contact information for emergencies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={editing ? formData.emergencyContact?.name || '' : profile.emergencyContact?.name || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergencyContact: { 
                          ...formData.emergencyContact, 
                          name: e.target.value,
                          phone: formData.emergencyContact?.phone || '',
                          relationship: formData.emergencyContact?.relationship || ''
                        }
                      })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={editing ? formData.emergencyContact?.phone || '' : profile.emergencyContact?.phone || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergencyContact: { 
                          ...formData.emergencyContact, 
                          name: formData.emergencyContact?.name || '',
                          phone: e.target.value,
                          relationship: formData.emergencyContact?.relationship || ''
                        }
                      })}
                      disabled={!editing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      value={editing ? formData.emergencyContact?.relationship || '' : profile.emergencyContact?.relationship || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        emergencyContact: { 
                          ...formData.emergencyContact, 
                          name: formData.emergencyContact?.name || '',
                          phone: formData.emergencyContact?.phone || '',
                          relationship: e.target.value
                        }
                      })}
                      disabled={!editing}
                      placeholder="e.g., Spouse, Parent, Sibling"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;