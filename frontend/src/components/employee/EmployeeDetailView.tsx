import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Users, 
  Award, 
  Edit,
  Loader2,
  Shield,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { EmployeeSkillsManager } from './EmployeeSkillsManager';
import { EmployeeHierarchyView } from './EmployeeHierarchyView';
import type { Employee } from '@/types/employee.types';

const EmployeeDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEmployee();
    }
  }, [id]);

  const loadEmployee = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getEmployee(id);
      
      if (response.success && response.data) {
        setEmployee(response.data);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
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
      <div className="flex items-center justify-between">
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">{employee.fullName}</h1>
            <p className="text-muted-foreground mt-1">
              {employee.position?.title || 'No Position'} • {employee.department?.name || 'No Department'}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Employee
        </Button>
      </div>

      {/* Employee Overview Card */}
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-xl">
                {employee.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <CardTitle className="text-xl">{employee.fullName}</CardTitle>
                <CardDescription className="text-base">
                  Employee ID: {employee.employeeId}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getStatusColor(employee.employmentStatus)}`}>
                    {employee.employmentStatus.replace('-', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.email}</span>
                </div>
                {employee.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phoneNumber}</span>
                  </div>
                )}
                {employee.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.address}</span>
                  </div>
                )}
                {employee.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Born: {formatDate(employee.dateOfBirth)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Employment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Hired: {formatDate(employee.hireDate)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.department?.name || 'No Department'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.position?.title || 'No Position'}</span>
                </div>
                {employee.manager && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Manager: {employee.manager.fullName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {(employee.emergencyContact || employee.emergencyPhone) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employee.emergencyContact && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.emergencyContact}</span>
                    </div>
                  )}
                  {employee.emergencyPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.emergencyPhone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {employee.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{employee.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <EmployeeSkillsManager employee={employee} onUpdate={loadEmployee} />
        </TabsContent>

        <TabsContent value="hierarchy">
          <EmployeeHierarchyView employee={employee} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Employee History</CardTitle>
              <CardDescription>
                Audit logs and change history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>History view coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDetailView;