import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Filter, Mail, Phone, MapPin, Loader2, Shield, CheckCircle, AlertTriangle, MoreVertical } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  employmentStatus: 'active' | 'inactive' | 'terminated' | 'on_leave';
  hireDate: string;
  avatar?: string;
  skills?: string[];
  salary?: number;
  // Account status fields
  userId?: string;
  accountStatus?: 'pending_setup' | 'active' | 'suspended';
  isTemporaryPassword?: boolean;
  lastLogin?: string;
}

// No fallback data - all data should come from the API

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  // Account management state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationLoading, setActivationLoading] = useState(false);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
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
        setError('Failed to load employees. Please try again.');
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Unable to connect to the server. Please check your connection and try again.');
      toast({
        title: 'Error',
        description: 'Unable to connect to the server. Please check your connection and try again.',
        variant: 'destructive'
      });
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [pagination.limit, pagination.page, searchTerm, filterStatus]);

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
      case 'on_leave':
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

  const getAccountStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'pending_setup':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'suspended':
        return 'bg-gradient-to-r from-red-400 to-red-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    }
  };

  const getAccountStatusIcon = (status?: string) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'pending_setup':
        return AlertTriangle;
      case 'suspended':
        return Shield;
      default:
        return AlertTriangle;
    }
  };

  const getAccountStatusText = (employee: Employee) => {
    if (!employee.userId) {
      return 'No Account';
    }
    switch (employee.accountStatus) {
      case 'active':
        return 'Account Active';
      case 'pending_setup':
        return 'Setup Pending';
      case 'suspended':
        return 'Account Suspended';
      default:
        return 'Status Unknown';
    }
  };

  const handleSearch = () => {
    loadEmployees();
  };

  const handleFilterChange = (newFilter: string) => {
    setFilterStatus(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
    // The useEffect will automatically trigger loadEmployees when filterStatus changes
  };

  const handleActivateAccount = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowActivationModal(true);
  };

  const confirmActivateAccount = async () => {
    if (!selectedEmployee) return;
    
    try {
      setActivationLoading(true);
      const response = await apiClient.activateEmployeeAccount(selectedEmployee.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Employee account activated successfully!',
        });
        setShowActivationModal(false);
        setSelectedEmployee(null);
        loadEmployees(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to activate account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error activating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate account. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setActivationLoading(false);
    }
  };

  const handleSendInvitation = async (employee: Employee) => {
    try {
      const response = await apiClient.sendEmployeeInvitation(employee.id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invitation sent successfully!',
        });
        loadEmployees(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to send invitation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive'
      });
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your team members and their information</p>
        </div>
        <Button className="btn-primary w-full sm:w-auto" onClick={() => navigate('/dashboard/employees/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
              </select>
              <Button 
                onClick={handleSearch}
                variant="outline" 
                size="sm"
                className="w-full sm:w-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Stats */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground">Total Employees</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{pagination.total}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground">Active</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{employees.filter(e => e.employmentStatus === 'active').length}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground">On Leave</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{employees.filter(e => e.employmentStatus === 'on_leave').length}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground">Departments</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{new Set(employees.map(e => e.department?.name).filter(Boolean)).size}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      {error ? (
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Employees</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
                onClick={loadEmployees}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="mobile-responsive-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredEmployees.map((employee) => {
            const AccountStatusIcon = getAccountStatusIcon(employee.accountStatus);
            return (
              <Card key={employee.id} className="bg-gradient-card shadow-lg border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                        {employee.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="mobile-text-sm truncate">{employee.fullName}</CardTitle>
                        <CardDescription className="mobile-text-xs truncate">{employee.position?.title || 'No Position'}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge className={`${getStatusColor(employee.employmentStatus)} text-xs`}>
                        {employee.employmentStatus.replace('-', ' ')}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!employee.userId && (
                            <DropdownMenuItem onClick={() => handleSendInvitation(employee)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Invitation
                            </DropdownMenuItem>
                          )}
                          {employee.userId && employee.accountStatus === 'pending_setup' && (
                            <DropdownMenuItem onClick={() => handleActivateAccount(employee)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate Account
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/employees/${employee.id}`)}>
                            <Users className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  {/* Account Status Section */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AccountStatusIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Account Status</span>
                      </div>
                      <Badge className={`${getAccountStatusColor(employee.accountStatus)} text-xs`}>
                        {getAccountStatusText(employee)}
                      </Badge>
                    </div>
                    {employee.isTemporaryPassword && (
                      <p className="text-xs text-orange-600 mt-1">⚠️ Using temporary password</p>
                    )}
                    {employee.lastLogin && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last login: {new Date(employee.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mobile-text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  {employee.phoneNumber && (
                    <div className="flex items-center gap-2 mobile-text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{employee.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mobile-text-xs text-muted-foreground">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>ID: {employee.employeeId}</span>
                  </div>
                  {employee.skills && employee.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {employee.skills.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {employee.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{employee.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className={`${getDepartmentColor(employee.department?.name || 'Unknown')} text-white border-0 text-xs`}>
                      {employee.department?.name || 'No Dept'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(employee.hireDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!error && filteredEmployees.length === 0 && (
        <Card className="bg-gradient-card shadow-lg border-0">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No employees found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Account Activation Modal */}
      <Dialog open={showActivationModal} onOpenChange={setShowActivationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Employee Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to manually activate the account for {selectedEmployee?.fullName}? 
              This will allow them to login immediately with their current credentials.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Employee Details</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Name:</strong> {selectedEmployee.fullName}</p>
                  <p><strong>Email:</strong> {selectedEmployee.email}</p>
                  <p><strong>Employee ID:</strong> {selectedEmployee.employeeId}</p>
                  <p><strong>Current Status:</strong> {getAccountStatusText(selectedEmployee)}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Manual activation will set the account status to "Active" and allow 
                  immediate login. The employee will be notified of the activation.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowActivationModal(false)}
              disabled={activationLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmActivateAccount}
              disabled={activationLoading}
            >
              {activationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;