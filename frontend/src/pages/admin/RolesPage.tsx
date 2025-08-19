import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  MoreVertical
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  permissions: Permission[];
  isSystemRole: boolean;
  createdDate: string;
  lastModified: string;
  status: 'active' | 'inactive';
}

// Mock permissions data
const mockPermissions: Permission[] = [
  { id: '1', name: 'view_dashboard', description: 'View dashboard and analytics', category: 'Dashboard' },
  { id: '2', name: 'manage_employees', description: 'Create, edit, and delete employee records', category: 'Employee Management' },
  { id: '3', name: 'view_employees', description: 'View employee information', category: 'Employee Management' },
  { id: '4', name: 'manage_departments', description: 'Create and manage departments', category: 'Department Management' },
  { id: '5', name: 'view_departments', description: 'View department information', category: 'Department Management' },
  { id: '6', name: 'manage_tasks', description: 'Create, assign, and manage tasks', category: 'Task Management' },
  { id: '7', name: 'view_tasks', description: 'View assigned tasks', category: 'Task Management' },
  { id: '8', name: 'manage_roles', description: 'Create and manage user roles', category: 'Role Management' },
  { id: '9', name: 'view_reports', description: 'Access system reports', category: 'Reports' },
  { id: '10', name: 'manage_settings', description: 'Modify system settings', category: 'System Settings' },
  { id: '11', name: 'manage_time_tracking', description: 'Manage time tracking records', category: 'Time Management' },
  { id: '12', name: 'view_time_tracking', description: 'View time tracking data', category: 'Time Management' }
];

// Mock roles data
const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    color: 'nav-accent-purple',
    userCount: 2,
    permissions: mockPermissions,
    isSystemRole: true,
    createdDate: '2020-01-01',
    lastModified: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'HR Manager',
    description: 'Human resources management with employee oversight',
    color: 'nav-accent-blue',
    userCount: 3,
    permissions: mockPermissions.filter(p => 
      ['view_dashboard', 'manage_employees', 'view_employees', 'view_departments', 'view_reports', 'manage_time_tracking', 'view_time_tracking'].includes(p.name)
    ),
    isSystemRole: false,
    createdDate: '2020-01-15',
    lastModified: '2024-01-20',
    status: 'active'
  },
  {
    id: '3',
    name: 'Department Manager',
    description: 'Manage department operations and team members',
    color: 'nav-accent-cyan',
    userCount: 8,
    permissions: mockPermissions.filter(p => 
      ['view_dashboard', 'view_employees', 'view_departments', 'manage_tasks', 'view_tasks', 'view_reports', 'view_time_tracking'].includes(p.name)
    ),
    isSystemRole: false,
    createdDate: '2020-02-01',
    lastModified: '2024-01-18',
    status: 'active'
  },
  {
    id: '4',
    name: 'Team Lead',
    description: 'Lead team projects and manage task assignments',
    color: 'nav-accent-orange',
    userCount: 12,
    permissions: mockPermissions.filter(p => 
      ['view_dashboard', 'view_employees', 'manage_tasks', 'view_tasks', 'view_time_tracking'].includes(p.name)
    ),
    isSystemRole: false,
    createdDate: '2020-03-01',
    lastModified: '2024-01-22',
    status: 'active'
  },
  {
    id: '5',
    name: 'Employee',
    description: 'Standard employee access with basic permissions',
    color: 'nav-accent-pink',
    userCount: 45,
    permissions: mockPermissions.filter(p => 
      ['view_dashboard', 'view_tasks', 'view_time_tracking'].includes(p.name)
    ),
    isSystemRole: false,
    createdDate: '2020-01-01',
    lastModified: '2024-01-10',
    status: 'active'
  },
  {
    id: '6',
    name: 'Intern',
    description: 'Limited access for temporary team members',
    color: 'bg-gray-500',
    userCount: 8,
    permissions: mockPermissions.filter(p => 
      ['view_dashboard', 'view_tasks'].includes(p.name)
    ),
    isSystemRole: false,
    createdDate: '2023-06-01',
    lastModified: '2024-01-05',
    status: 'inactive'
  }
];

const RolesPage: React.FC = () => {
  const [roles] = useState<Role[]>(mockRoles);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || role.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);
  const activeRoles = roles.filter(role => role.status === 'active').length;
  const systemRoles = roles.filter(role => role.isSystemRole).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="h-12 w-12 nav-accent-cyan rounded-lg flex items-center justify-center">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <CardTitle className="text-xl">{role.name}</CardTitle>
                        {role.isSystemRole && (
                          <Badge className="bg-gradient-primary text-white text-xs px-2 py-1">
                            <Lock className="h-3 w-3 mr-1" />
                            System
                          </Badge>
                        )}
                        <Badge className={`text-xs px-2 py-1 ${
                          role.status === 'active' 
                            ? 'bg-gradient-secondary text-white' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.status === 'active' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {role.status}
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
                  <span className="text-2xl font-bold text-blue-600">{role.userCount}</span>
                </div>

                {/* Permissions by Category */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Permissions ({role.permissions.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {Object.entries(permissionCategories).map(([category, permissions]) => (
                      <div key={category} className="border border-border/50 rounded-lg p-3">
                        <h5 className="font-medium text-sm text-foreground mb-2">{category}</h5>
                        <div className="flex flex-wrap gap-1">
                          {permissions.map((permission) => (
                            <Badge key={permission.id} variant="secondary" className="text-xs px-2 py-1">
                              {permission.name.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role Info */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    <p>Created: {formatDate(role.createdDate)}</p>
                    <p>Modified: {formatDate(role.lastModified)}</p>
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