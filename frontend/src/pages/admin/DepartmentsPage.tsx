import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Loader2
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  manager_id?: string;
  manager?: {
    id: string;
    full_name: string;
    email: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Additional computed fields for display
  employeeCount?: number;
  budget?: number;
  budgetUsed?: number;
  projects?: {
    active: number;
    completed: number;
    total: number;
  };
  performance?: number;
  location?: string;
  color?: string;
}



const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    manager_id: 'no-manager'
  });

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDepartments();

      if (response.success && response.data) {
        // Transform backend data to frontend format
        const departmentArray = response.data.departments || response.data;
        const transformedDepartments = departmentArray.map((dept: any, index: number) => ({
          ...dept,
          manager: dept.manager ? {
            full_name: dept.manager.full_name,
            email: dept.manager.email,
            phone: dept.manager.phone || 'N/A'
          } : {
            full_name: 'No Manager Assigned',
            email: 'no-manager@go3net.com',
            phone: 'N/A'
          },
          employeeCount: dept.employee_count || 0,
          budget: dept.budget || 0,
          budgetUsed: dept.budget_used || 0,
          projects: dept.projects || {
            active: 0,
            completed: 0,
            total: 0
          },
          performance: dept.performance || 0,
          location: dept.location || 'Not specified',
          established: dept.created_at,
          color: ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500'][index % 5]
        }));

        setDepartments(transformedDepartments);
      } else {
        console.warn('No department data received from API');
        setDepartments([]);
        toast({
          title: 'Info',
          description: 'No departments found. Create your first department.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments. Please check your connection.',
        variant: 'destructive'
      });
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadEmployees = useCallback(async () => {
    try {
      const response = await apiClient.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  }, []);

  const handleCreateDepartment = async () => {
    if (!newDepartment.name || !newDepartment.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.createDepartment({
        name: newDepartment.name,
        description: newDepartment.description,
        managerId: newDepartment.manager_id === 'no-manager' || !newDepartment.manager_id ? undefined : newDepartment.manager_id
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Department created successfully!'
        });
        setIsCreateModalOpen(false);
        setNewDepartment({ name: '', description: '', manager_id: 'no-manager' });
        loadDepartments();
      } else {
        throw new Error(response.message || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create department.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, [loadDepartments, loadEmployees]);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.manager?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = departments.reduce((sum, dept) => sum + (dept.employeeCount || 0), 0);
  const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0);
  const totalBudgetUsed = departments.reduce((sum, dept) => sum + (dept.budgetUsed || 0), 0);
  const avgPerformance = departments.length > 0 ? departments.reduce((sum, dept) => sum + (dept.performance || 0), 0) / departments.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading departments...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage organizational departments and their performance</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Engineering, Marketing"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the department's role and responsibilities"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manager">Department Manager (Optional)</Label>
                <Select
                  value={newDepartment.manager_id}
                  onValueChange={(value) => setNewDepartment({ ...newDepartment, manager_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No manager</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName || employee.full_name} - {employee.position || 'Employee'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateDepartment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Department'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments by name, description, or manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats - Mobile First: 2x2, Desktop: 4x1 */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground mb-1">Total Departments</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">{departments.length}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground mb-1">Total Employees</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">{totalEmployees}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground mb-1">Budget Used</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">{Math.round((totalBudgetUsed / totalBudget) * 100)}%</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground mb-1">Avg Performance</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground">{Math.round(avgPerformance)}%</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="mobile-responsive-grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 ${department.color} rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg`}>
                    {department.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="mobile-text-base truncate">{department.name}</CardTitle>
                    <CardDescription className="mobile-text-xs mt-1 line-clamp-1">{department.description}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-4">
              {/* Manager Info */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-3 rounded-lg border">
                <h4 className="font-semibold mobile-text-xs text-muted-foreground mb-2">Department Manager</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
                      {(department.manager?.full_name || 'N/A').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="font-medium mobile-text-sm truncate">{department.manager?.full_name || 'No Manager Assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 mobile-text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{department.manager?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 mobile-text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span>{(department.manager as any)?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{department.employeeCount || 0}</p>
                  <p className="text-xs text-blue-600">Employees</p>
                </div>
                <div className="text-center p-2 sm:p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{department.performance || 0}%</p>
                  <p className="text-xs text-green-600">Performance</p>
                </div>
              </div>

              {/* Projects */}
              {department.projects && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Projects</span>
                    <span className="text-sm text-muted-foreground">{department.projects.completed}/{department.projects.total}</span>
                  </div>
                  <Progress value={(department.projects.completed / department.projects.total) * 100} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{department.projects.active} active</span>
                    <span>{department.projects.completed} completed</span>
                  </div>
                </div>
              )}

              {/* Budget */}
              {department.budget && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Budget Utilization</span>
                    <span className="text-sm text-muted-foreground">{Math.round(((department.budgetUsed || 0) / department.budget) * 100)}%</span>
                  </div>
                  <Progress value={((department.budgetUsed || 0) / department.budget) * 100} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {formatCurrency(department.budgetUsed || 0)}</span>
                    <span>Total: {formatCurrency(department.budget)}</span>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{department.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Est. {new Date(department.created_at).getFullYear()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No departments found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentsPage;