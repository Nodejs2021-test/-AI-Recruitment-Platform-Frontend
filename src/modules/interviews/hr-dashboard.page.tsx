import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { toast } from 'react-toastify';
import {
  useGetScheduledInterviewsQuery,
  useGetReminderLogsQuery,
  useSendReminderMutation,
  useGetDashboardMetricsQuery,
  useGetAuditLogsQuery,
} from './interviews.api.js';
import {
  useGetApplicantsQuery,
  useUpdateStatusMutation,
} from '@/modules/candidates/index.js';
import {
  useGetJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useParseJdMutation,
} from '@/modules/jobs/index.js';
import { useGetAdminTestsQuery } from '@/modules/assessment/index.js';
import { JobFormModal } from './job-form-modal.component.js';
import { InterviewReminderModal } from './interview-reminder-modal.component.js';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/index.js';
import { DataTable } from '@/components/ui/DataGrid/index.js';
import type { ColumnDef } from '@/components/ui/DataGrid/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Switch } from '@/components/ui/Switch/index.js';
import { 
  Sparkles, Sun, Moon, LogOut, Briefcase, Users, TrendingUp, Calendar, 
  Plus, CheckCircle2, XCircle, Shield, FileText, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

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

export function HRDashboardPage() {
  const { logout, themeMode, toggleTheme } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    date: '',
    timeSlot: '',
    interviewRound: '',
    interviewMode: 'Online',
    location: '',
    additionalInstructions: '',
    customMessage: '',
  });

  // Admin Tests Filters
  const [candidateFilter, setCandidateFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [passFailFilter, setPassFailFilter] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState('');

  const { data: scheduledInterviews = [] } = useGetScheduledInterviewsQuery();
  
  const { data: reminderLogs = [], refetch: refetchReminderLogs } = useGetReminderLogsQuery(selectedInterview?.id || 0, {
    skip: !selectedInterview?.id,
  });

  const { data: metricsData, isLoading: metricsLoading } = useGetDashboardMetricsQuery();
  const { data: applicants = [], isLoading: applicantsLoading } = useGetApplicantsQuery();
  const { data: jobs = [], isLoading: jobsLoading } = useGetJobsQuery({});
  const { data: auditLogs = [], isLoading: auditLoading } = useGetAuditLogsQuery();

  const { data: adminTestsData, isLoading: adminTestsLoading } = useGetAdminTestsQuery({
    candidateName: candidateFilter,
    jobTitle: jobFilter,
    testStatus: statusFilter,
    passFail: passFailFilter,
    minScore: minScoreFilter,
  });

  const adminTestsList = adminTestsData?.tests || [];

  const [sendReminderTrigger, { isLoading: isSendingReminder }] = useSendReminderMutation();
  const sendReminderMutation = {
    mutate: async ({ id, data }: { id: number; data: any }) => {
      try {
        await sendReminderTrigger({ id, ...data }).unwrap();
        refetchReminderLogs();
        toast.success('Reminder processed and logged successfully!');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to process reminder');
      }
    },
    isPending: isSendingReminder,
  };

  const [updateStatusTrigger, { isLoading: isUpdatingStatus }] = useUpdateStatusMutation();
  const updateStatusMutation = {
    mutate: async ({ id, status }: { id: number; status: string }) => {
      try {
        await updateStatusTrigger({ id, status, notes: '' }).unwrap();
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to update status');
      }
    },
    isPending: isUpdatingStatus,
  };

  const [createJobTrigger, { isLoading: isCreatingJob }] = useCreateJobMutation();
  const [updateJobTrigger, { isLoading: isUpdatingJob }] = useUpdateJobMutation();
  const saveJobMutation = {
    mutate: async (jobData: any) => {
      try {
        const requiredSkills = typeof jobData.requiredSkills === 'string'
          ? jobData.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
          : jobData.requiredSkills;
        const formattedJobData = { ...jobData, requiredSkills };

        if (editingJob) {
          await updateJobTrigger({ id: editingJob.id, ...formattedJobData }).unwrap();
        } else {
          await createJobTrigger(formattedJobData).unwrap();
        }
        toast.success(editingJob ? 'Job updated successfully' : 'Job created successfully');
        setJobOpen(false);
        setEditingJob(null);
        setJobFormError('');
        setJobFormFieldErrors({});
        setJobForm({
          title: '',
          department: 'Engineering',
          experienceRequired: '3+ years',
          employmentType: 'Full-time',
          location: 'Remote',
          salaryRange: '$80,000 - $110,000',
          description: '',
          requiredSkills: '',
          status: 'OPEN',
        });
      } catch (err: any) {
        const errorMsg = err.data?.error || 'Failed to save job posting. Please check your inputs.';
        setJobFormError(errorMsg);
        toast.error(errorMsg);
      }
    },
    isPending: isCreatingJob || isUpdatingJob,
  };

  const [deleteJobTrigger, { isLoading: isDeletingJob }] = useDeleteJobMutation();
  const deleteJobMutation = {
    mutate: async (id: number) => {
      try {
        await deleteJobTrigger(id).unwrap();
        toast.success('Job deleted successfully');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to delete job');
      }
    },
    isPending: isDeletingJob,
  };

  const updateJobStatusMutation = {
    mutate: async ({ id, status }: { id: number; status: string }) => {
      setIsStatusToggleOpen(false);
      try {
        const fullJob = jobs.find((j: any) => j.id === id);
        if (!fullJob) throw new Error('Job not found');
        const requiredSkills = typeof fullJob.requiredSkills === 'string'
          ? JSON.parse(fullJob.requiredSkills)
          : fullJob.requiredSkills;
        await updateJobTrigger({
          ...fullJob,
          requiredSkills,
          status,
        }).unwrap();
        toast.success('Status updated successfully');
      } catch (err: any) {
        toast.error(err.data?.error || 'Failed to update status');
      } finally {
        setStatusToggleJob(null);
      }
    },
    isPending: isUpdatingJob,
  };

  const [parseJdTrigger, { isLoading: isParsingJd }] = useParseJdMutation();
  const parseJdMutation = {
    mutate: async (file: File) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const data = await parseJdTrigger(formData).unwrap();
        setJobForm({
          title: data.title || '',
          department: data.department || 'Engineering',
          experienceRequired: data.experienceRequired || '',
          employmentType: data.employmentType || 'Full-time',
          location: data.location || '',
          salaryRange: data.salaryRange || '',
          description: data.description || '',
          requiredSkills: data.requiredSkills || '',
          status: 'OPEN'
        });
        setJdFile(null);
        setIsJdUploaded(true);
        setJobModalTab('manual');
        toast.success('JD parsed successfully. Form auto-filled!');
      } catch (err: any) {
        setJobFormError(err.data?.error || 'Failed to parse JD. Please try again or create manually.');
      }
    },
    isPending: isParsingJd,
  };

  const handleInterviewClick = (interview: any) => {
    setSelectedInterview(interview);
    setReminderForm({
      date: interview.date || '',
      timeSlot: interview.timeSlot || '',
      interviewRound: interview.interviewRound || 'Technical Interview',
      interviewMode: interview.interviewMode || 'Online',
      location: interview.interviewMode === 'Offline' ? (interview.venue || interview.meetingLink || '') : (interview.meetingLink || ''),
      additionalInstructions: interview.additionalInstructions || '',
      customMessage: `Dear ${interview.application?.candidate?.user?.fullName || 'Candidate'},
 
This is a reminder for your upcoming ${interview.interviewRound || 'interview'} for the ${interview.application?.job?.title || 'Job'} position.
 
We look forward to speaking with you!`,
    });
    setIsDetailsModalOpen(true);
  };

  const handleSendReminder = () => {
    if (!selectedInterview) return;
    const payload = {
      date: reminderForm.date,
      timeSlot: reminderForm.timeSlot,
      interviewRound: reminderForm.interviewRound,
      interviewMode: reminderForm.interviewMode,
      meetingLink: reminderForm.interviewMode === 'Online' ? reminderForm.location : undefined,
      venue: reminderForm.interviewMode === 'Offline' ? reminderForm.location : undefined,
      additionalInstructions: reminderForm.additionalInstructions,
      customMessage: reminderForm.customMessage,
    };
    sendReminderMutation.mutate({
      id: selectedInterview.id,
      data: payload,
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const dayCells = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    dayCells.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }
  for (let d = 1; d <= totalDays; d++) {
    dayCells.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(year, month, d)
    });
  }
  const totalCells = Math.ceil(dayCells.length / 7) * 7;
  const nextDaysCount = totalCells - dayCells.length;
  for (let d = 1; d <= nextDaysCount; d++) {
    dayCells.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(year, month + 1, d)
    });
  }

  const [jobOpen, setJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [jobFormError, setJobFormError] = useState('');
  const [jobFormFieldErrors, setJobFormFieldErrors] = useState<any>({});
  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Engineering',
    experienceRequired: '3+ years',
    employmentType: 'Full-time',
    location: 'Remote',
    salaryRange: '$80,000 - $110,000',
    description: '',
    requiredSkills: '',
    status: 'OPEN',
  });

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jobModalTab, setJobModalTab] = useState('manual');
  const [isJdUploaded, setIsJdUploaded] = useState(false);

  const [statusToggleJob, setStatusToggleJob] = useState<any | null>(null);
  const [isStatusToggleOpen, setIsStatusToggleOpen] = useState(false);

  const handleStatusToggleClick = (job: any) => {
    setStatusToggleJob(job);
    setIsStatusToggleOpen(true);
  };

  const handleEditJobClick = (job: any) => {
    setEditingJob(job);
    setJobFormError('');
    setJobFormFieldErrors({});
    setJobForm({
      title: job.title,
      department: job.department,
      experienceRequired: job.experienceRequired,
      employmentType: job.employmentType,
      location: job.location,
      salaryRange: job.salaryRange,
      description: job.description,
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills,
      status: job.status,
    });
    setJobOpen(true);
  };

  const handleSaveJob = () => {
    setJobFormError('');
    setJobFormFieldErrors({});

    if (jobModalTab === 'ai') {
      if (!isJdUploaded) {
        setJobFormError('Please upload a Job Description (JD) first.');
        return;
      }
      const errors: string[] = [];
      
      if (!jobForm.title.trim()) {
        errors.push('Job Title is missing');
      } else {
        if (jobForm.title.length < 5) errors.push('Job Title must be at least 5 characters');
        if (jobForm.title.length > 100) errors.push('Job Title must be less than 100 characters');
      }

      if (!jobForm.department.trim()) {
        errors.push('Department is missing');
      }

      if (!jobForm.location.trim()) {
        errors.push('Location is missing');
      }

      if (!jobForm.experienceRequired.trim()) {
        errors.push('Experience Required is missing');
      }

      if (!jobForm.salaryRange.trim()) {
        errors.push('Salary Range is missing');
      } else if (jobForm.salaryRange.trim().length < 2) {
        errors.push('Salary Range format is invalid');
      }

      if (!jobForm.description.trim()) {
        errors.push('Job Description is missing');
      } else if (jobForm.description.length < 20) {
        errors.push('Job Description must be at least 20 characters');
      }

      if (!jobForm.requiredSkills.trim()) {
        errors.push('Required Skills are missing');
      } else if (jobForm.requiredSkills.split(',').length < 2) {
        errors.push('Required Skills must contain at least 2 skills');
      }

      if (errors.length > 0) {
        setJobFormError(`Cannot publish role. Please resolve the following issues:\n${errors.map(err => `• ${err}`).join('\n')}`);
        return;
      }
    } else {
      const errors: any = {};
      if (!jobForm.title.trim()) errors.title = 'Job title is required';
      else if (jobForm.title.length < 5) errors.title = 'Must be at least 5 characters';
      else if (jobForm.title.length > 100) errors.title = 'Must be less than 100 characters';

      if (!jobForm.department.trim()) errors.department = 'Department is required';
      if (!jobForm.location.trim()) errors.location = 'Location is required';
      if (!jobForm.experienceRequired.trim()) errors.experienceRequired = 'Experience is required';

      if (!jobForm.salaryRange.trim()) errors.salaryRange = 'Salary range is required';
      else if (jobForm.salaryRange.trim().length < 2) {
        errors.salaryRange = 'Invalid salary format';
      }

      if (!jobForm.description.trim()) errors.description = 'Description is required';
      else if (jobForm.description.length < 20) errors.description = 'Description must be at least 20 characters';

      if (!jobForm.requiredSkills.trim()) errors.requiredSkills = 'Required skills are needed';
      else if (jobForm.requiredSkills.split(',').length < 2) errors.requiredSkills = 'Provide at least 2 skills';

      if (Object.keys(errors).length > 0) {
        setJobFormFieldErrors(errors);
        return;
      }
    }

    saveJobMutation.mutate(jobForm);
  };

  const pipelineColumns: ColumnDef<any>[] = [
    {
      header: 'Candidate',
      key: 'name',
      render: (app: any) => (
        <div>
          <div className="font-bold">{app.name}</div>
          <div className="text-xs text-muted-foreground font-medium">{app.email} • {app.phone}</div>
        </div>
      )
    },
    {
      header: 'Position',
      key: 'appliedJob',
      className: 'font-medium'
    },
    {
      header: 'AI Match',
      key: 'score',
      render: (app: any) => app.score ? (
        <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20">{app.score}%</Badge>
      ) : (
        <span className="text-xs font-bold text-muted-foreground">Pending</span>
      )
    },
    {
      header: 'Recommendation',
      key: 'recommendation',
      render: (app: any) => app.recommendation ? (
        <Badge variant="outline" className={`
          ${app.recommendation === 'SHORTLIST' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
            app.recommendation === 'REVIEW' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
            'bg-red-500/10 text-red-500 border-red-500/20'}
        `}>
          {app.recommendation}
        </Badge>
      ) : (
        <span className="text-xs font-bold text-muted-foreground">Pending</span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (app: any) => (
        <Badge variant="outline">{app.status.replace(/_/g, ' ')}</Badge>
      )
    },
    {
      header: 'Actions',
      key: 'id',
      className: 'text-right',
      render: (app: any) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/applicant-details/${app.id}`)}>
            Review
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-9 w-9 text-green-500 border-green-500/20 bg-green-500/10 hover:bg-green-500/20 hover:text-green-600"
            disabled={app.status === 'SHORTLISTED'}
            onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'SHORTLISTED' })}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-9 w-9 text-red-500 border-red-500/20 bg-red-500/10 hover:bg-red-500/20 hover:text-red-600"
            disabled={app.status === 'REJECTED'}
            onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'REJECTED' })}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const adminTestsColumns: ColumnDef<any>[] = [
    {
      header: 'Candidate',
      key: 'candidateName',
      render: (t: any) => (
        <div>
          <div className="font-bold">{t.candidateName}</div>
          <div className="text-xs text-muted-foreground">{t.candidateEmail}</div>
        </div>
      )
    },
    {
      header: 'Applied Role',
      key: 'jobTitle',
      className: 'font-medium'
    },
    {
      header: 'Score',
      key: 'score',
      render: (t: any) => (
        <Badge variant="secondary" className="font-bold text-xs">{t.score}%</Badge>
      )
    },
    {
      header: 'Pass/Fail',
      key: 'passFail',
      render: (t: any) => (
        <Badge className={t.passFail === 'QUALIFIED' ? 'bg-green-500/15 text-green-600 border-green-500/30' : 'bg-red-500/15 text-red-600 border-red-500/30'}>
          {t.passFail}
        </Badge>
      )
    },
    {
      header: 'Status',
      key: 'testStatus',
      render: (t: any) => (
        <Badge variant="outline">{t.testStatus.replace(/_/g, ' ')}</Badge>
      )
    },
    {
      header: 'Time Taken',
      key: 'timeTaken',
      className: 'text-xs text-muted-foreground font-medium'
    },
    {
      header: 'Actions',
      key: 'applicationId',
      className: 'text-right',
      render: (t: any) => (
        <Button size="sm" variant="outline" className="font-bold" onClick={() => navigate(`/applicant-details/${t.applicationId}`)}>
          View Test Report
        </Button>
      )
    }
  ];

  const jobColumns: ColumnDef<any>[] = [
    {
      header: 'Role',
      key: 'title',
      render: (job: any) => (
        <div>
          <div 
            className="font-bold text-primary cursor-pointer hover:underline"
            onClick={() => handleEditJobClick(job)}
          >
            {job.title}
          </div>
          <div className="text-xs text-muted-foreground font-medium">{job.experienceRequired}</div>
        </div>
      )
    },
    {
      header: 'Created At',
      key: 'createdAt',
      className: 'font-medium text-muted-foreground',
      render: (job: any) => formatTimeAgo(job.createdAt)
    },
    {
      header: 'Applicants',
      key: 'applicationCount',
      render: (job: any) => (
        <Badge variant="outline" className="font-bold">
          {job.applicationCount || 0}
        </Badge>
      )
    },
    {
      header: 'Department',
      key: 'department',
      className: 'font-medium'
    },
    {
      header: 'Location',
      key: 'location',
      className: 'font-medium'
    },
    {
      header: 'Status',
      key: 'status',
      render: (job: any) => (
        <div className="flex items-center gap-2">
          <Switch 
            checked={job.status === 'OPEN'} 
            onCheckedChange={() => handleStatusToggleClick(job)} 
          />
          <span className="text-xs font-medium text-muted-foreground">{job.status === 'OPEN' ? 'Active' : 'Inactive'}</span>
        </div>
      )
    }
  ];

  const auditColumns: ColumnDef<any>[] = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      className: 'whitespace-nowrap text-muted-foreground font-medium',
      render: (log: any) => new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    },
    {
      header: 'User',
      key: 'user',
      render: (log: any) => log.user ? (
        <div>
          <div className="font-bold">{log.user.fullName}</div>
          <div className="text-xs text-muted-foreground">{log.user.email}</div>
        </div>
      ) : (
        <span className="font-bold text-muted-foreground">SYSTEM</span>
      )
    },
    {
      header: 'Event',
      key: 'action',
      render: (log: any) => <Badge variant="secondary">{log.action}</Badge>
    },
    {
      header: 'Details',
      key: 'details',
      className: 'font-medium'
    },
    {
      header: 'IP',
      key: 'ipAddress',
      className: 'font-mono text-muted-foreground text-xs',
      render: (log: any) => log.ipAddress || 'Unknown'
    }
  ];

  const CHART_COLORS = themeMode === 'dark'
    ? ['#ffffff', '#a3a3a3', '#525252', '#3b82f6', '#1e40af']
    : ['#000000', '#4b5563', '#9ca3af', '#3b82f6', '#93c5fd'];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-md">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RecruitAI <span className="opacity-50 hidden sm:inline">HR Workspace</span></span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 font-bold gap-1.5"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="container mx-auto px-4 py-6 sm:py-8">

        {metricsLoading && <Progress value={33} className="h-1.5 mb-8" />}
        {metricsData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: 'Active Jobs', value: metricsData.metrics.activeJobs, icon: <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { label: 'Total Applicants', value: metricsData.metrics.totalCandidates, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { label: 'New Apps', value: metricsData.metrics.newApplications, icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { label: 'Shortlisted', value: metricsData.metrics.shortlisted, icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { label: 'Scheduled', value: metricsData.metrics.scheduledInterviews, icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" /> },
            ].map((card, idx) => (
              <Card key={idx} className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</span>
                    <div className="text-muted-foreground">{card.icon}</div>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-black tracking-tight">{card.value}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-auto p-0 flex justify-start gap-4 sm:gap-8 flex-nowrap min-w-max">
              <TabsTrigger value="pipeline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                Applicant Pipeline
              </TabsTrigger>
              <TabsTrigger value="tests" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                Assessment Tests
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                Calendar
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                Manage Postings
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                AI Insights
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap">
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </div>


          <TabsContent value="pipeline" className="mt-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Candidate Pipeline</h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={pipelineColumns}
                  data={applicants}
                  isLoading={applicantsLoading}
                  emptyMessage="No active applications currently in the pipeline."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Tests Tab with HR Filters */}
          <TabsContent value="tests" className="mt-0 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Candidate Assessment Tests
              </h2>
            </div>

            {/* Filter Toolbar */}
            <Card className="bg-muted/20 border-border/40">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Candidate Name / Email"
                      value={candidateFilter}
                      onChange={(e) => setCandidateFilter(e.target.value)}
                      className="pl-9 text-xs"
                    />
                  </div>

                  <Select value={jobFilter} onValueChange={setJobFilter}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Filter by Job" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Jobs</SelectItem>
                      {jobs.map((j: any) => (
                        <SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={passFailFilter} onValueChange={setPassFailFilter}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Pass / Fail" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Outcomes</SelectItem>
                      <SelectItem value="QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Test Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ASSESSMENT_COMPLETED">Completed</SelectItem>
                      <SelectItem value="ASSESSMENT_QUALIFIED">Qualified</SelectItem>
                      <SelectItem value="ASSESSMENT_FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Min Score % (e.g. 70)"
                    type="number"
                    value={minScoreFilter}
                    onChange={(e) => setMinScoreFilter(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={adminTestsColumns}
                  data={adminTestsList}
                  isLoading={adminTestsLoading}
                  emptyMessage="No candidate test attempts found matching the selected filters."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Interview Calendar</h2>
                <p className="text-muted-foreground text-sm">View scheduled interviews and send automated reminder logs.</p>
              </div>

              <div className="flex items-center gap-3 bg-card border px-3 py-1.5 rounded-xl shadow-sm">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-extrabold text-sm min-w-[120px] text-center">
                  {months[month]} {year}
                </span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Split Calendar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Panel: Monthly Grid */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="overflow-hidden shadow-sm">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-black uppercase tracking-wider py-3">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-muted-foreground">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 divide-x divide-y border-b bg-card">
                      {dayCells.map((cell, idx) => {
                        const formatLocalDateStr = (d: Date | string): string => {
                          if (!d) return '';
                          if (typeof d === 'string') {
                            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
                            if (d.includes('T')) return d.split('T')[0];
                          }
                          const dateObj = typeof d === 'string' ? new Date(d) : d;
                          if (isNaN(dateObj.getTime())) return '';
                          const y = dateObj.getFullYear();
                          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const day = String(dateObj.getDate()).padStart(2, '0');
                          return `${y}-${m}-${day}`;
                        };

                        const dateStr = formatLocalDateStr(cell.date);
                        const selectedDateStr = formatLocalDateStr(selectedDate);
                        const dayInterviews = scheduledInterviews.filter((i: any) => {
                          if (!i.date) return false;
                          const iDateStr = formatLocalDateStr(i.date);
                          return iDateStr === dateStr;
                        });

                        const isToday = formatLocalDateStr(new Date()) === formatLocalDateStr(cell.date);
                        const isSelected = selectedDateStr === dateStr;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedDate(cell.date)}
                            className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between cursor-pointer border-r border-b ${
                              !cell.isCurrentMonth ? 'bg-muted/10 opacity-40' : 'hover:bg-muted/5'
                            } ${
                              isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                                isToday ? 'bg-primary text-primary-foreground font-black shadow-sm' : 'text-foreground'
                              }`}>
                                {cell.day}
                              </span>
                              {dayInterviews.length > 0 && (
                                <span className="text-[10px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                  {dayInterviews.length}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[75px] pr-0.5">
                              {dayInterviews.map((interview: any) => {
                                let statusColor = 'border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10 text-zinc-600 dark:text-zinc-400';
                                if (interview.status === 'IN_PROGRESS') {
                                  statusColor = 'border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 animate-pulse';
                                } else if (interview.status === 'COMPLETED') {
                                  statusColor = 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400';
                                } else if (interview.status === 'NOT_ATTENDED') {
                                  statusColor = 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400';
                                } else if (interview.status === 'CANCELLED') {
                                  statusColor = 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400';
                                }

                                return (
                                  <div
                                    key={interview.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInterviewClick(interview);
                                    }}
                                    className={`p-1 rounded border cursor-pointer transition-all duration-200 text-left text-[9px] font-bold leading-tight truncate ${statusColor}`}
                                  >
                                    {interview.application?.candidate?.user?.fullName || 'Candidate'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel: Selected Date Agenda Details */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b pb-4">
                    <CardTitle className="text-lg font-black flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary animate-pulse" />
                        {(() => {
                          const formatDateLabel = (d: Date): string => {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${y}-${m}-${day}`;
                          };
                          const todayStr = formatDateLabel(new Date());
                          const selectedStr = formatDateLabel(selectedDate);
                          return todayStr === selectedStr 
                            ? "Today's Agenda" 
                            : `Agenda: ${selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()}
                      </span>
                      <Badge variant="secondary" className="font-extrabold">
                        {(() => {
                          const formatLocalDateStr = (d: Date | string): string => {
                            if (!d) return '';
                            const dateObj = typeof d === 'string' ? new Date(d) : d;
                            const y = dateObj.getFullYear();
                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            return `${y}-${m}-${day}`;
                          };
                          const dateStr = formatLocalDateStr(selectedDate);
                          const count = scheduledInterviews.filter((i: any) => i.date && formatLocalDateStr(i.date) === dateStr).length;
                          return `${count} Interview${count !== 1 ? 's' : ''}`;
                        })()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 overflow-y-auto max-h-[500px] space-y-4">
                    {(() => {
                      const formatLocalDateStr = (d: Date | string): string => {
                        if (!d) return '';
                        const dateObj = typeof d === 'string' ? new Date(d) : d;
                        const y = dateObj.getFullYear();
                        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                      };
                      const dateStr = formatLocalDateStr(selectedDate);
                      const dayInterviews = scheduledInterviews.filter((i: any) => i.date && formatLocalDateStr(i.date) === dateStr);

                      if (dayInterviews.length === 0) {
                        return (
                          <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground p-6 border-2 border-dashed border-muted/50 rounded-xl">
                            <Calendar className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm font-semibold">No interviews scheduled for this date.</p>
                            <p className="text-xs mt-1 text-muted-foreground">Select another date from the calendar grid.</p>
                          </div>
                        );
                      }

                      return dayInterviews.map((interview: any) => {
                        // Check if there are other rounds for this candidate's application
                        const otherRounds = scheduledInterviews.filter((i: any) => 
                          i.application?.candidate?.user?.email === interview.application?.candidate?.user?.email && i.id !== interview.id
                        );

                        let statusLabel = interview.status;
                        let statusColor = 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/20';

                        if (interview.status === 'SCHEDULED') {
                          statusLabel = 'Scheduled';
                          statusColor = 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20';
                        } else if (interview.status === 'IN_PROGRESS') {
                          statusLabel = 'In Progress';
                          statusColor = 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20 animate-pulse';
                        } else if (interview.status === 'COMPLETED') {
                          statusLabel = 'Completed';
                          statusColor = 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20';
                        } else if (interview.status === 'NOT_ATTENDED') {
                          statusLabel = 'Not Attended';
                          statusColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20';
                        } else if (interview.status === 'CANCELLED') {
                          statusLabel = 'Cancelled';
                          statusColor = 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20';
                        }

                        return (
                          <Card 
                            key={interview.id} 
                            onClick={() => handleInterviewClick(interview)}
                            className="border border-border bg-muted/10 hover:bg-muted/30 cursor-pointer transition-all duration-200 p-4 rounded-xl space-y-3 shadow-xs"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-extrabold text-sm text-foreground">
                                  {interview.application?.candidate?.user?.fullName || 'Candidate'}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {interview.application?.candidate?.user?.email || 'No email'}
                                </p>
                              </div>
                              <Badge className={`font-bold ${statusColor}`} variant="outline">
                                {statusLabel}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60 text-muted-foreground">
                              <div>
                                <span className="font-bold text-foreground">Round:</span>{' '}
                                {interview.interviewRound || 'Technical Interview'}
                              </div>
                              <div>
                                <span className="font-bold text-foreground">Time:</span>{' '}
                                {interview.timeSlot}
                              </div>
                              <div className="col-span-2">
                                <span className="font-bold text-foreground">Interviewer:</span>{' '}
                                {interview.interviewerName || 'Assigned HR'}
                              </div>
                            </div>

                            {/* Candidate Multi-Round History Checklist */}
                            {otherRounds.length > 0 && (
                              <div className="pt-2 border-t border-border/60 space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Round History for Candidate:
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {otherRounds.map((round: any) => {
                                    let rndLabel = round.status;
                                    let rndColor = 'border-zinc-500/20 text-zinc-500 bg-zinc-500/5';
                                    if (round.status === 'SCHEDULED') {
                                      rndLabel = 'Scheduled';
                                      rndColor = 'border-blue-500/20 text-blue-500 bg-blue-500/5';
                                    } else if (round.status === 'IN_PROGRESS') {
                                      rndLabel = 'In Progress';
                                      rndColor = 'border-cyan-500/20 text-cyan-500 bg-cyan-500/5 animate-pulse';
                                    } else if (round.status === 'COMPLETED') {
                                      rndLabel = 'Completed';
                                      rndColor = 'border-green-500/20 text-green-500 bg-green-500/5';
                                    } else if (round.status === 'NOT_ATTENDED') {
                                      rndLabel = 'Not Attended';
                                      rndColor = 'border-amber-500/20 text-amber-500 bg-amber-500/5';
                                    } else if (round.status === 'CANCELLED') {
                                      rndLabel = 'Cancelled';
                                      rndColor = 'border-red-500/20 text-red-500 bg-red-500/5';
                                    }
                                    return (
                                      <Badge 
                                        key={round.id} 
                                        variant="outline" 
                                        className={`text-[9px] py-0 px-1.5 font-bold ${rndColor}`}
                                      >
                                        {round.interviewRound || 'Technical'}: {rndLabel}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      });
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="mt-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Active Job Postings</h2>
              <Button onClick={() => { setJobFormError(''); setJobFormFieldErrors({}); setJobOpen(true); }} className="font-bold">
                <Plus className="w-4 h-4 mr-2" /> New Posting
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={jobColumns}
                  data={jobs}
                  isLoading={jobsLoading}
                  emptyMessage="No active job postings found."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="h-[450px] flex flex-col">
                <CardHeader>
                  <CardTitle>Pipeline Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pb-6">
                  {metricsData && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metricsData.statusDistribution.map((item: any) => ({
                            ...item,
                            status: statusLabels[item.status] || item.status.replace(/_/g, ' ')
                          }))}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          stroke="none"
                          paddingAngle={4}
                        >
                          {metricsData.statusDistribution.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: themeMode === 'dark' ? '#18181b' : '#ffffff',
                            borderRadius: 12, border: '1px solid #27272a',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value) => <span className="text-xs font-bold text-muted-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
 
              <Card className="h-[450px] flex flex-col">
                <CardHeader>
                  <CardTitle>AI Assessment Scores</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 pb-6">
                  {applicants.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={applicants
                           .filter((a: any) => a.score !== null)
                           .map((a: any) => ({ name: (a.name || 'Candidate').split(' ')[0], score: a.score }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontWeight: 600 }} domain={[0, 100]} />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: themeMode === 'dark' ? '#18181b' : '#ffffff',
                            borderRadius: 12, border: '1px solid #27272a'
                          }}
                        />
                        <Bar dataKey="score" fill={themeMode === 'dark' ? '#ffffff' : '#000000'} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground font-semibold">
                      No assessment data logged yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-0 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Audit Trail & System Logs
              </h2>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={auditColumns}
                  data={auditLogs}
                  isLoading={auditLoading}
                  emptyMessage="No audit logs recorded yet."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <JobFormModal
        jobOpen={jobOpen}
        onJobOpenChange={setJobOpen}
        editingJob={editingJob}
        jobFormError={jobFormError}
        setJobFormError={setJobFormError}
        jobModalTab={jobModalTab}
        setJobModalTab={setJobModalTab}
        setJobFormFieldErrors={setJobFormFieldErrors}
        jdFile={jdFile}
        setJdFile={setJdFile}
        onParseJd={(file) => parseJdMutation.mutate(file)}
        isParsingJd={parseJdMutation.isPending}
        jobForm={jobForm}
        setJobForm={setJobForm}
        jobFormFieldErrors={jobFormFieldErrors}
        onSaveJob={handleSaveJob}
        isSavingJob={saveJobMutation.isPending}
        onDeleteJob={(id) => deleteJobMutation.mutate(id)}
        isDeletingJob={deleteJobMutation.isPending}
        isStatusToggleOpen={isStatusToggleOpen}
        setIsStatusToggleOpen={setIsStatusToggleOpen}
        statusToggleJob={statusToggleJob}
        onConfirmStatusChange={() => updateJobStatusMutation.mutate({
          id: statusToggleJob.id,
          status: statusToggleJob.status === 'OPEN' ? 'CLOSED' : 'OPEN'
        })}
        isUpdatingJobStatus={updateJobStatusMutation.isPending}
      />

      <InterviewReminderModal
        isDetailsModalOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        selectedInterview={selectedInterview}
        reminderForm={reminderForm}
        setReminderForm={setReminderForm}
        onSendReminder={handleSendReminder}
        isSendingReminder={sendReminderMutation.isPending}
        reminderLogs={reminderLogs}
      />
    </div>
  );
}

export default HRDashboardPage;
