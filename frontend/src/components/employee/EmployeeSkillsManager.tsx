import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Award, 
  Plus, 
  X, 
  Loader2, 
  Calendar,
  Building,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Employee } from '@/types/employee.types';

interface EmployeeSkillsManagerProps {
  employee: Employee;
  onUpdate: () => void;
}

interface Certification {
  name: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  addedAt?: string;
  addedBy?: string;
}

const EmployeeSkillsManager: React.FC<EmployeeSkillsManagerProps> = ({ employee, onUpdate }) => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Skills management state
  const [newSkill, setNewSkill] = useState('');
  const [skillReason, setSkillReason] = useState('');
  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);
  const [showRemoveSkillDialog, setShowRemoveSkillDialog] = useState(false);
  const [skillToRemove, setSkillToRemove] = useState<string | null>(null);
  const [skillLoading, setSkillLoading] = useState(false);
  
  // Certifications management state
  const [showAddCertDialog, setShowAddCertDialog] = useState(false);
  const [showRemoveCertDialog, setShowRemoveCertDialog] = useState(false);
  const [certToRemove, setCertToRemove] = useState<Certification | null>(null);
  const [certLoading, setCertLoading] = useState(false);
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: ''
  });
  const [certReason, setCertReason] = useState('');

  useEffect(() => {
    loadSkillsAndCertifications();
  }, [employee.id]);

  const loadSkillsAndCertifications = async () => {
    try {
      setLoading(true);
      
      // Load skills
      const skillsResponse = await apiClient.getEmployeeSkills(employee.id);
      if (skillsResponse.success && skillsResponse.data) {
        setSkills(skillsResponse.data);
      }
      
      // Load certifications
      const certsResponse = await apiClient.getEmployeeCertifications(employee.id);
      if (certsResponse.success && certsResponse.data) {
        setCertifications(certsResponse.data);
      }
    } catch (error) {
      console.error('Error loading skills and certifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load skills and certifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Skills management functions
  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a skill name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSkillLoading(true);
      const response = await apiClient.addEmployeeSkill(employee.id, newSkill.trim(), skillReason);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Skill added successfully'
        });
        setNewSkill('');
        setSkillReason('');
        setShowAddSkillDialog(false);
        loadSkillsAndCertifications();
        onUpdate();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to add skill',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to add skill',
        variant: 'destructive'
      });
    } finally {
      setSkillLoading(false);
    }
  };

  const handleRemoveSkill = async () => {
    if (!skillToRemove) return;

    try {
      setSkillLoading(true);
      const response = await apiClient.removeEmployeeSkill(employee.id, skillToRemove, skillReason);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Skill removed successfully'
        });
        setSkillToRemove(null);
        setSkillReason('');
        setShowRemoveSkillDialog(false);
        loadSkillsAndCertifications();
        onUpdate();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to remove skill',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove skill',
        variant: 'destructive'
      });
    } finally {
      setSkillLoading(false);
    }
  };

  // Certifications management functions
  const handleAddCertification = async () => {
    if (!newCertification.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a certification name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCertLoading(true);
      const response = await apiClient.addEmployeeCertification(employee.id, newCertification, certReason);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Certification added successfully'
        });
        setNewCertification({
          name: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          credentialId: '',
          credentialUrl: ''
        });
        setCertReason('');
        setShowAddCertDialog(false);
        loadSkillsAndCertifications();
        onUpdate();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to add certification',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to add certification',
        variant: 'destructive'
      });
    } finally {
      setCertLoading(false);
    }
  };

  const handleRemoveCertification = async () => {
    if (!certToRemove) return;

    try {
      setCertLoading(true);
      const response = await apiClient.removeEmployeeCertification(employee.id, certToRemove.name, certReason);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Certification removed successfully'
        });
        setCertToRemove(null);
        setCertReason('');
        setShowRemoveCertDialog(false);
        loadSkillsAndCertifications();
        onUpdate();
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to remove certification',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error removing certification:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove certification',
        variant: 'destructive'
      });
    } finally {
      setCertLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCertificationExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading skills and certifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Skills Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Skills
              </CardTitle>
              <CardDescription>
                Technical and professional skills
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddSkillDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  {skill}
                  <button
                    onClick={() => {
                      setSkillToRemove(skill);
                      setShowRemoveSkillDialog(true);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No skills added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Certifications
              </CardTitle>
              <CardDescription>
                Professional certifications and credentials
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddCertDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Certification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certifications.length > 0 ? (
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{cert.name}</h4>
                      {cert.issuer && (
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.expiryDate && isCertificationExpired(cert.expiryDate) && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCertToRemove(cert);
                          setShowRemoveCertDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {cert.issueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued: {formatDate(cert.issueDate)}
                      </div>
                    )}
                    {cert.expiryDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {formatDate(cert.expiryDate)}
                      </div>
                    )}
                    {cert.credentialId && (
                      <div>ID: {cert.credentialId}</div>
                    )}
                  </div>
                  
                  {cert.credentialUrl && (
                    <div>
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        View Credential <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No certifications added yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>
              Add a new skill for {employee.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill">Skill Name</Label>
              <Input
                id="skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillReason">Reason (Optional)</Label>
              <Textarea
                id="skillReason"
                value={skillReason}
                onChange={(e) => setSkillReason(e.target.value)}
                placeholder="Reason for adding this skill"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSkillDialog(false)}
              disabled={skillLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSkill} disabled={skillLoading}>
              {skillLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Skill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Skill Dialog */}
      <Dialog open={showRemoveSkillDialog} onOpenChange={setShowRemoveSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{skillToRemove}" from {employee.fullName}'s skills?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="removeSkillReason">Reason (Optional)</Label>
              <Textarea
                id="removeSkillReason"
                value={skillReason}
                onChange={(e) => setSkillReason(e.target.value)}
                placeholder="Reason for removing this skill"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveSkillDialog(false)}
              disabled={skillLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSkill}
              disabled={skillLoading}
            >
              {skillLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Skill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={showAddCertDialog} onOpenChange={setShowAddCertDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
            <DialogDescription>
              Add a new certification for {employee.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certName">Certification Name *</Label>
                <Input
                  id="certName"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter certification name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certIssuer">Issuing Organization</Label>
                <Input
                  id="certIssuer"
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="Enter issuing organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certIssueDate">Issue Date</Label>
                <Input
                  id="certIssueDate"
                  type="date"
                  value={newCertification.issueDate}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certExpiryDate">Expiry Date</Label>
                <Input
                  id="certExpiryDate"
                  type="date"
                  value={newCertification.expiryDate}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certCredentialId">Credential ID</Label>
                <Input
                  id="certCredentialId"
                  value={newCertification.credentialId}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))}
                  placeholder="Enter credential ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certUrl">Credential URL</Label>
                <Input
                  id="certUrl"
                  value={newCertification.credentialUrl}
                  onChange={(e) => setNewCertification(prev => ({ ...prev, credentialUrl: e.target.value }))}
                  placeholder="Enter credential URL"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="certReason">Reason (Optional)</Label>
              <Textarea
                id="certReason"
                value={certReason}
                onChange={(e) => setCertReason(e.target.value)}
                placeholder="Reason for adding this certification"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCertDialog(false)}
              disabled={certLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCertification} disabled={certLoading}>
              {certLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Certification'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Certification Dialog */}
      <Dialog open={showRemoveCertDialog} onOpenChange={setShowRemoveCertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Certification</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{certToRemove?.name}" from {employee.fullName}'s certifications?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="removeCertReason">Reason (Optional)</Label>
              <Textarea
                id="removeCertReason"
                value={certReason}
                onChange={(e) => setCertReason(e.target.value)}
                placeholder="Reason for removing this certification"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveCertDialog(false)}
              disabled={certLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveCertification}
              disabled={certLoading}
            >
              {certLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Certification'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { EmployeeSkillsManager };