import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetApplicantDetailsQuery,
  useAddNoteMutation,
  useUpdateStatusMutation,
} from '@/modules/candidates/index.js';
import {
  useGetApplicantSlotsQuery,
  useBookInterviewMutation,
} from './interviews.api.js';
import { useGetTestReportQuery, TestReportDetails } from '@/modules/assessment/index.js';
import { BACKEND_URL } from '@/app/providers/AuthProvider.js';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Label } from '@/components/ui/Label/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar/index.js';
import { 
  ArrowLeft, FileText, MessageSquare, Calendar as CalendarIcon, 
  Phone, Mail, Sparkles, AlertTriangle, History
} from 'lucide-react';

export function CandidateDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const applicationId = parseInt(id!, 10);

  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const [selectedSlotId, setSelectedSlotId] = useState<number | ''>('');
  const [interviewerName, setInterviewerName] = useState('');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');

  const skillSearch = '';
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'timeline' | 'scheduler' | 'tests'>('evaluation');

  const { data: app, isLoading } = useGetApplicantDetailsQuery(applicationId);

  const { data: slots = [] } = useGetApplicantSlotsQuery(app?.candidateId, {
    skip: !app?.candidateId,
  });

  const hasCompletedTest = app?.score !== null || ['ASSESSMENT_COMPLETED', 'ASSESSMENT_QUALIFIED', 'ASSESSMENT_FAILED', 'HR_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'].includes(app?.status);

  const { data: testReport, isLoading: isReportLoading } = useGetTestReportQuery(applicationId, {
    skip: !hasCompletedTest || activeTab !== 'tests',
  });

  const [addNoteTrigger, { isLoading: isAddingNote }] = useAddNoteMutation();
  const addNoteMutation = {
    mutate: async (note: string) => {
      try {
        await addNoteTrigger({ id: applicationId, note }).unwrap();
        setNoteText('');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to add note');
      }
    },
    isPending: isAddingNote,
  };

  const statusLabels: Record<string, string> = {
    APPLIED: 'Applied',
    CV_ANALYZED: 'CV Analyzed',
    SKILL_RATED: 'Skill Rated',
    ASSESSMENT_PENDING: 'Assessment Pending',
    ASSESSMENT_COMPLETED: 'Assessment Completed',
    ASSESSMENT_QUALIFIED: 'Assessment Qualified',
    ASSESSMENT_FAILED: 'Assessment Failed',
    HR_REVIEW: 'HR Review',
    SHORTLISTED: 'Shortlisted',
    REJECTED: 'Rejected',
    INTERVIEW_SCHEDULED: 'Interview Scheduled',
    SELECTED: 'Selected',
    HIRED: 'Hired'
  };

  const [updateStatusTrigger, { isLoading: isUpdatingStatus }] = useUpdateStatusMutation();
  const updateStatusMutation = {
    mutate: async (status: string) => {
      try {
        await updateStatusTrigger({ id: applicationId, status, notes: '' }).unwrap();
        const statusLabel = statusLabels[status] || status.replace(/_/g, ' ');
        toast.success(`Status updated successfully: ${statusLabel}`);
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to update status');
      }
    },
    isPending: isUpdatingStatus,
  };

  const [bookInterviewTrigger, { isLoading: isBookingInterview }] = useBookInterviewMutation();
  const bookInterviewMutation = {
    mutate: async (bookingData: { applicationId: number; slotId: number; interviewerName: string; meetingLink: string }) => {
      try {
        await bookInterviewTrigger(bookingData).unwrap();
        toast.success('Interview scheduled successfully! Notification email sent.');
        setSelectedSlotId('');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to schedule interview');
      }
    },
    isPending: isBookingInterview,
  };

  const handleAddNote = () => {
    if (noteText.trim()) {
      addNoteMutation.mutate(noteText.trim());
    }
  };

  const handleUpdateStatus = () => {
    if (newStatus) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const handleBookSlot = () => {
    if (!selectedSlotId) {
      toast.error('Please select a slot');
      return;
    }
    if (!interviewerName.trim()) {
      toast.error('Please enter interviewer name');
      return;
    }
    bookInterviewMutation.mutate({
      applicationId: app.id,
      slotId: Number(selectedSlotId),
      interviewerName: interviewerName.trim(),
      meetingLink: meetingLink.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Progress value={50} className="w-64" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>Applicant details not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { candidate, job, status, score, recommendation, notes = [], skillRatings = [] } = app;
  const { user, experienceYears, roleMatch, confidence, resumes = [] } = candidate;

  const parsedCvData = resumes[0]?.parsedData ? (() => {
    try {
      return typeof resumes[0].parsedData === 'string' ? JSON.parse(resumes[0].parsedData) : resumes[0].parsedData;
    } catch (e) {
      return null;
    }
  })() : null;

  const filteredSkills = skillRatings.filter((s: any) =>
    s.skill?.name.toLowerCase().includes(skillSearch.toLowerCase())
  );
  const displayedSkills = showAllSkills ? filteredSkills : filteredSkills.slice(0, 8);

  const getStepStatus = (stepName: string) => {
    const flow = ['APPLIED', 'CV_ANALYZED', 'SKILL_RATED', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETED', 'ASSESSMENT_QUALIFIED', 'HR_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'];
    const currentIdx = flow.indexOf(status);
    const stepIdx = flow.indexOf(stepName);

    if (status === 'REJECTED' || status === 'ASSESSMENT_FAILED') {
      return 'rejected';
    }
    if (currentIdx === stepIdx) return 'current';
    if (currentIdx > stepIdx) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/hr-dashboard')} className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workspace
          </Button>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-bold text-sm">
              Status: {statusLabels[status] || status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden border-t-4 border-t-primary">
              <CardContent className="p-6">
                <div className="text-center pb-6 border-b">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary/20 shadow-md">
                    <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                      {user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-black tracking-tight">{user?.fullName}</h2>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Applied for <span className="text-foreground font-bold">{job?.title}</span></p>

                  <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto text-left">
                    <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium bg-muted/30 px-3 py-2 rounded-lg">
                      <Mail className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium bg-muted/30 px-3 py-2 rounded-lg">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>{user?.phoneNumber || 'No phone'}</span>
                    </div>
                  </div>
                </div>

                <div className="py-6 border-b space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Candidate Profile</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Extracted Experience</span>
                      <span className="font-bold">{experienceYears || 0} Years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Best Role Match</span>
                      <span className="font-bold text-primary">{roleMatch || 'N/A'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-bold">{confidence || 0}%</span>
                      </div>
                      <Progress value={confidence || 0} className="h-1.5" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Submitted Resume</h3>
                  {resumes.length > 0 ? (
                    <Button 
                      variant="outline" 
                      className="w-full font-bold justify-start"
                      onClick={() => {
                        const path = resumes[0].filePath;
                        if (path.startsWith('http')) {
                          window.open(path, '_blank');
                        } else {
                          window.open(`${BACKEND_URL}/uploads/${path.replace(/\\/g, '/').split('/').pop()}`, '_blank');
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2 text-primary" /> Download {resumes[0].fileName}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">No resume uploaded.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Update Pipeline Status</h3>
                <div className="space-y-3">
                  <Select value={newStatus || status} onValueChange={setNewStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPLIED">Applied</SelectItem>
                      <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
                      <SelectItem value="INTERVIEW_SCHEDULED">Interview Scheduled</SelectItem>
                      <SelectItem value="SELECTED">Selected</SelectItem>
                      <SelectItem value="HIRED">Hired</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleUpdateStatus} 
                    disabled={updateStatusMutation.isPending || !newStatus || newStatus === status}
                    className="w-full font-bold"
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Save Pipeline Status'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex border-b gap-8 flex-wrap">
              <button
                onClick={() => setActiveTab('evaluation')}
                className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === 'evaluation' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2 text-primary" /> AI Evaluation & Skills
              </button>

              {/* Display Tests Option ONLY IF candidate has completed at least one test */}
              {hasCompletedTest && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                    activeTab === 'tests' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2 text-primary" /> Test Analysis & Report
                </button>
              )}

              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === 'timeline' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <History className="w-4 h-4 inline mr-2 text-primary" /> Application Timeline
              </button>
              <button
                onClick={() => setActiveTab('scheduler')}
                className={`pb-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === 'scheduler' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <CalendarIcon className="w-4 h-4 inline mr-2 text-primary" /> Interview Scheduler
              </button>
            </div>

            {activeTab === 'evaluation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assessment Score</span>
                      <div className="text-4xl font-black text-primary mt-2">
                        {score !== null ? `${score}%` : 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Recommendation</span>
                      <div className="text-2xl font-black mt-2">
                        {recommendation || 'PENDING'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-6">
                    <h3 className="text-lg font-bold">Skills Rating Matrix</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {displayedSkills.map((sr: any) => {
                        const displayRating = sr.rating <= 5 ? sr.rating * 2 : sr.rating;
                        return (
                          <div key={sr.id} className="p-3 border rounded-xl bg-muted/10 space-y-2">
                            <div className="flex justify-between items-center text-sm font-bold">
                              <span>{sr.skill?.name || sr.skillName}</span>
                              <span className="text-primary">{displayRating}/10</span>
                            </div>
                            <Progress value={displayRating * 10} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>

                    {filteredSkills.length > 8 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAllSkills(!showAllSkills)}
                        className="font-bold text-xs"
                      >
                        {showAllSkills ? 'Show Less' : `View All (${filteredSkills.length}) Skills`}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {parsedCvData && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-bold">Extracted CV Summary</h3>
                      <div className="space-y-3 text-sm text-muted-foreground">
                        {parsedCvData.summary && <p className="leading-relaxed">{parsedCvData.summary}</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" /> Internal HR Notes
                    </h3>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {notes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No internal notes added yet.</p>
                      ) : (
                        notes.map((n: any) => (
                          <div key={n.id} className="p-3 rounded-xl border bg-muted/20 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-foreground">
                              <span>{n.author?.fullName || 'HR Member'}</span>
                              <span className="text-muted-foreground font-normal">{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-muted-foreground">{n.note}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Input 
                        placeholder="Add private feedback or note..." 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="text-sm"
                      />
                      <Button onClick={handleAddNote} disabled={isAddingNote || !noteText.trim()} className="font-bold">
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Test Report Tab Content for Admin */}
            {activeTab === 'tests' && (
              <div className="space-y-6">
                {isReportLoading ? (
                  <div className="py-12 text-center space-y-3">
                    <Progress value={50} className="w-64 mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground">Loading Test Report...</p>
                  </div>
                ) : !testReport ? (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>No test report available for this candidate.</AlertDescription>
                  </Alert>
                ) : (
                  <TestReportDetails report={testReport} />
                )}
              </div>
            )}

            {activeTab === 'timeline' && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border">
                    {[
                      { key: 'APPLIED', title: 'Application Submitted', desc: 'Candidate created profile & submitted resume.' },
                      { key: 'CV_ANALYZED', title: 'AI CV Analysis', desc: 'CV parsed into skills, experience, and certifications matrix.' },
                      { key: 'SKILL_RATED', title: 'Candidate Self-Rating', desc: 'Candidate calibrated skills for adaptive testing.' },
                      { key: 'ASSESSMENT_COMPLETED', title: 'AI Adaptive Assessment', desc: `Scored ${score !== null ? `${score}%` : 'N/A'}. Recommendation: ${recommendation || 'None'}` },
                      { key: 'SHORTLISTED', title: 'Shortlisted for Interview', desc: 'Selected by HR to provide availability slots.' },
                      { key: 'INTERVIEW_SCHEDULED', title: 'Interview Confirmed', desc: 'Meeting slot confirmed by HR.' },
                    ].map((step, idx) => {
                      const st = getStepStatus(step.key);
                      return (
                        <div key={idx} className="relative pl-8">
                          <div className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                            st === 'completed' ? 'bg-primary border-primary' :
                            st === 'current' ? 'bg-primary border-primary ring-4 ring-primary/20' :
                            st === 'rejected' ? 'bg-destructive border-destructive' : 'bg-background border-muted'
                          }`} />
                          <h4 className="font-bold text-sm">{step.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'scheduler' && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-bold">Candidate Availability Slots</h3>
                  <p className="text-sm text-muted-foreground">Select one of the availability slots submitted by the candidate to confirm the interview.</p>

                  {slots.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>No availability slots submitted by candidate yet.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Availability Slot</Label>
                        <Select value={selectedSlotId.toString()} onValueChange={(val) => setSelectedSlotId(Number(val))}>
                          <SelectTrigger><SelectValue placeholder="Choose a slot" /></SelectTrigger>
                          <SelectContent>
                            {slots.map((s: any) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {new Date(s.date).toLocaleDateString()} — {s.timeSlot} ({s.status})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Assigned Interviewer</Label>
                        <Input 
                          placeholder="e.g. Sarah Jenkins (Tech Lead)" 
                          value={interviewerName}
                          onChange={(e) => setInterviewerName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Meeting Link</Label>
                        <Input 
                          value={meetingLink}
                          onChange={(e) => setMeetingLink(e.target.value)}
                        />
                      </div>

                      <Button 
                        onClick={handleBookSlot} 
                        disabled={isBookingInterview || !selectedSlotId || !interviewerName.trim()}
                        className="w-full font-bold"
                      >
                        {isBookingInterview ? 'Confirming & Sending Link...' : 'Confirm & Schedule Interview'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default CandidateDetailsPage;
