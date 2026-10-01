import { Button } from '@/components/ui/Button/index.js';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Label } from '@/components/ui/Label/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { Sparkles, Briefcase, AlertCircle } from 'lucide-react';

interface JobFormModalProps {
  jobOpen: boolean;
  onJobOpenChange: (open: boolean) => void;
  editingJob: any;
  jobFormError: string;
  setJobFormError: (err: string) => void;
  jobModalTab: string;
  setJobModalTab: (tab: string) => void;
  setJobFormFieldErrors: (errors: any) => void;
  jdFile: File | null;
  setJdFile: (file: File | null) => void;
  onParseJd: (file: File) => void;
  isParsingJd: boolean;
  jobForm: any;
  setJobForm: (form: any) => void;
  jobFormFieldErrors: any;
  onSaveJob: () => void;
  isSavingJob: boolean;
  onDeleteJob: (id: number) => void;
  isDeletingJob: boolean;

  isStatusToggleOpen: boolean;
  setIsStatusToggleOpen: (open: boolean) => void;
  statusToggleJob: any;
  onConfirmStatusChange: () => void;
  isUpdatingJobStatus: boolean;
}

export function JobFormModal({
  jobOpen,
  onJobOpenChange,
  editingJob,
  jobFormError,
  setJobFormError,
  jobModalTab,
  setJobModalTab,
  setJobFormFieldErrors,
  jdFile,
  setJdFile,
  onParseJd,
  isParsingJd,
  jobForm,
  setJobForm,
  jobFormFieldErrors,
  onSaveJob,
  isSavingJob,
  onDeleteJob,
  isDeletingJob,

  isStatusToggleOpen,
  setIsStatusToggleOpen,
  statusToggleJob,
  onConfirmStatusChange,
  isUpdatingJobStatus,
}: JobFormModalProps) {
  return (
    <>
      {/* New/Edit Job Modal */}
      <Dialog open={jobOpen} onOpenChange={onJobOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Edit Job Posting' : 'Create Job Posting'}</DialogTitle>
          </DialogHeader>

          {jobFormError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line font-medium text-xs">{jobFormError}</AlertDescription>
            </Alert>
          )}

          {!editingJob && (
            <div className="flex border-b mb-6">
              <button
                type="button"
                onClick={() => { setJobModalTab('manual'); setJobFormError(''); setJobFormFieldErrors({}); }}
                className={`py-2 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  jobModalTab === 'manual' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                Manual Creation
              </button>
              <button
                type="button"
                onClick={() => { setJobModalTab('ai'); setJobFormError(''); setJobFormFieldErrors({}); }}
                className={`py-2 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  jobModalTab === 'ai' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <Sparkles className="w-4 h-4 text-primary" /> AI Auto-Fill (Parse JD)
              </button>
            </div>
          )}

          {jobModalTab === 'ai' && !editingJob ? (
            <div className="space-y-6 py-2">
              <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4 bg-muted/20">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-bold text-base">Upload Job Description Document</h3>
                  <p className="text-xs text-muted-foreground mt-1">Supports PDF, DOC, DOCX files containing role details.</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  id="jd-file-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setJdFile(e.target.files[0]);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('jd-file-input')?.click()}
                  className="font-bold"
                >
                  {jdFile ? jdFile.name : 'Select JD File'}
                </Button>
              </div>

              {jdFile && (
                <Button 
                  onClick={() => onParseJd(jdFile)} 
                  disabled={isParsingJd}
                  className="w-full font-bold"
                >
                  {isParsingJd ? 'Parsing Document with AI...' : 'Parse JD & Auto-Fill Form'}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input 
                  value={jobForm.title} 
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} 
                  placeholder="e.g. Senior Fullstack Engineer"
                />
                {jobFormFieldErrors.title && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={jobForm.department} onValueChange={(val) => setJobForm({ ...jobForm, department: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  {jobFormFieldErrors.department && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.department}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select value={jobForm.employmentType} onValueChange={(val) => setJobForm({ ...jobForm, employmentType: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={jobForm.location} 
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} 
                    placeholder="e.g. Remote / New York"
                  />
                  {jobFormFieldErrors.location && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.location}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Experience Required</Label>
                  <Input 
                    value={jobForm.experienceRequired} 
                    onChange={(e) => setJobForm({ ...jobForm, experienceRequired: e.target.value })} 
                    placeholder="e.g. 3+ years"
                  />
                  {jobFormFieldErrors.experienceRequired && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.experienceRequired}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Salary Range</Label>
                <Input 
                  value={jobForm.salaryRange} 
                  onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })} 
                  placeholder="e.g. $100,000 - $130,000"
                />
                {jobFormFieldErrors.salaryRange && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.salaryRange}</p>}
              </div>

              <div className="space-y-2">
                <Label>Required Skills (Comma-separated)</Label>
                <Input 
                  value={jobForm.requiredSkills} 
                  onChange={(e) => setJobForm({ ...jobForm, requiredSkills: e.target.value })} 
                  placeholder="React, TypeScript, Node.js, PostgreSQL"
                />
                {jobFormFieldErrors.requiredSkills && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.requiredSkills}</p>}
              </div>

              <div className="space-y-2">
                <Label>Job Description</Label>
                <textarea 
                  value={jobForm.description} 
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} 
                  rows={4}
                  className="w-full p-3 rounded-md border border-input bg-background text-sm"
                  placeholder="Detailed description of responsibilities and requirements..."
                />
                {jobFormFieldErrors.description && <p className="text-xs font-semibold text-destructive">{jobFormFieldErrors.description}</p>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label>Status</Label>
                <Select value={jobForm.status} onValueChange={(val) => setJobForm({ ...jobForm, status: val })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {editingJob && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => {
                  onDeleteJob(editingJob.id);
                  onJobOpenChange(false);
                }} 
                disabled={isDeletingJob}
              >
                Delete Job
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={() => onJobOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={onSaveJob} disabled={isSavingJob} className="font-bold">
              {isSavingJob ? 'Saving...' : editingJob ? 'Update Posting' : 'Publish Posting'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Modal */}
      <Dialog open={isStatusToggleOpen} onOpenChange={setIsStatusToggleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to change the status of <span className="font-bold text-foreground">{statusToggleJob?.title}</span> to <span className="font-bold text-foreground">{statusToggleJob?.status === 'OPEN' ? 'CLOSED' : 'OPEN'}</span>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsStatusToggleOpen(false)}>Cancel</Button>
            <Button 
              onClick={onConfirmStatusChange}
              disabled={isUpdatingJobStatus}
              className="font-bold"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default JobFormModal;
