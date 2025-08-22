import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface PayrollPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';
  processedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayrollRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimePay: number;
  allowances: number;
  bonuses: number;
  grossPay: number;
  taxDeduction: number;
  pensionDeduction: number;
  insuranceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Fallback data for when API is unavailable
const fallbackPayrollPeriods: PayrollPeriod[] = [
  {
    id: '1',
    name: 'January 2024',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    payDate: '2024-02-05',
    status: 'paid',
    processedBy: 'HR Admin',
    approvedBy: 'Finance Manager',
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-02-05T15:30:00Z'
  },
  {
    id: '2',
    name: 'February 2024',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    payDate: '2024-03-05',
    status: 'approved',
    processedBy: 'HR Admin',
    approvedBy: 'Finance Manager',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-03-01T12:00:00Z'
  },
  {
    id: '3',
    name: 'March 2024',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    payDate: '2024-04-05',
    status: 'processing',
    processedBy: 'HR Admin',
    createdAt: '2024-03-25T10:00:00Z',
    updatedAt: '2024-03-28T14:20:00Z'
  }
];

const fallbackPayrollRecords: PayrollRecord[] = [
  {
    id: '1',
    payrollPeriodId: '1',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    department: 'Engineering',
    basicSalary: 150000,
    overtimeHours: 8,
    overtimeRate: 2500,
    overtimePay: 20000,
    allowances: 25000,
    bonuses: 10000,
    grossPay: 205000,
    taxDeduction: 30750,
    pensionDeduction: 12000,
    insuranceDeduction: 5000,
    otherDeductions: 2000,
    totalDeductions: 49750,
    netPay: 155250,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'paid',
    paymentDate: '2024-02-05',
    paymentReference: 'PAY-2024-001',
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-02-05T15:30:00Z'
  },
  {
    id: '2',
    payrollPeriodId: '1',
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    department: 'Design',
    basicSalary: 120000,
    overtimeHours: 4,
    overtimeRate: 2000,
    overtimePay: 8000,
    allowances: 20000,
    bonuses: 5000,
    grossPay: 153000,
    taxDeduction: 22950,
    pensionDeduction: 9600,
    insuranceDeduction: 4000,
    otherDeductions: 1500,
    totalDeductions: 38050,
    netPay: 114950,
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'paid',
    paymentDate: '2024-02-05',
    paymentReference: 'PAY-2024-002',
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-02-05T15:30:00Z'
  }
];

const PayrollPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('periods');
  const [isCreatePeriodOpen, setIsCreatePeriodOpen] = useState(false);
  const { toast } = useToast();

  // Load payroll data
  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      // Use fallback data for now since API endpoints may not be implemented
      console.warn('Using fallback payroll data - API endpoints not implemented');
      setPayrollPeriods(fallbackPayrollPeriods);
      setPayrollRecords(fallbackPayrollRecords);
      
      // TODO: Implement API calls when backend is ready
      // const periodsResponse = await apiClient.getPayrollPeriods();
      // const recordsResponse = await apiClient.getPayrollRecords();
      
    } catch (error) {
      console.error('Error loading payroll data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payroll data. Using sample data.',
        variant: 'destructive'
      });
      setPayrollPeriods(fallbackPayrollPeriods);
      setPayrollRecords(fallbackPayrollRecords);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  // Filter payroll records
  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = selectedPeriod === 'all' || record.payrollPeriodId === selectedPeriod;
    const matchesStatus = statusFilter === 'all' || record.paymentStatus === statusFilter;
    
    return matchesSearch && matchesPeriod && matchesStatus;
  });

  // Calculate summary statistics
  const totalGrossPay = filteredRecords.reduce((sum, record) => sum + record.grossPay, 0);
  const totalNetPay = filteredRecords.reduce((sum, record) => sum + record.netPay, 0);
  const totalDeductions = filteredRecords.reduce((sum, record) => sum + record.totalDeductions, 0);
  const paidRecords = filteredRecords.filter(record => record.paymentStatus === 'paid').length;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading payroll data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage employee payroll and compensation</p>
        </div>
        <Button className="btn-primary w-full sm:w-auto" onClick={() => setIsCreatePeriodOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Payroll Period
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mobile-responsive-grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card className="metric-card">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mobile-text-xs font-medium text-muted-foreground">Total Gross Pay</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGrossPay)}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Net Pay</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalNetPay)}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-secondary rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalDeductions)}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Records</p>
                <p className="text-2xl font-bold text-foreground">{paidRecords}</p>
              </div>
              <div className="h-10 w-10 bg-gradient-success rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-6">
          {/* Payroll Periods */}
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardHeader>
              <CardTitle>Payroll Periods</CardTitle>
              <CardDescription>Manage payroll processing periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {payrollPeriods.map((period) => (
                  <div key={period.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-foreground">{period.name}</h3>
                        {getStatusBadge(period.status)}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Period: {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</span>
                        <span>Pay Date: {new Date(period.payDate).toLocaleDateString()}</span>
                        {period.processedBy && <span>Processed by: {period.processedBy}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          {/* Filters */}
          <Card className="bg-gradient-card shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {payrollPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Records */}
          <div className="grid gap-4">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="bg-gradient-card shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{record.employeeName}</h3>
                        {getStatusBadge(record.paymentStatus)}
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {record.department}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Gross Pay:</span>
                          <p className="font-medium text-foreground">{formatCurrency(record.grossPay)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deductions:</span>
                          <p className="font-medium text-foreground">{formatCurrency(record.totalDeductions)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net Pay:</span>
                          <p className="font-medium text-green-600">{formatCurrency(record.netPay)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment Method:</span>
                          <p className="font-medium text-foreground">{record.paymentMethod}</p>
                        </div>
                      </div>
                      {record.paymentDate && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Paid on: {new Date(record.paymentDate).toLocaleDateString()}
                          {record.paymentReference && ` | Ref: ${record.paymentReference}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Payslip
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <Card className="bg-gradient-card shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No payroll records found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Payroll Period Dialog */}
      <Dialog open={isCreatePeriodOpen} onOpenChange={setIsCreatePeriodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Payroll Period</DialogTitle>
            <DialogDescription>
              Set up a new payroll processing period for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="periodName">Period Name</Label>
              <Input id="periodName" placeholder="e.g., April 2024" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="payDate">Pay Date</Label>
              <Input id="payDate" type="date" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatePeriodOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreatePeriodOpen(false)}>
                Create Period
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPage;