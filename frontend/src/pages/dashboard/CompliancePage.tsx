import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, FileText, Calendar, Users, BookOpen, Zap } from 'lucide-react';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'warning' | 'non-compliant' | 'pending';
  lastReview: string;
  nextReview: string;
  owner: string;
  category: string;
}

const CompliancePage: React.FC = () => {
  // Compliance data will be loaded from API
  const complianceItems: ComplianceItem[] = [
    {
      id: '4',
      title: 'Financial Audit',
      description: 'Annual financial compliance review',
      status: 'pending',
      lastReview: '2023-12-31',
      nextReview: '2024-03-31',
      owner: 'Finance Team',
      category: 'Financial'
    },
    {
      id: '5',
      title: 'Cybersecurity Framework',
      description: 'Information security standards and data breach prevention',
      status: 'non-compliant',
      lastReview: '2023-11-15',
      nextReview: '2024-02-15',
      owner: 'IT Department',
      category: 'Security'
    }
  ];

  const complianceMetrics = {
    total: complianceItems.length,
    compliant: complianceItems.filter(item => item.status === 'compliant').length,
    warning: complianceItems.filter(item => item.status === 'warning').length,
    nonCompliant: complianceItems.filter(item => item.status === 'non-compliant').length,
    pending: complianceItems.filter(item => item.status === 'pending').length,
  };

  const overallCompliance = Math.round((complianceMetrics.compliant / complianceMetrics.total) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Calendar className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const categories = [...new Set(complianceItems.map(item => item.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Compliance Center
        </h1>
        <p className="text-muted-foreground">
          Monitor regulatory compliance and track organizational standards
        </p>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Compliance</p>
                <p className="text-3xl font-bold text-foreground">{overallCompliance}%</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <Progress value={overallCompliance} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {complianceMetrics.compliant} of {complianceMetrics.total} requirements met
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                <p className="text-2xl font-bold text-green-600">{complianceMetrics.compliant}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{complianceMetrics.warning}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">{complianceMetrics.nonCompliant}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-auto p-4 flex flex-col items-center gap-3" variant="outline">
          <FileText className="h-6 w-6 text-primary" />
          <div className="text-center">
            <p className="font-medium">Generate Report</p>
            <p className="text-xs text-muted-foreground">Create compliance summary</p>
          </div>
        </Button>

        <Button className="h-auto p-4 flex flex-col items-center gap-3" variant="outline">
          <BookOpen className="h-6 w-6 text-primary" />
          <div className="text-center">
            <p className="font-medium">Training Center</p>
            <p className="text-xs text-muted-foreground">Access compliance training</p>
          </div>
        </Button>

        <Button className="h-auto p-4 flex flex-col items-center gap-3" variant="outline">
          <Zap className="h-6 w-6 text-primary" />
          <div className="text-center">
            <p className="font-medium">Risk Assessment</p>
            <p className="text-xs text-muted-foreground">Evaluate compliance risks</p>
          </div>
        </Button>
      </div>

      {/* Compliance Items by Category */}
      {complianceItems.length > 0 ? (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = complianceItems.filter(item => item.category === category);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {category}
                  </CardTitle>
                  <CardDescription>
                    {categoryItems.length} compliance requirements in this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Owner: {item.owner} • Last Review: {new Date(item.lastReview).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">Next Review</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.nextReview).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('-', ' ')}
                          </Badge>

                          <Button variant="outline" size="sm">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Compliance Data</h3>
            <p className="text-muted-foreground">No compliance requirements found.</p>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Action Items
          </CardTitle>
          <CardDescription>Immediate attention required</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceItems
              .filter(item => item.status === 'non-compliant' || item.status === 'warning')
              .map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-red-50 border-red-200">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">{item.title}</p>
                    <p className="text-sm text-red-700">
                      {item.status === 'non-compliant' ? 'Immediate action required' : 'Review needed before next deadline'}
                    </p>
                  </div>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Take Action
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompliancePage;