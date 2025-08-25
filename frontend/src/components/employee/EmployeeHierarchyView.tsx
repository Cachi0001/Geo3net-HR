import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users,
    User,
    ChevronDown,
    ChevronRight,
    Building,
    Loader2,
    Mail,
    Phone
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types/employee.types';

interface EmployeeHierarchyViewProps {
    employee: Employee;
}

interface HierarchyData {
    directReports: Array<{
        employee: Employee;
        hierarchy_level: number;
        effective_date: string;
    }>;
    managerChain: Array<{
        manager: Employee;
        hierarchy_level: number;
        effective_date: string;
    }>;
}

const EmployeeCard: React.FC<{ employee: Employee; level?: number; isManager?: boolean }> = ({
    employee,
    level = 0,
    isManager = false
}) => {
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

    return (
        <Card className={`${isManager ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} shadow-sm`}>
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {employee.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{employee.fullName}</h4>
                            <Badge className={`${getStatusColor(employee.employmentStatus)} text-xs`}>
                                {employee.employmentStatus.replace('-', ' ')}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {employee.position?.title || 'No Position'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            ID: {employee.employeeId}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{employee.email}</span>
                        </div>
                        {employee.phoneNumber && (
                            <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{employee.phoneNumber}</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const EmployeeHierarchyView: React.FC<EmployeeHierarchyViewProps> = ({ employee }) => {
    const { toast } = useToast();
    const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState({
        managers: true,
        reports: true
    });

    useEffect(() => {
        loadHierarchy();
    }, [employee.id]);

    const loadHierarchy = async () => {
        try {
            setLoading(true);
            setError(null);

            // This would call the hierarchy endpoint when implemented
            // For now, we'll show a placeholder structure

            // Mock data for demonstration
            const mockHierarchy: HierarchyData = {
                directReports: [],
                managerChain: []
            };

            // If employee has a manager, add to manager chain
            if (employee.manager) {
                mockHierarchy.managerChain.push({
                    manager: employee.manager as Employee,
                    hierarchy_level: 1,
                    effective_date: new Date().toISOString()
                });
            }

            setHierarchyData(mockHierarchy);
        } catch (error) {
            console.error('Error loading hierarchy:', error);
            setError('Failed to load hierarchy data');
            toast({
                title: 'Error',
                description: 'Failed to load hierarchy data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (section: 'managers' | 'reports') => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading hierarchy...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <Users className="h-12 w-12 mx-auto mb-4 text-red-400" />
                            <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Hierarchy</h3>
                            <p className="text-red-600 mb-4">{error}</p>
                            <Button onClick={loadHierarchy} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Current Employee */}
            <Card className="border-2 border-primary bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Current Employee
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <EmployeeCard employee={employee} />
                </CardContent>
            </Card>

            {/* Manager Chain */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Reporting Structure
                            </CardTitle>
                            <CardDescription>
                                Managers and supervisors in the chain of command
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('managers')}
                        >
                            {expandedSections.managers ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.managers && (
                    <CardContent>
                        {hierarchyData?.managerChain && hierarchyData.managerChain.length > 0 ? (
                            <div className="space-y-3">
                                {hierarchyData.managerChain.map((item, index) => (
                                    <div key={index} className="relative">
                                        {index > 0 && (
                                            <div className="absolute left-5 -top-3 w-px h-6 bg-gray-300"></div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                            <div className="flex-1">
                                                <EmployeeCard employee={item.manager} level={item.hierarchy_level} isManager />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No managers in the reporting chain</p>
                                <p className="text-sm">This employee reports to no one or data is not available</p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Direct Reports */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Direct Reports
                            </CardTitle>
                            <CardDescription>
                                Employees who report directly to {employee.fullName}
                            </CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection('reports')}
                        >
                            {expandedSections.reports ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardHeader>
                {expandedSections.reports && (
                    <CardContent>
                        {hierarchyData?.directReports && hierarchyData.directReports.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hierarchyData.directReports.map((item, index) => (
                                    <EmployeeCard key={index} employee={item.employee} level={item.hierarchy_level} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No direct reports</p>
                                <p className="text-sm">This employee does not manage anyone or data is not available</p>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Hierarchy Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>Hierarchy Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {hierarchyData?.managerChain?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Managers Above</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {hierarchyData?.directReports?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Direct Reports</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {employee.department?.name ? 1 : 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Department</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {Math.max((hierarchyData?.managerChain?.length || 0), 1)}
                            </div>
                            <div className="text-sm text-muted-foreground">Hierarchy Level</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Note about future enhancements */}
            <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            <strong>Coming Soon:</strong> Interactive organizational chart, team structure visualization,
                            and advanced hierarchy management features.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export { EmployeeHierarchyView };