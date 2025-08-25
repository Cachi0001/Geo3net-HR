import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Calendar, Building } from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Employee, UpdateEmployeeData, Department, Position } from '@/types/employee.types';

interface Manager {
  id: string;
  fullName: string;
  employeeId: string;
}

const EmployeeEditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<UpdateEmployeeData>({});
  
  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (id) {
      loadEmployee();
      loadFormData();
    }
  }, [id]);

  const loadEmployee = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployee(id);
      
      if (response.success && response.data) {
        const emp = response.data;
        setEmployee(emp);
        
        // Initialize form data with current employee data
        setFormData({
          fullName: emp.fullName,
          phoneNumber: emp.phoneNumber || '',
          dateOfBirth: emp.dateOfBirth || '',
          address: emp.address || '',
          emergencyContact: emp.emergencyContact || '',
          emergencyPhone: emp.emergencyPhone || '',
          departmentId: emp.departmentId || '',
          positionId: emp.positionId || '',
          managerId: emp.managerId || '',
          salary: emp.salary,
          employmentStatus: emp.employmentStatus,
          notes: emp.notes || ''
        });
      } else {
        setError('Failed to load employee details');
        toast({
          title: 'Error',
          description: 'Failed to load employee details',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      setError('Unable to connect to the server');
      toast({
        title: 'Error',
        description: 'Unable to connect to the server',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      
      // Load departments
      const deptResponse = await apiClient.getDepartments();
      if (deptResponse.success && deptResponse.data) {
        setDepartments(deptResponse.data.departments || []);
      }
      
      // Load positions - using mock data until positions API is implemented
      const mockPositions: Position[] = [
        { id: '1', title: 'Software Engineer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', title: 'Senior Software Engineer', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', title: 'Project Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', title: 'Team Lead', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '5', title: 'HR Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '6', title: 'Finance Manager', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
      setPositions(mockPositions);
      
      // Load managers
      const empResponse = await apiClient.getEmployees();
      if (empResponse.success && empResponse.data) {
        const managerList = empResponse.data.employees?.filter((emp: any) => 
          emp.position?.title?.toLowerCase().includes('manager') || 
          emp.position?.title?.toLowerCase().includes('lead') ||
          emp.position?.title?.toLowerCase().includes('supervisor')
        ) || [];
        setManagers(managerList);
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load form data. Some dropdowns may be empty.',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: keyof UpdateEmployeeData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.fullName?.trim()) {
      errors.push('Full name is required');
    }

    if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone number format');
    }

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        errors.push('Invalid date of birth format');
      } else {
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 16 || age > 80) {
          errors.push('Employee age must be between 16 and 80 years');
        }
      }
    }

    if (formData.salary && formData.salary < 0) {
      errors.push('Salary must be a positive number');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !employee) return;

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Failed',
        description: validationErrors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);
      
      // Only send changed fields
      const updateData: UpdateEmployeeData = {};
      
      if (formData.fullName !== employee.fullName) updateData.fullName = formData.fullName;
      if (formData.phoneNumber !== employee.phoneNumber) updateData.phoneNumber = formData.phoneNumber || undefined;
      if (formData.dateOfBirth !== employee.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth || undefined;
      if (formData.address !== employee.address) updateData.address = formData.address || undefined;
      if (formData.emergencyContact !== employee.emergencyContact) updateData.emergencyContact = formData.emergencyContact || undefined;
      if (formData.emergencyPhone !== employee.emergencyPhone) updateData.emergencyPhone = formData.emergencyPhone || undefined;
      if (formData.departmentId !== employee.departmentId) updateData.departmentId = formData.departmentId || undefined;
      if (formData.positionId !== employee.positionId) updateData.positionId = formData.positionId || undefined;
      if (formData.managerId !== employee.managerId) updateData.managerId = formData.managerId || undefined;
      if (formData.salary !== employee.salary) updateData.salary = formData.salary;
      if (formData.employmentStatus !== employee.employmentStatus) updateData.employmentStatus = formData.employmentStatus;
      if (formData.notes !== employee.notes) updateData.notes = formData.notes || undefined;

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No Changes',
          description: 'No changes were made to update.',
          variant: 'default'
        });
        return;
      }

      const response = await apiClient.updateEmployee(id, updateData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Employee updated successfully!'
        });
        navigate(`/dashboard/employees/${id}`);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update employee',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading employee details...</span>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/employees')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Employee</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadEmployee} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/employees/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Employee
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Employee</h1>
          <p className="text-muted-foreground mt-1">Update {employee.fullName}'s information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic personal details of the employee
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={employee.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Emergency contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone || ''}
                  onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Employment Details
            </CardTitle>
            <CardDescription>
              Job-related information and organizational structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={employee.hireDate.split('T')[0]}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground">Hire date cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || undefined)}
                  placeholder="Enter salary amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select 
                  value={formData.departmentId || ''} 
                  onValueChange={(value) => handleInputChange('departmentId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <SelectItem value="loading-departments" disabled>Loading departments...</SelectItem>
                    ) : departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-departments" disabled>No departments available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionId">Position</Label>
                <Select 
                  value={formData.positionId || ''} 
                  onValueChange={(value) => handleInputChange('positionId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingData ? (
                      <SelectItem value="loading-positions" disabled>Loading positions...</SelectItem>
                    ) : positions.length > 0 ? (
                      positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-positions" disabled>No positions available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager</Label>
                <Select 
                  value={formData.managerId || ''} 
                  onValueChange={(value) => handleInputChange('managerId', value === 'no-manager' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-manager">No manager</SelectItem>
                    {loadingData ? (
                      <SelectItem value="loading-managers" disabled>Loading managers...</SelectItem>
                    ) : managers.length > 0 ? (
                      managers.map((mgr) => (
                        <SelectItem key={mgr.id} value={mgr.id}>
                          {mgr.fullName} ({mgr.employeeId})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-managers" disabled>No managers available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select 
                  value={formData.employmentStatus || ''} 
                  onValueChange={(value) => handleInputChange('employmentStatus', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Additional notes and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional notes about this employee"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/employees/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating Employee...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Employee
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeEditForm;