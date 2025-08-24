import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Award, TrendingUp, Clock, Users, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager' || user?.role === 'hr-admin' || user?.role === 'super-admin';

  // Performance data will be loaded from API
  const performanceData = {
    overallScore: 0,
    goals: [],
    reviews: []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': case 'completed': return 'bg-green-500';
      case 'needs-attention': return 'bg-yellow-500';
      case 'behind': case 'pending': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Target className="h-8 w-8 text-primary" />
          Performance Management
        </h1>
        <p className="text-muted-foreground">
          {isManager ? 'Manage team performance and conduct reviews' : 'Track your performance and goals'}
        </p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold text-foreground">{performanceData.overallScore}%</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold text-foreground">{performanceData.goals.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reviews</p>
                <p className="text-2xl font-bold text-foreground">
                  {performanceData.reviews.filter((r: any) => r.status === 'completed').length}
                </p>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvement</p>
                <p className="text-2xl font-bold text-foreground">+5%</p>
                <p className="text-xs text-muted-foreground">vs last quarter</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Goals
            </CardTitle>
            <CardDescription>Track your current objectives and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData.goals.length > 0 ? (
              performanceData.goals.map((goal: any) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal.title}</span>
                    <Badge variant="outline" className={`${getStatusColor(goal.status)} text-white`}>
                      {goal.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{goal.progress}% complete</span>
                    <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No performance goals set</p>
              </div>
            )}
            <Button className="w-full mt-4" variant="outline">
              <Target className="mr-2 h-4 w-4" />
              Set New Goal
            </Button>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Performance Reviews
            </CardTitle>
            <CardDescription>Past and upcoming performance evaluations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData.reviews.length > 0 ? (
              performanceData.reviews.map((review: any) => (
                <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{review.period}</p>
                    <p className="text-sm text-muted-foreground">Reviewer: {review.reviewer}</p>
                  </div>
                  <div className="text-right">
                    {review.status === 'completed' ? (
                      <p className="text-lg font-bold text-primary">{review.score}%</p>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No performance reviews available</p>
              </div>
            )}
            {isManager && (
              <Button className="w-full mt-4" variant="outline">
                <Star className="mr-2 h-4 w-4" />
                Schedule Review
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Action Items
            </CardTitle>
            <CardDescription>Upcoming performance management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="font-medium">Q1 Performance Reviews Due</p>
                  <p className="text-sm text-muted-foreground">3 reviews pending completion</p>
                </div>
                <Button size="sm">Review</Button>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Team Goal Setting Session</p>
                  <p className="text-sm text-muted-foreground">Schedule Q2 planning meeting</p>
                </div>
                <Button size="sm" variant="outline">Schedule</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformancePage;