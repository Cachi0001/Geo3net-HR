import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Filter, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    title: string;
  };
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on-leave';
  hireDate: string;
  avatar?: string;
  skills?: string[];
  salary?: number;
}

// Fallback mock data for when API is unavailable
const fallbackEmployees: Employee[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    fullName: 'John Doe',
    email: 'john.doe@go3net.com',
    phoneNumber: '+234 801 234 5678',
    department: { id: '1', name: 'Engineering' },
    position: { id: '1', title: 'Senior Developer' },
    employmentStatus: 'active',
    hireDate: '2023-01-15',
    skills: ['React', 'TypeScript', 'Node.js']
  },
  {
    id: '2',
    employeeId: 'EMP002',
    fullName: 'Jane Smith',
    email: 'jane.smith@go3net.com',
    phoneNumber: '+234 802 345 6789',
    department: { id: '2', name: 'Design' },
    position: { id: '2', title: 'UI/UX Designer' },
    employmentStatus: 'active',
    hireDate: '2023-03-20',
    skills: ['Figma', 'Adobe XD', 'Prototyping']
  },
  {
    id: '3',
    employeeId: 'EMP003',
    fullName: 'Mike Johnson',
    email: 'mike.johnson@go3net.com',
    phoneNumber: '+234 803 456 7890',
    department: { id: '3', name: 'Marketing' },
    position: { id: '3', title: 'Marketing Manager' },
    employmentStatus: 'on-leave',
    hireDate: '2022-11-10',
    skills: ['Digital Marketing', 'SEO', 'Analytics']
  },
  {
    id: '4',
    employeeId: 'EMP004',
    fullName: 'Sarah Wilson',
    email: 'sarah.wilson@go3net.com',
    phoneNumber: '+234 804 567 8901',
    department: { id: '4', name: 'HR' },
    position: { id: '4', title: 'HR Specialist' },
    employmentStatus: 'active',
    hireDate: '2023-05-08',
    skills: ['Recruitment', 'Employee Relations', 'Payroll']
  },
  {
    id: '5',
    employeeId: 'EMP005',
    fullName: 'David Brown',
    email: 'david.brown@go3net.com',
    phoneNumber: '+234 805 678 9012',
    department: { id: '5', name: 'Sales' },
    position: { id: '5', title: 'Sales Representative' },
    employmentStatus: 'inactive',
    hireDate: '2022-08-22',
    skills: ['Sales', 'CRM', 'Customer Relations']
  }
];

const EmployeesPage: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getEmployees({
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        search: searchTerm || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      
      if (response.success && response.data) {
        setEmployees(response.data.employees || []);
        setPagination(prev => ({ ...prev, total: response.data.total || 0 }));
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees. Using fallback data.',
        variant: 'destructive'
      });
      // Use fallback data
      setEmployees(fallbackEmployees);
      setPagination(prev => ({ ...prev, total: fallbackEmployees.length }));
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.page, searchTerm, filterStatus, toast]);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (employee.department?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || employee.employmentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'inactive':
      case 'terminated':
        return 'bg-gradient-to-r from-red-400 to-red-600 text-white';
      case 'on-leave':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Engineering': 'bg-blue-500',
      'Design': 'bg-purple-500',
      'Marketing': 'bg-orange-500',
      'HR': 'bg-cyan-500',
      'Sales': 'bg-pink-500'
    };
    return colors[department as keyof typeof colors] || 'bg-blue-500';
  };

  const handleSearch = () => {
    loadEmployees();
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
    // Trigger reload with new filter
    setTimeout(loadEmployees, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their information</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on-leave">On Leave</option>
              </select>
              <Button 
                onClick={handleSearch}
                variant="outline" 
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold text-foreground">{pagination.total}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">{employees.filter(e => e.employmentStatus === 'active').length}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold text-foreground">{employees.filter(e => e.employmentStatus === 'on-leave').length}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-foreground">{new Set(employees.map(e => e.department?.name).filter(Boolean)).size}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="bg-gradient-card shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {employee.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{employee.fullName}</CardTitle>
                    <CardDescription className="text-sm">{employee.position?.title || 'No Position'}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(employee.employmentStatus)}>
                  {employee.employmentStatus.replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{employee.email}</span>
              </div>
              {employee.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{employee.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>ID: {employee.employeeId}</span>
              </div>
              {employee.skills && employee.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {employee.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {employee.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{employee.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline" className={`${getDepartmentColor(employee.department?.name || 'Unknown')} text-white border-0`}>
                  {employee.department?.name || 'No Department'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(employee.hireDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No employees found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeesPage;