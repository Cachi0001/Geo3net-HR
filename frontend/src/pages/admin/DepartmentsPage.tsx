import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
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
  manager: {
    name: string;
    email: string;
    phone: string;
  };
  employeeCount: number;
  budget: number;
  budgetUsed: number;
  projects: {
    active: number;
    completed: number;
    total: number;
  };
  performance: number;
  location: string;
  established: string;
  color: string;
}

interface DepartmentStats {
  department: string;
  employees: number;
  present: number;
  absent: number;
  performance: number;
}

// Fallback data for when API is unavailable
const fallbackDepartments: Department[] = [
  {
    id: '1',
    name: 'Engineering',
    description: 'Software development and technical innovation',
    manager: {
      name: 'John Doe',
      email: 'john.doe@go3net.com',
      phone: '+234 801 234 5678'
    },
    employeeCount: 15,
    budget: 5000000,
    budgetUsed: 3200000,
    projects: {
      active: 8,
      completed: 24,
      total: 32
    },
    performance: 87,
    location: 'Lagos Office - Floor 3',
    established: '2020-01-15',
    color: 'bg-blue-500'
  },
  {
    id: '2',
    name: 'Design',
    description: 'UI/UX design and creative solutions',
    manager: {
      name: 'Jane Smith',
      email: 'jane.smith@go3net.com',
      phone: '+234 802 345 6789'
    },
    employeeCount: 8,
    budget: 2500000,
    budgetUsed: 1800000,
    projects: {
      active: 5,
      completed: 18,
      total: 23
    },
    performance: 93,
    location: 'Lagos Office - Floor 2',
    established: '2020-03-20',
    color: 'bg-purple-500'
  },
  {
    id: '3',
    name: 'Marketing',
    description: 'Brand promotion and customer acquisition',
    manager: {
      name: 'Mike Johnson',
      email: 'mike.johnson@go3net.com',
      phone: '+234 803 456 7890'
    },
    employeeCount: 12,
    budget: 3500000,
    budgetUsed: 2900000,
    projects: {
      active: 6,
      completed: 15,
      total: 21
    },
    performance: 88,
    location: 'Abuja Office - Floor 1',
    established: '2020-05-10',
    color: 'bg-orange-500'
  },
  {
    id: '4',
    name: 'Human Resources',
    description: 'Employee management and organizational development',
    manager: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@go3net.com',
      phone: '+234 804 567 8901'
    },
    employeeCount: 6,
    budget: 2000000,
    budgetUsed: 1400000,
    projects: {
      active: 3,
      completed: 12,
      total: 15
    },
    performance: 90,
    location: 'Lagos Office - Floor 1',
    established: '2020-02-01',
    color: 'bg-cyan-500'
  },
  {
    id: '5',
    name: 'Sales',
    description: 'Revenue generation and client relationships',
    manager: {
      name: 'David Brown',
      email: 'david.brown@go3net.com',
      phone: '+234 805 678 9012'
    },
    employeeCount: 10,
    budget: 3000000,
    budgetUsed: 2100000,
    projects: {
      active: 7,
      completed: 20,
      total: 27
    },
    performance: 85,
    location: 'Port Harcourt Office',
    established: '2020-04-15',
    color: 'bg-pink-500'
  }
];

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      // Try to get department stats from dashboard API
      const departmentStats = await apiClient.getDepartmentStats();
      
      // Convert department stats to department format
      const departmentsFromStats = departmentStats.map((stat: DepartmentStats, index: number) => ({
        id: (index + 1).toString(),
        name: stat.department,
        description: `${stat.department} department operations`,
        manager: {
          name: 'Department Manager',
          email: `manager@${stat.department.toLowerCase().replace(/\s+/g, '')}.go3net.com`,
          phone: '+234 80' + (1000000 + index * 111111).toString().slice(0, 8)
        },
        employeeCount: stat.employees,
        budget: stat.employees * 200000, // Estimated budget per employee
        budgetUsed: Math.floor(stat.employees * 200000 * 0.7), // 70% utilization
        projects: {
          active: Math.floor(stat.employees / 3),
          completed: Math.floor(stat.employees / 2),
          total: Math.floor(stat.employees / 2) + Math.floor(stat.employees / 3)
        },
        performance: stat.performance,
        location: index % 2 === 0 ? 'Lagos Office' : 'Abuja Office',
        established: '2020-0' + (index + 1) + '-15',
        color: ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500'][index % 5]
      }));
      
      setDepartments(departmentsFromStats);
    } catch (error) {
      console.error('Failed to load departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments. Using fallback data.',
        variant: 'destructive'
      });
      setDepartments(fallbackDepartments);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.manager.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEmployees = departments.reduce((sum, dept) => sum + dept.employeeCount, 0);
  const totalBudget = departments.reduce((sum, dept) => sum + dept.budget, 0);
  const totalBudgetUsed = departments.reduce((sum, dept) => sum + dept.budgetUsed, 0);
  const avgPerformance = departments.reduce((sum, dept) => sum + dept.performance, 0) / departments.length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1">Manage organizational departments and their performance</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
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

      {/* Overview Stats - Mobile First: 2x2, Tablet: 2x2, Desktop: 4x1 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Departments</p>
                <p className="text-3xl font-bold text-foreground">{departments.length}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-foreground">{totalEmployees}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Budget Utilization</p>
                <p className="text-3xl font-bold text-foreground">{Math.round((totalBudgetUsed / totalBudget) * 100)}%</p>
              </div>
              <div className="h-12 w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg Performance</p>
                <p className="text-3xl font-bold text-foreground">{Math.round(avgPerformance)}%</p>
              </div>
              <div className="h-12 w-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="bg-gradient-card shadow-xl border-0 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 ${department.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                    {department.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{department.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{department.description}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Manager Info */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Department Manager</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {department.manager.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium">{department.manager.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{department.manager.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{department.manager.phone}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{department.employeeCount}</p>
                  <p className="text-xs text-blue-600">Employees</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{department.performance}%</p>
                  <p className="text-xs text-green-600">Performance</p>
                </div>
              </div>

              {/* Projects */}
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

              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Budget Utilization</span>
                  <span className="text-sm text-muted-foreground">{Math.round((department.budgetUsed / department.budget) * 100)}%</span>
                </div>
                <Progress value={(department.budgetUsed / department.budget) * 100} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Used: {formatCurrency(department.budgetUsed)}</span>
                  <span>Total: {formatCurrency(department.budget)}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{department.location}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Est. {new Date(department.established).getFullYear()}</span>
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