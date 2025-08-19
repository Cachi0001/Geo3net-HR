import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Filter, Mail, Phone, MapPin } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: string;
  avatar?: string;
  location: string;
}

// Mock data - replace with real API calls
const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@go3net.com',
    phone: '+234 801 234 5678',
    department: 'Engineering',
    position: 'Senior Developer',
    status: 'active',
    joinDate: '2023-01-15',
    location: 'Lagos, Nigeria'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@go3net.com',
    phone: '+234 802 345 6789',
    department: 'Design',
    position: 'UI/UX Designer',
    status: 'active',
    joinDate: '2023-03-20',
    location: 'Abuja, Nigeria'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@go3net.com',
    phone: '+234 803 456 7890',
    department: 'Marketing',
    position: 'Marketing Manager',
    status: 'on-leave',
    joinDate: '2022-11-10',
    location: 'Port Harcourt, Nigeria'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@go3net.com',
    phone: '+234 804 567 8901',
    department: 'HR',
    position: 'HR Specialist',
    status: 'active',
    joinDate: '2023-05-08',
    location: 'Kano, Nigeria'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@go3net.com',
    phone: '+234 805 678 9012',
    department: 'Sales',
    position: 'Sales Representative',
    status: 'inactive',
    joinDate: '2022-08-22',
    location: 'Ibadan, Nigeria'
  }
];

const EmployeesPage: React.FC = () => {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || employee.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'inactive':
        return 'bg-gradient-to-r from-red-400 to-red-600 text-white';
      case 'on-leave':
        return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Engineering': 'nav-accent-blue',
      'Design': 'nav-accent-purple',
      'Marketing': 'nav-accent-orange',
      'HR': 'nav-accent-cyan',
      'Sales': 'nav-accent-pink'
    };
    return colors[department as keyof typeof colors] || 'nav-accent-blue';
  };

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
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-leave">On Leave</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
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
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{employees.filter(e => e.status === 'active').length}</p>
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
                <p className="text-2xl font-bold text-foreground">{employees.filter(e => e.status === 'on-leave').length}</p>
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
                <p className="text-2xl font-bold text-foreground">{new Set(employees.map(e => e.department)).size}</p>
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
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{employee.name}</CardTitle>
                    <CardDescription className="text-sm">{employee.position}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(employee.status)}>
                  {employee.status.replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{employee.location}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline" className={`${getDepartmentColor(employee.department)} text-white border-0`}>
                  {employee.department}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(employee.joinDate).toLocaleDateString()}
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