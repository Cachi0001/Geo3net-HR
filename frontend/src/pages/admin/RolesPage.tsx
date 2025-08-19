import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { 
  Shield, 
  Users, 
  Key, 
  Settings, 
  Search, 
  Plus, 
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Loader2
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  userId: string;
  roleName: string;
  permissions: string[];
  assignedBy?: string;
  assignedAt: string;
  isActive: boolean;
  description?: string;
  userCount?: number;
  color?: string;
  isSystemRole?: boolean;
}

interface RoleHierarchy {
  [key: string]: {
    level: number;
    permissions: string[];
    description: string;
  };
}

// Fallback permissions data
const fallbackPermissions: Permission[] = [
  {
    id: '1',
    name: 'view_dashboard',
    description: 'Access to main dashboard',
    category: 'Dashboard',
    resource: 'dashboard',
    action: 'read'
  },
  {
    id: '2',
    name: 'manage_employees',
    description: 'Create, edit, and delete employee records',
    category: 'Employee Management',
    resource: 'employee',
    action: 'write'
  },
  {
    id: '3',
    name: 'view_employees',
    description: 'View employee information',
    category: 'Employee Management',
    resource: 'employee',
    action: 'read'
  },
  {
    id: '4',
    name: 'manage_payroll',
    description: 'Process payroll and manage compensation',
    category: 'Payroll',
    resource: 'payroll',
    action: 'write'
  },
  {
    id: '5',
    name: 'view_payroll',
    description: 'View payroll information',
    category: 'Payroll',
    resource: 'payroll',
    action: 'read'
  },
  {
    id: '6',
    name: 'manage_tasks',
    description: 'Create and assign tasks',
    category: 'Task Management',
    resource: 'task',
    action: 'write'
  },
  {
    id: '7',
    name: 'view_tasks',
    description: 'View assigned tasks',
    category: 'Task Management',
    resource: 'task',
    action: 'read'
  },
  {
    id: '8',
    name: 'manage_time_tracking',
    description: 'Manage time tracking settings',
    category: 'Time Tracking',
    resource: 'time',
    action: 'write'
  },
  {
    id: '9',
    name: 'view_time_tracking',
    description: 'View time tracking data',
    category: 'Time Tracking',
    resource: 'time',
    action: 'read'
  },
  {
    id: '10',
    name: 'manage_reports',
    description: 'Generate and manage reports',
    category: 'Reports',
    resource: 'report',
    action: 'write'
  }
];

// Transform role hierarchy to display roles
const transformRoleHierarchyToRoles = (hierarchy: RoleHierarchy): Role[] => {
  const roleColors = {
    'super-admin': 'bg-gradient-to-r from-red-500 to-red-600',
    'hr-admin': 'bg-gradient-to-r from-blue-500 to-blue-600',
    'manager': 'bg-gradient-to-r from-green-500 to-green-600',
    'hr-staff': 'bg-orange-500',
    'employee': 'bg-pink-500'
  };

  return Object.entries(hierarchy).map(([roleName, roleData], index) => ({
    id: `role-${index + 1}`,
    userId: '',
    roleName,
    permissions: roleData.permissions,
    assignedAt: new Date().toISOString(),
    isActive: true,
    description: roleData.description,
    userCount: 0,
    color: roleColors[roleName as keyof typeof roleColors] || 'bg-gray-500',
    isSystemRole: ['super-admin', 'hr-admin'].includes(roleName)
  }));
};

const fallbackRoles: Role[] = [
  {
    id: '1',
    userId: '',
    roleName: 'super-admin',
    permissions: ['*'],
    assignedAt: '2020-01-01T00:00:00Z',
    isActive: true,
    description: 'System administrator with full access',
    userCount: 2,
    color: 'bg-gradient-to-r from-red-500 to-red-600',
    isSystemRole: true
  },
  {
    id: '2',
    userId: '',
    roleName: 'hr-admin',
    permissions: ['employee.create', 'employee.read', 'employee.update', 'employee.delete', 'recruitment.manage', 'payroll.manage'],
    assignedAt: '2020-02-01T00:00:00Z',
    isActive: true,
    description: 'HR administrator with full HR management access',
    userCount: 3,
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    isSystemRole: true
  },
  {
    id: '3',
    userId: '',
    roleName: 'manager',
    permissions: ['employee.read', 'team.manage', 'performance.manage', 'leave.approve'],
    assignedAt: '2020-02-15T00:00:00Z',
    isActive: true,
    description: 'Department/team manager',
    userCount: 8,
    color: 'bg-gradient-to-r from-green-500 to-green-600',
    isSystemRole: false
  },
  {
    id: '4',
    userId: '',
    roleName: 'hr-staff',
    permissions: ['employee.read', 'recruitment.read', 'recruitment.update', 'onboarding.manage'],
    assignedAt: '2020-03-01T00:00:00Z',
    isActive: true,
    description: 'HR staff member',
    userCount: 5,
    color: 'bg-orange-500',
    isSystemRole: false
  },
  {
    id: '5',
    userId: '',
    roleName: 'employee',
    permissions: ['profile.read', 'profile.update', 'leave.request', 'time.log'],
    assignedAt: '2020-01-01T00:00:00Z',
    isActive: true,
    description: 'Regular employee',
    userCount: 45,
    color: 'bg-pink-500',
    isSystemRole: false
  }
];

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      try {
        setLoading(true);
        
        // Use fallback permissions for now
        setPermissions(fallbackPermissions);
        
        // Fetch role hierarchy and transform to roles
        const [hierarchyResponse, availableRolesResponse] = await Promise.all([
          apiClient.getRoleHierarchy(),
          apiClient.getAvailableRoles()
        ]);
        
        if (hierarchyResponse.success && hierarchyResponse.data?.hierarchy) {
          const transformedRoles = transformRoleHierarchyToRoles(hierarchyResponse.data.hierarchy);
          setRoles(transformedRoles);
        } else {
          setRoles(fallbackRoles);
        }
        
      } catch (error) {
        console.error('Error fetching roles and permissions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load roles and permissions. Using fallback data.',
          variant: 'destructive'
        });
        setPermissions(fallbackPermissions);
        setRoles(fallbackRoles);
      } finally {
        setLoading(false);
      }
    };

    fetchRolesAndPermissions();
  }, [toast]);

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && role.isActive) ||
                         (statusFilter === 'inactive' && !role.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const totalUsers = roles.reduce((sum, role) => sum + (role.userCount || 0), 0);
  const activeRoles = roles.filter(role => role.isActive).length;
  const systemRoles = roles.filter(role => role.isSystemRole).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-muted-foreground mt-1">Manage user roles and access permissions</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading roles and permissions...</span>
        </div>
      </div>
    );
  }

  const getPermissionsByCategory = (permissions: Permission[]) => {
    const categories = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
    
    return categories;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">Manage user roles and access permissions</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="mobile-responsive-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Roles</p>
                <p className="text-3xl font-bold text-foreground">{roles.length}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Roles</p>
                <p className="text-3xl font-bold text-foreground">{activeRoles}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">System Roles</p>
                <p className="text-3xl font-bold text-foreground">{systemRoles}</p>
              </div>
              <div className="h-12 w-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles Grid */}
      <div className="mobile-responsive-grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRoles.map((role) => {
          const permissionCategories = getPermissionsByCategory(role.permissions);
          
          return (
            <Card key={role.id} className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 ${role.color} rounded-xl flex items-center justify-center text-white`}>
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{role.roleName}</CardTitle>
                        {role.isSystemRole && (
                          <Badge className="bg-gradient-primary text-white text-xs px-2 py-1">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                        <Badge className={`text-xs px-2 py-1 ${
                          role.isActive 
                            ? 'bg-gradient-secondary text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.isActive ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {role.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm mt-1">{role.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled={role.isSystemRole}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* User Count */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Assigned Users</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{role.userCount || 0}</span>
                </div>

                {/* Permissions by Category */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Permissions ({role.permissions?.length || 0})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.includes('*') ? (
                        <div className="border border-border/50 rounded-lg p-3">
                          <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-primary text-white">
                            All Permissions
                          </Badge>
                        </div>
                      ) : (
                        <div className="border border-border/50 rounded-lg p-3">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission, index) => (
                              <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                                {permission.replace(/[._]/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No permissions assigned
                      </div>
                    )}
                  </div>
                </div>

                {/* Role Info */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    <p>Assigned: {formatDate(role.assignedAt)}</p>
                    <p>Status: {role.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex gap-2">
                    {!role.isSystemRole && (
                      <>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No roles found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RolesPage;