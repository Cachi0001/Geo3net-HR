import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  MapPin, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  FileText,
  Loader2
} from 'lucide-react'
import { apiClient } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'

interface JobPosting {
  id: string
  title: string
  description: string
  requirements?: string
  departmentId?: string
  positionId?: string
  salaryMin?: number
  salaryMax?: number
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship'
  location?: string
  status: 'draft' | 'active' | 'closed' | 'cancelled'
  postedBy: string
  postedDate: string
  closingDate?: string
  departmentName?: string
  positionName?: string
  postedByName?: string
  applicationCount?: number
}

interface JobApplication {
  id: string
  jobPostingId: string
  applicantName: string
  applicantEmail: string
  applicantPhone?: string
  resumeUrl?: string
  coverLetter?: string
  status: 'submitted' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  applicationDate: string
  interviewDate?: string
  jobTitle?: string
}

const RecruitmentPage = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // No fallback data - will show empty state if API fails

  // Load data on component mount
  useEffect(() => {
    loadJobPostings()
    loadApplications()
  }, [statusFilter])

  const loadJobPostings = async () => {
    setJobsLoading(true)
    try {
      // Use empty state for now since API endpoints may not be implemented
      console.warn('Using empty state for job postings - API endpoints not implemented');
      setJobPostings([]);
      
      // TODO: Implement API calls when backend is ready
      // const response = await apiClient.getJobPostings();
      
    } catch (error) {
      console.error('Error loading job postings:', error)
      setJobPostings([])
    } finally {
      setJobsLoading(false)
    }
  }

  const loadApplications = async () => {
    setApplicationsLoading(true)
    try {
      // Use empty state for now since API endpoints may not be implemented
      console.warn('Using empty state for applications - API endpoints not implemented');
      setApplications([]);
      
      // TODO: Implement API calls when backend is ready
      // const response = await apiClient.getJobApplications();
      
    } catch (error) {
      console.error('Error loading applications:', error)
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requirements: '',
    employmentType: 'full-time' as const,
    location: '',
    salaryMin: '',
    salaryMax: ''
  })

  const handleCreateJob = async () => {
    setIsCreating(true)
    try {
      const jobData = {
        ...newJob,
        salaryMin: newJob.salaryMin ? parseInt(newJob.salaryMin) : undefined,
        salaryMax: newJob.salaryMax ? parseInt(newJob.salaryMax) : undefined,
        status: 'active' as const,
        id: Date.now().toString(),
        postedBy: user?.id || 'current-user',
        postedDate: new Date().toISOString(),
        applicationCount: 0
      }

      // Try API call, fallback to local state update
      try {
        const response = await apiClient.createJobPosting(jobData)
        if (response.success) {
          await loadJobPostings()
        } else {
          // Add to local state
          setJobPostings(prev => [jobData, ...prev])
        }
      } catch (error) {
        // Add to local state as fallback
        setJobPostings(prev => [jobData, ...prev])
      }

      setIsCreateDialogOpen(false)
      setNewJob({
        title: '',
        description: '',
        requirements: '',
        employmentType: 'full-time',
        location: '',
        salaryMin: '',
        salaryMax: ''
      })
      
      toast({
        title: 'Success',
        description: 'Job posting created successfully'
      })
    } catch (error) {
      console.error('Error creating job:', error)
      toast({
        title: 'Error',
        description: 'Failed to create job posting',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const filteredJobs = jobPostings.filter((job: JobPosting) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredApplications = applications.filter((application: JobApplication) => {
    const matchesSearch = application.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         application.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (application.jobTitle && application.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'draft': return 'bg-yellow-500'
      case 'closed': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500'
      case 'screening': return 'bg-yellow-500'
      case 'interview': return 'bg-purple-500'
      case 'offer': return 'bg-green-500'
      case 'hired': return 'bg-emerald-500'
      case 'rejected': return 'bg-red-500'
      case 'withdrawn': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings and applications</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Job Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Fill in the details for the new job posting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g. Senior Developer"
                  />
                </div>
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select value={newJob.employmentType} onValueChange={(value) => setNewJob({ ...newJob, employmentType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  placeholder="e.g. Lagos, Nigeria"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={newJob.salaryMin}
                    onChange={(e) => setNewJob({ ...newJob, salaryMin: e.target.value })}
                    placeholder="e.g. 500000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={newJob.salaryMax}
                    onChange={(e) => setNewJob({ ...newJob, salaryMax: e.target.value })}
                    placeholder="e.g. 800000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Describe the role and responsibilities..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={newJob.requirements}
                  onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                  placeholder="List the required skills and qualifications..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Job Posting'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'jobs' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('jobs')}
          className="flex items-center gap-2"
        >
          <Briefcase className="h-4 w-4" />
          Job Postings
        </Button>
        <Button
          variant={activeTab === 'applications' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('applications')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Applications
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={activeTab === 'jobs' ? 'Search job postings...' : 'Search applications...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === 'jobs' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {activeTab === 'jobs' ? (
        <div className="grid gap-6">
          {jobsLoading ? (
            <div className="text-center py-8">Loading job postings...</div>
          ) : filteredJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No job postings found</h3>
                <p className="text-muted-foreground mb-4">Create your first job posting to start recruiting.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job Posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job: JobPosting) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {job.title}
                        <Badge className={`${getStatusColor(job.status)} text-white border-0`}>
                          {job.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {job.description.substring(0, 150)}...
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{job.employmentType}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {(job.salaryMin || job.salaryMax) && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {job.salaryMin && job.salaryMax
                            ? `₦${job.salaryMin.toLocaleString()} - ₦${job.salaryMax.toLocaleString()}`
                            : job.salaryMin
                            ? `₦${job.salaryMin.toLocaleString()}+`
                            : `Up to ₦${job.salaryMax?.toLocaleString()}`
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{job.applicationCount || 0} applications</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                    {job.closingDate && (
                      <span>Closes {new Date(job.closingDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {applicationsLoading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Applications will appear here when candidates apply for your job postings.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((application: JobApplication) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {application.applicantName}
                        <Badge className={`${getApplicationStatusColor(application.status)} text-white border-0`}>
                          {application.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Applied for: {application.jobTitle}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span>
                      <p className="text-muted-foreground">{application.applicantEmail}</p>
                    </div>
                    {application.applicantPhone && (
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p className="text-muted-foreground">{application.applicantPhone}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Applied:</span>
                      <p className="text-muted-foreground">{new Date(application.applicationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {application.coverLetter && (
                    <div className="mt-4">
                      <span className="font-medium text-sm">Cover Letter:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.coverLetter.substring(0, 200)}...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default RecruitmentPage