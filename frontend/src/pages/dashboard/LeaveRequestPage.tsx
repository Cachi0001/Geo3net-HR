import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

const LeaveRequestPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Fetch leave requests
  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => apiClient.getLeaveRequests(),
  });

  // Create leave request mutation
  const createLeaveRequest = useMutation({
    mutationFn: (data: any) => apiClient.createLeaveRequest(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
      });
      setShowForm(false);
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit leave request',
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    if (!formData.type || !formData.startDate || !formData.endDate || !formData.reason) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return false;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      toast({
        title: 'Validation Error',
        description: 'Start date cannot be in the past',
        variant: 'destructive',
      });
      return false;
    }

    if (endDate < startDate) {
      toast({
        title: 'Validation Error',
        description: 'End date must be after start date',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.reason.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a detailed reason (at least 10 characters)',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    createLeaveRequest.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave',
    'Personal Leave',
    'Maternity/Paternity Leave',
    'Emergency Leave',
    'Bereavement Leave'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Leave Requests
          </h1>
          <p className="text-muted-foreground">Manage your time off requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* New Leave Request Form */}
      {showForm && (
        <Card className="bg-gradient-card shadow-xl border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Submit Leave Request
            </CardTitle>
            <CardDescription>Fill out the form below to request time off</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setFormData({ ...formData, startDate: e.target.value });
                      // Clear end date if it's before the new start date
                      if (formData.endDate && new Date(e.target.value) > new Date(formData.endDate)) {
                        setFormData(prev => ({ ...prev, startDate: e.target.value, endDate: '' }));
                      }
                    }}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    disabled={!formData.startDate}
                    required
                  />
                  {!formData.startDate && (
                    <p className="text-xs text-muted-foreground">Please select a start date first</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason *</Label>
                <div className="relative">
                  <Textarea
                    id="reason"
                    placeholder="Please provide a detailed reason for your leave request (minimum 10 characters)..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                    required
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs transition-colors duration-200 ${
                      formData.reason.length < 10 
                        ? 'text-red-500' 
                        : formData.reason.length >= 10 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                    }`}>
                      {formData.reason.length < 10 
                        ? `${10 - formData.reason.length} more characters needed` 
                        : 'Good! Detailed reason provided'
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.reason.length}/500
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={createLeaveRequest.isPending || formData.reason.length < 10}
                >
                  {createLeaveRequest.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ type: '', startDate: '', endDate: '', reason: '' });
                  }}
                  className="transition-all duration-200 hover:bg-gray-50"
                  disabled={createLeaveRequest.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card className="bg-gradient-card shadow-xl border-0 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            My Leave Requests
          </CardTitle>
          <CardDescription>View and track your submitted leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-muted-foreground">Loading leave requests...</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests?.data?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground animate-fade-in">
                  <Calendar className="h-16 w-16 mx-auto mb-6 opacity-50" />
                  <p className="text-lg font-medium mb-2">No leave requests found</p>
                  <p className="text-sm">Submit your first leave request using the button above</p>
                </div>
              ) : (
                leaveRequests?.data?.map((request: LeaveRequest, index: number) => (
                  <div 
                    key={request.id} 
                    className="border border-gray-200/60 rounded-xl p-6 space-y-4 bg-white/80 backdrop-filter backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg text-foreground">{request.type}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="bg-gray-50/80 rounded-lg p-3">
                      <p className="text-sm text-foreground/80 leading-relaxed">{request.reason}</p>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                      </span>
                      {request.approvedBy && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Approved by: {request.approvedBy}
                        </span>
                      )}
                    </div>
                    {request.rejectedReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 animate-slide-up">
                        <strong className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Rejection Reason:
                        </strong>
                        <p className="mt-1 ml-4">{request.rejectedReason}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequestPage;