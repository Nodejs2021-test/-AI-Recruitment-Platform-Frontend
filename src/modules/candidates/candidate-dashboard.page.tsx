import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, changePasswordSchema } from './candidates.validation.js';
import { useAuth } from '@/app/providers/AuthProvider.js';
import {
  useGetCandidateApplicationsQuery,
  useGetCandidateProfileQuery,
  useRateSkillsMutation,
  useUpdateProfileMutation,
  useLazyGetRejectionFeedbackQuery,
  useMatchResumeMutation,
  useOptimizeResumeMutation,
  useUpdateCvMutation,
  useUpgradeCandidateMutation,
  useDeleteAccountMutation,
} from './candidates.api.js';
import { CandidateProfileCard } from './candidate-profile-card.component.js';
import { CandidateRatingModal } from './candidate-rating-modal.component.js';
import { CandidateFeedbackModal } from './candidate-feedback-modal.component.js';
import { CandidateProfileModals } from './candidate-profile-modals.component.js';
import { useGetJobsQuery } from '@/modules/jobs/index.js';
import {
  useGetInterviewSlotsQuery,
  useSubmitSlotsMutation,
} from '@/modules/interviews/index.js';

import {
  useChangePasswordMutation,
} from '@/modules/auth/index.js';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar/index.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { toast } from 'react-toastify';
import {
  Sparkles, Sun, Moon, LogOut, Briefcase, Calendar as CalendarIcon,
  ListTodo, CheckCircle2, XCircle, Trash2, Mail, Play, AlertCircle, Loader2, Timer,
  Download, FileText, Video, PartyPopper
} from 'lucide-react';

interface Application {
  id: number;
  jobId: number;
  status: string;
  score: number | null;
  recommendation: string | null;
  createdAt: string;
  job: {
    id: number;
    title: string;
    department: string;
    requiredSkills: string[];
  };
  candidate?: any;
  skill_ratings?: any[];
  interviews?: any[];
}

const categorizeSkills = (skillRatings: any[]) => {
  const categories: Record<string, any[]> = {
    'Frontend': [],
    'Backend': [],
    'Database': [],
    'DevOps & Tools': [],
    'Others': []
  };

  const frontendKeywords = ['html', 'css', 'javascript', 'js', 'typescript', 'ts', 'react', 'angular', 'vue', 'svelte', 'bootstrap', 'tailwind', 'jquery', 'next.js', 'nextjs', 'gatsby', 'webpack', 'sass', 'less', 'frontend', 'front-end'];
  const backendKeywords = ['node', 'nodejs', 'express', 'python', 'django', 'flask', 'fastapi', 'ruby', 'rails', 'php', 'laravel', 'codeigniter', 'symfony', 'java', 'spring', 'kotlin', 'go', 'golang', 'rust', 'c#', '.net', 'asp.net', 'rest api', 'graphql', 'backend', 'back-end', 'nest.js', 'nestjs'];
  const databaseKeywords = ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mongodb', 'mongoose', 'redis', 'supabase', 'firebase', 'oracle', 'mariadb', 'elasticsearch', 'cassandra', 'dynamodb', 'database', 'db'];
  const devopsKeywords = ['docker', 'kubernetes', 'git', 'github', 'gitlab', 'aws', 'azure', 'gcp', 'ci/cd', 'jenkins', 'ansible', 'terraform', 'linux', 'nginx', 'apache', 'heroku', 'vercel', 'netlify', 'devops', 'tools'];

  if (!skillRatings) return categories;

  skillRatings.forEach(sr => {
    const name = sr.skill?.name?.toLowerCase() || '';
    if (frontendKeywords.some(kw => name.includes(kw))) {
      categories['Frontend'].push(sr);
    } else if (backendKeywords.some(kw => name.includes(kw))) {
      categories['Backend'].push(sr);
    } else if (databaseKeywords.some(kw => name.includes(kw))) {
      categories['Database'].push(sr);
    } else if (devopsKeywords.some(kw => name.includes(kw))) {
      categories['DevOps & Tools'].push(sr);
    } else {
      categories['Others'].push(sr);
    }
  });

  return Object.fromEntries(
    Object.entries(categories).filter(([_, list]) => list.length > 0)
  );
};

export function CandidateDashboardPage() {
  const { user, logout, themeMode, toggleTheme, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTabVal = searchParams.get('tab') === 'availability' ? 'scheduler' : 'applications';
  const [activeTab, setActiveTab] = useState(initialTabVal);

  const [ratingApp, setRatingApp] = useState<Application | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [newSkill, setNewSkill] = useState('');

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const [feedbackApp, setFeedbackApp] = useState<Application | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [appSlotsLists, setAppSlotsLists] = useState<Record<number, { date: string; timeSlot: string }[]>>({});

  const getAppSlotsList = (appId: number) => {
    return appSlotsLists[appId] || [{ date: '', timeSlot: '10:00 - 11:00' }];
  };

  const handleAppSlotValueChange = (appId: number, index: number, field: 'date' | 'timeSlot', value: string) => {
    setAppSlotsLists(prev => {
      const currentList = prev[appId] || [{ date: '', timeSlot: '10:00 - 11:00' }];
      const copy = [...currentList];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [appId]: copy };
    });
  };


  const handleAppSaveAvailability = (appId: number) => {
    const currentList = appSlotsLists[appId] || [{ date: '', timeSlot: '10:00 - 11:00' }];
    const validSlots = currentList.filter(s => s.date !== '');
    if (validSlots.length === 0) {
      alert('Please select a date.');
      return;
    }

    const selectedSlot = validSlots[0];
    const selectedDate = new Date(selectedSlot.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    const now = new Date();
    const minDate = new Date(today);
    if (now.getHours() >= 17) {
      minDate.setDate(today.getDate() + 1);
    }

    if (selectedDate < minDate) {
      alert(
        now.getHours() >= 17
          ? 'It is after 5:00 PM today. Please select tomorrow or a future date.'
          : 'Please select today or a future date.'
      );
      return;
    }

    submitSlotsMutation.mutate(validSlots);
  };

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState<string>('custom');
  const [customJd, setCustomJd] = useState('');
  const [matchResult, setMatchResult] = useState<{
    matchPercentage: number;
    missingSkills: string[];
    keywords: string[];
    suggestions: string[];
    originalResumeText: string;
  } | null>(null);
  const [optimizedResume, setOptimizedResume] = useState<any | null>(null);

  const [matchResume, { isLoading: isMatching }] = useMatchResumeMutation();
  const [optimizeResume, { isLoading: isOptimizing }] = useOptimizeResumeMutation();
  const { data: jobs = [] } = useGetJobsQuery({});

  const handleJobSelect = (jobIdStr: string) => {
    setSelectedJobId(jobIdStr);
    if (jobIdStr === 'custom') {
      setCustomJd('');
    } else {
      const selectedJob = jobs.find((j: any) => j.id.toString() === jobIdStr);
      if (selectedJob) {
        const reqs = Array.isArray(selectedJob.requirements) 
          ? selectedJob.requirements.join('\n') 
          : typeof selectedJob.requirements === 'string'
            ? JSON.parse(selectedJob.requirements).join('\n')
            : '';
        setCustomJd(`${selectedJob.description}\n\nKey Requirements:\n${reqs}`);
      }
    }
  };

  const handleAnalyzeMatch = async () => {
    if (!customJd.trim()) {
      toast.error('Please select a job or paste a job description.');
      return;
    }

    const formData = new FormData();
    formData.append('jobDescription', customJd);

    try {
      const result = await matchResume(formData).unwrap();
      setMatchResult(result);
      setOptimizedResume(null);
      toast.success('CV analyzed successfully against job description!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.data?.error || 'Failed to match resume. Please try again.');
    }
  };

  const handleGenerateOptimized = async () => {
    if (!matchResult) return;

    try {
      const result = await optimizeResume({
        jobDescription: customJd,
        originalResumeText: matchResult.originalResumeText,
      }).unwrap();
      setOptimizedResume(result);
      toast.success('AI Optimized Resume generated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.data?.error || 'Failed to generate optimized resume. Please try again.');
    }
  };

  const handleDownloadResume = () => {
    if (!optimizedResume) return;

    const { personalInfo, summary, skills, experience, projects, education } = optimizedResume;

    let md = `# ${personalInfo?.fullName || 'Candidate Name'}\n`;
    md += `${personalInfo?.location || ''} | ${personalInfo?.email || ''} | ${personalInfo?.phoneNumber || ''}\n\n`;
    
    md += `## Professional Summary\n${summary || ''}\n\n`;
    
    if (Array.isArray(skills) && skills.length > 0) {
      md += `## Core Skills\n${skills.join(', ')}\n\n`;
    }
    
    if (Array.isArray(experience) && experience.length > 0) {
      md += `## Work Experience\n`;
      experience.forEach((exp: any) => {
        md += `### ${exp.role} - ${exp.company}\n*${exp.duration || ''}*\n`;
        if (Array.isArray(exp.responsibilities)) {
          exp.responsibilities.forEach((resp: string) => {
            md += `- ${resp}\n`;
          });
        }
        md += `\n`;
      });
    }

    if (Array.isArray(projects) && projects.length > 0) {
      md += `## Projects\n`;
      projects.forEach((proj: any) => {
        md += `### ${proj.title}\n${proj.description}\n\n`;
      });
    }

    if (Array.isArray(education) && education.length > 0) {
      md += `## Education\n`;
      education.forEach((edu: any) => {
        md += `### ${edu.degree} - ${edu.school}\n*${edu.duration || ''}*\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(personalInfo?.fullName || 'Tailored').replace(/\s+/g, '_')}_Optimized_Resume.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Optimized Resume downloaded successfully!');
  };

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: (user as any)?.phoneNumber || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { data: rawApplications = [], isLoading: appsLoading } = useGetCandidateApplicationsQuery();

  const applications = (rawApplications || []).map((app: any) => {
    const updatedApp = { ...app };
    if (updatedApp.job && typeof updatedApp.job.requiredSkills === 'string') {
      try {
        updatedApp.job = {
          ...updatedApp.job,
          requiredSkills: JSON.parse(updatedApp.job.requiredSkills)
        };
      } catch (e) {
        updatedApp.job = {
          ...updatedApp.job,
          requiredSkills: updatedApp.job.requiredSkills.split(',').map((s: string) => s.trim())
        };
      }
    }
    return updatedApp as Application;
  });

  const hasShortlistedApp = applications.some(app => ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(app.status));

  useEffect(() => {
    if (activeTab === 'scheduler' && !hasShortlistedApp && !appsLoading) {
      setActiveTab('applications');
    }
  }, [activeTab, hasShortlistedApp, appsLoading]);

  const { data: profile, isLoading: profileLoading } = useGetCandidateProfileQuery();
  const { data: bookedSlots = [] } = useGetInterviewSlotsQuery();


  const getInterviewPassed = (app: Application) => {
    const interview = app.interviews?.[0];
    if (interview) {
      try {
        const parts = interview.timeSlot.split(' - ');
        const endTimeStr = parts[1] || parts[0] || '23:59';
        const [hour, minute] = endTimeStr.split(':');
        const endDateTime = new Date(interview.date);
        endDateTime.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
        return new Date() > endDateTime;
      } catch (err) {
        console.error('Error calculating interview passed:', err);
      }
    }
    return false;
  };

  const getMinDateString = () => {
    const now = new Date();
    const currentHour = now.getHours();
    if (currentHour >= 17) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const d = String(tomorrow.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } else {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  };

  const isInterviewWindowActive = (app: Application) => {
    const interview = app.interviews?.[0];
    if (!interview) return false;
    try {
      const parts = interview.timeSlot.split(' - ');
      const startTimeStr = parts[0] || '00:00';
      const endTimeStr = parts[1] || '23:59';
      
      const [startHour, startMinute] = startTimeStr.split(':').map(Number);
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);
      
      const startDateTime = new Date(interview.date);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(interview.date);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      const now = new Date();
      return now >= startDateTime && now <= endDateTime;
    } catch (err) {
      console.error('Error calculating isInterviewWindowActive:', err);
      return false;
    }
  };

  const isInterviewInFuture = (app: Application) => {
    const interview = app.interviews?.[0];
    if (!interview) return false;
    try {
      const parts = interview.timeSlot.split(' - ');
      const startTimeStr = parts[0] || '00:00';
      const [startHour, startMinute] = startTimeStr.split(':').map(Number);
      
      const startDateTime = new Date(interview.date);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      return new Date() < startDateTime;
    } catch (err) {
      console.error('Error calculating isInterviewInFuture:', err);
      return false;
    }
  };



  const [rateSkillsTrigger, { isLoading: isRatingSkills }] = useRateSkillsMutation();
  const [submitSlotsTrigger, { isLoading: isSubmittingSlots }] = useSubmitSlotsMutation();
  const [updateProfileTrigger, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePasswordTrigger, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [getRejectionFeedbackTrigger] = useLazyGetRejectionFeedbackQuery();
  const [updateCvTrigger] = useUpdateCvMutation();
  const [upgradeCandidateTrigger] = useUpgradeCandidateMutation();

  const [isReplacingCv, setIsReplacingCv] = useState(false);
  const [isUpgradingProfile, setIsUpgradingProfile] = useState(false);

  const handleReplaceResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsReplacingCv(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      await updateCvTrigger(formData).unwrap();
      toast.success('Resume updated and parsed successfully! Skills matrix is updated.');
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to update resume CV.');
    } finally {
      setIsReplacingCv(false);
    }
  };

  const handleUpgradeProfile = async () => {
    setIsUpgradingProfile(true);
    try {
      await upgradeCandidateTrigger().unwrap();
      updateUser({ membershipType: 'Premium' });
      toast.success('Successfully upgraded to Premium! Enjoy your AI features.');
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to upgrade profile.');
    } finally {
      setIsUpgradingProfile(false);
    }
  };

  const rateSkillsMutation = {
    mutate: async (data: { applicationId: number; ratings: { skillName: string; rating: number }[] }) => {
      try {
        await rateSkillsTrigger(data).unwrap();
        toast.success('Skills rated successfully. Launching assessment...');
        setRatingApp(null);
        navigate(`/assessment/${data.applicationId}`);
      } catch (error: any) {
        toast.error(error.data?.error || 'Failed to rate skills');
      }
    },
    isPending: isRatingSkills,
  };

  const submitSlotsMutation = {
    mutate: async (slots: { date: string; timeSlot: string }[]) => {
      try {
        await submitSlotsTrigger(slots).unwrap();
        toast.success('Your availability has been submitted. HR will review and confirm your interview slot.');
      } catch (error: any) {
        toast.error(error.data?.error || 'Failed to submit availability');
      }
    },
    isPending: isSubmittingSlots,
  };

  const updateProfileMutation = {
    mutate: async (data: { fullName: string; phoneNumber: string }) => {
      try {
        const res = await updateProfileTrigger(data).unwrap();
        updateUser({ fullName: res.user.fullName, phoneNumber: res.user.phoneNumber } as any);
        toast.success('Profile updated successfully');
        setIsEditProfileOpen(false);
      } catch (error: any) {
        toast.error(error.data?.error || 'Failed to update profile');
      }
    },
    isPending: isUpdatingProfile,
  };

  const changePasswordMutation = {
    mutate: async (data: { newPassword: string }) => {
      try {
        await changePasswordTrigger(data).unwrap();
        toast.success('Password changed successfully');
        resetPassword();
        setIsChangePasswordOpen(false);
      } catch (error: any) {
        toast.error(error.data?.error || 'Failed to change password');
      }
    },
    isPending: isChangingPassword,
  };

  const [deleteAccountTrigger, { isLoading: isDeletingAccount }] = useDeleteAccountMutation();

  const handleDeleteAccountConfirm = async () => {
    try {
      await deleteAccountTrigger().unwrap();
      toast.success('Account permanently deleted');
      setIsDeleteAccountOpen(false);
      await logout();
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to delete account. Please try again.');
    }
  };

  const handleOpenRatings = (app: Application) => {
    setRatingApp(app);

    const initialRatings: Record<string, number> = {};
    const seenSkills = new Set<string>();

    const cvSkills = (() => {
      if (!profile?.resumes || profile.resumes.length === 0) return [];
      try {
        const resumeObj = JSON.parse(profile.resumes[0].parsedData);
        return resumeObj.skills || [];
      } catch (e) {
        return [];
      }
    })();

    cvSkills.forEach((s: any) => {
      const name = (typeof s === 'string' ? s : s.name || '').trim();
      if (name && !seenSkills.has(name.toLowerCase())) {
        seenSkills.add(name.toLowerCase());
        initialRatings[name] = 0;
      }
    });

    if (seenSkills.size === 0 && app.job?.requiredSkills) {
      let jobSkills: string[] = [];
      try {
        jobSkills = typeof app.job.requiredSkills === 'string'
          ? JSON.parse(app.job.requiredSkills)
          : app.job.requiredSkills;
      } catch {
        if (typeof app.job.requiredSkills === 'string') {
          jobSkills = (app.job.requiredSkills as any).split(',').map((s: string) => s.trim());
        }
      }

      if (Array.isArray(jobSkills)) {
        jobSkills.forEach((name: string) => {
          if (name && !seenSkills.has(name.toLowerCase())) {
            seenSkills.add(name.toLowerCase());
            initialRatings[name] = 0;
          }
        });
      }
    }

    if (app.skill_ratings && app.skill_ratings.length > 0) {
      app.skill_ratings.forEach((sr: any) => {
        if (sr.skill?.name) {
          const name = sr.skill.name.trim();
          const ratingVal = sr.rating > 5 ? Math.round(sr.rating / 2) : sr.rating;
          initialRatings[name] = ratingVal || 0;
        }
      });
    }

    setRatings(initialRatings);
    setNewSkill('');
  };

  const handleOpenRejectionFeedback = async (app: Application) => {
    setFeedbackApp(app);
    setRejectionFeedback('');
    setLoadingFeedback(true);
    try {
      const res = await getRejectionFeedbackTrigger(app.id).unwrap();
      setRejectionFeedback(res.feedback);
    } catch (err: any) {
      console.error(err);
      setRejectionFeedback('Failed to load feedback. Please try again later.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleRatingChange = (skill: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [skill]: value,
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !ratings[newSkill.trim()]) {
      setRatings(prev => ({ ...prev, [newSkill.trim()]: 0 }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const newRatings = { ...ratings };
    delete newRatings[skill];
    setRatings(newRatings);
  };

  const handleSaveRatings = () => {
    if (!ratingApp) return;

    const ratedSkills = Object.entries(ratings)
      .filter(([_, rating]) => rating > 0)
      .map(([skillName, rating]) => ({
        skillName,
        rating: rating <= 5 ? rating * 2 : rating,
      }));

    if (ratedSkills.length === 0) {
      toast.error('Please rate at least one skill to start the assessment.');
      return;
    }

    rateSkillsMutation.mutate({
      applicationId: ratingApp.id,
      ratings: ratedSkills,
    });
  };


  const onProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: any) => {
    changePasswordMutation.mutate({ newPassword: data.newPassword });
  };

  const getStepIndex = (status: string) => {
    const flow = ['APPLIED', 'CV_ANALYZED', 'SKILL_RATED', 'ASSESSMENT_PENDING', 'ASSESSMENT_COMPLETED', 'ASSESSMENT_QUALIFIED', 'HR_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'HIRED'];
    if (status === 'ASSESSMENT_FAILED' || status === 'REJECTED') return -1;
    const idx = flow.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const renderTimelineStep = (title: string, content?: React.ReactNode, isActive?: boolean, isCompleted?: boolean) => {
    return (
      <div className="relative pl-5 sm:pl-8 pb-5 sm:pb-8">
        <div className={`absolute left-2 sm:left-3.5 top-7 bottom-0 w-px ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`absolute left-0.5 sm:left-2 top-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${isActive ? 'bg-primary border-primary ring-4 ring-primary/20' : isCompleted ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
        <h4 className={`font-semibold text-xs sm:text-base ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</h4>
        {content && <div className="mt-2 text-xs sm:text-sm break-words">{content}</div>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-md">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RecruitAI <span className="opacity-50 hidden sm:inline">Candidate</span></span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/candidate/tests')} className="font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">My Tests</span>
            </Button>
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

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background border-b py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-background shadow-xl">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-3xl font-black">
                {user?.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
                Welcome back, {user?.fullName?.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-lg">
                Manage your applications, track your AI evaluation progress, and schedule interviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchParams({}); }} className="w-full">
          <div className="border-b mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-auto p-0 flex justify-start gap-4 sm:gap-8 flex-nowrap min-w-max">
              <TabsTrigger
                value="applications"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap"
              >
                <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> My Applications
              </TabsTrigger>
              {hasShortlistedApp && (
                <TabsTrigger
                  value="scheduler"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap"
                >
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Interview Scheduler
                </TabsTrigger>
              )}
              <TabsTrigger
                value="resume-optimization"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 pt-2 font-bold text-sm sm:text-base whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> AI Resume Optimizer
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applications" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-6">Application Pipeline</h2>

                {appsLoading && <Progress value={33} className="h-1.5 mb-6" />}

                {!appsLoading && applications.length === 0 && (
                  <Alert className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Applications</AlertTitle>
                    <AlertDescription>
                      You haven't applied for any jobs yet. Check the <Button variant="link" className="px-1 h-auto py-0 font-bold" onClick={() => navigate('/')}>Job Portal</Button> to apply!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6">
                  {applications.map((app) => (
                    <Card key={app.id} className="overflow-hidden shadow-sm">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg sm:text-xl font-bold mb-1.5 leading-snug break-words">{app.job.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground font-medium">
                              <span className="flex items-center shrink-0"><Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 shrink-0" /> {app.job.department}</span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0">Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`px-3 py-1 font-bold shrink-0 text-xs self-start sm:self-auto ${['SHORTLISTED', 'HIRED', 'SELECTED', 'ASSESSMENT_QUALIFIED'].includes(app.status)
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : ['REJECTED', 'ASSESSMENT_FAILED'].includes(app.status)
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        <div className="bg-muted/30 border rounded-xl p-3.5 sm:p-5 overflow-hidden">
                          {app.status === 'ASSESSMENT_FAILED' || app.status === 'REJECTED' ? (
                            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                              <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base sm:text-lg">Application Closed</h4>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed break-words">
                                  {app.status === 'ASSESSMENT_FAILED' ? 'Unfortunately, the assessment criteria was not met for this role.' : 'We have decided to move forward with other candidates at this time.'}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenRejectionFeedback(app)}
                                  className="font-bold border-destructive text-destructive hover:bg-destructive/10 mt-3 w-full sm:w-auto h-auto py-2 px-3 whitespace-normal text-left text-xs sm:text-sm flex items-center justify-start gap-2"
                                >
                                  <Sparkles className="w-4 h-4 shrink-0 text-destructive" />
                                  <span className="break-words">View AI Feedback & Recommendations</span>
                                </Button>
                              </div>
                            </div>

                          ) : (
                            <div className="py-2">
                              {renderTimelineStep(
                                'Application Received',
                                null,
                                getStepIndex(app.status) === 0,
                                getStepIndex(app.status) > 0
                              )}

                              {renderTimelineStep(
                                'AI Resume Parsing & Skill Rating',
                                <div className="mt-3">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Our AI has analyzed your CV. Please self-rate your extracted skills to calibrate your adaptive assessment test.
                                  </p>
                                  {getStepIndex(app.status) === 1 && (
                                    <Button size="sm" onClick={() => handleOpenRatings(app)} className="font-bold w-full sm:w-auto h-auto py-2 whitespace-normal text-xs">
                                      Rate Skills to Continue
                                    </Button>
                                  )}
                                </div>,
                                getStepIndex(app.status) === 1,
                                getStepIndex(app.status) > 1
                              )}

                              {renderTimelineStep(
                                'Adaptive AI Assessment',
                                <div className="mt-3">
                                  {app.status === 'SKILL_RATED' && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        Your skills are calibrated! You are now ready to take the skill-specific adaptive assessment.
                                      </p>
                                      <Button onClick={() => navigate(`/assessment/${app.id}`)} className="font-bold w-full sm:w-auto h-auto py-2 whitespace-normal text-xs sm:text-sm">
                                        <Play className="w-4 h-4 mr-2 shrink-0" /> Launch Test
                                      </Button>
                                    </div>
                                  )}
                                  {app.status === 'ASSESSMENT_PENDING' && (
                                    <div>
                                      <p className="text-sm font-semibold text-orange-500 mb-3">
                                        Test in progress. Timer is running.
                                      </p>
                                      <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10 font-bold w-full sm:w-auto h-auto py-2 whitespace-normal text-xs sm:text-sm" onClick={() => navigate(`/assessment/${app.id}`)}>
                                        Resume Test
                                      </Button>
                                    </div>
                                  )}
                                  {app.status === 'ASSESSMENT_COMPLETED' && (
                                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                                      <div>
                                        <h5 className="font-bold text-blue-600">Processing Results</h5>
                                        <p className="text-sm text-muted-foreground mt-0.5">Your test has been submitted. Please wait while we evaluate your responses.</p>
                                      </div>
                                    </div>
                                  )}
                                  {getStepIndex(app.status) > 4 && (
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <h5 className="font-bold text-green-600">Test Passed</h5>
                                      </div>
                                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-3">
                                        Your test has been completed successfully. Please wait for the HR review and response.
                                      </p>
                                      <div className="text-sm space-y-1 text-muted-foreground">
                                        <p>Score: <span className="font-bold text-foreground">{app.score}%</span></p>
                                        <p>AI Recommendation: <span className="font-bold text-foreground">{app.recommendation}</span></p>
                                      </div>
                                    </div>
                                  )}
                                </div>,
                                getStepIndex(app.status) >= 2 && getStepIndex(app.status) <= 4,
                                getStepIndex(app.status) > 4
                              )}

                              {renderTimelineStep(
                                'HR Review & Shortlisting',
                                <div className="mt-2">
                                  {(getStepIndex(app.status) === 5) && (
                                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                                      <p className="text-sm font-semibold text-blue-600">Test Passed – Awaiting HR Review.</p>
                                    </div>
                                  )}
                                  {getStepIndex(app.status) > 5 && (
                                    <p className="text-sm text-muted-foreground">HR review completed.</p>
                                  )}
                                </div>,
                                getStepIndex(app.status) === 5,
                                getStepIndex(app.status) > 5
                              )}

                              {renderTimelineStep(
                                'Interview Scheduling',
                                <div className="mt-3">
                                  {app.status === 'SHORTLISTED' && (
                                    <div className="bg-green-500/5 border border-green-500/10 p-4 rounded-xl space-y-4">
                                      <p className="text-sm font-semibold text-green-500">
                                        Congratulations! You are shortlisted. Please provide your availability for this interview below:
                                      </p>
                                      <div className="space-y-3">
                                        {getAppSlotsList(app.id).map((slot, index) => (
                                          <div key={index} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                                            <div className="flex-1 w-full space-y-1">
                                              <label className="text-xs font-semibold text-muted-foreground">Date</label>
                                              <Input
                                                type="date"
                                                value={slot.date}
                                                min={getMinDateString()}
                                                className="h-9 text-xs"
                                                onChange={(e) => handleAppSlotValueChange(app.id, index, 'date', e.target.value)}
                                              />
                                            </div>
                                            <div className="flex-1 w-full space-y-1">
                                              <label className="text-xs font-semibold text-muted-foreground">Time Slot</label>
                                              <Select
                                                value={slot.timeSlot}
                                                onValueChange={(val) => handleAppSlotValueChange(app.id, index, 'timeSlot', val)}
                                              >
                                                <SelectTrigger className="h-9 text-xs">
                                                  <SelectValue placeholder="Select a slot" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="09:00 - 10:00">09:00 AM - 10:00 AM</SelectItem>
                                                  <SelectItem value="10:00 - 11:00">10:00 AM - 11:00 AM</SelectItem>
                                                  <SelectItem value="11:00 - 12:00">11:00 AM - 12:00 PM</SelectItem>
                                                  <SelectItem value="13:00 - 14:00">01:00 PM - 02:00 PM</SelectItem>
                                                  <SelectItem value="14:00 - 15:00">02:00 PM - 03:00 PM</SelectItem>
                                                  <SelectItem value="15:00 - 16:00">03:00 PM - 04:00 PM</SelectItem>
                                                  <SelectItem value="16:00 - 17:00">04:00 PM - 05:00 PM</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="flex flex-wrap gap-2 pt-2">
                                        <Button 
                                          size="sm" 
                                          disabled={submitSlotsMutation.isPending}
                                          onClick={() => handleAppSaveAvailability(app.id)}
                                          className="text-xs font-bold bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto h-auto py-2 whitespace-normal"
                                        >
                                          {submitSlotsMutation.isPending ? (
                                            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Submitting...</>
                                          ) : 'Submit Availability to HR'}
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {getStepIndex(app.status) > 7 && (
                                    <p className="text-sm text-muted-foreground">Interview scheduled.</p>
                                  )}
                                </div>,
                                getStepIndex(app.status) === 7,
                                getStepIndex(app.status) > 7
                              )}

                              {renderTimelineStep(
                                'AI Video Interview (Round 2)',
                                <div className="mt-3">
                                  {app.status === 'INTERVIEW_SCHEDULED' && getInterviewPassed(app) && (
                                     <div className="flex flex-col gap-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                       <div className="flex items-center gap-2">
                                         <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                                         <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                           Interview Expired (Not Attended): The scheduled slot has passed. Please contact HR.
                                         </p>
                                       </div>
                                     </div>
                                   )}
                                   {app.status === 'INTERVIEW_SCHEDULED' && !getInterviewPassed(app) && (
                                     <div className="flex flex-col gap-3 bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                       <div className="flex items-center gap-2">
                                         <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                         <p className="text-sm font-bold text-green-700">
                                           {isInterviewWindowActive(app) 
                                             ? 'Your interview is active now! Launch the video interview below.'
                                             : `Your interview is scheduled for ${app.interviews?.[0]?.date ? new Date(app.interviews[0].date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'specified date'} at ${app.interviews?.[0]?.timeSlot || 'specified time'}.`
                                           }
                                         </p>
                                       </div>
                                       {isInterviewInFuture(app) && (
                                         <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                           Note: The interview page will open and become accessible only within your scheduled time slot.
                                         </p>
                                       )}
                                       <Button 
                                         onClick={() => navigate(`/interview/${app.id}`)}
                                         disabled={!isInterviewWindowActive(app)}
                                         className={`font-bold py-2 px-4 rounded-xl shadow-md w-full sm:w-auto h-auto whitespace-normal flex items-center justify-center gap-2 text-xs ${
                                           isInterviewWindowActive(app) 
                                             ? 'bg-zinc-900 text-white hover:bg-zinc-850'
                                             : 'bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600'
                                         }`}
                                       >
                                         <Video className="w-4 h-4 shrink-0" /> Launch AI Video Interview
                                       </Button>
                                     </div>
                                   )}

                                  {app.status === 'HR_REVIEW' && (
                                    <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                                      <p className="text-sm font-semibold text-blue-600">Video Interview Completed – Awaiting final HR decision.</p>
                                    </div>
                                  )}
                                  {app.status === 'SELECTED' && (
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                      <div className="flex items-center gap-2 mb-2">
                                        <PartyPopper className="w-5 h-5 text-green-600 animate-bounce" />
                                        <h5 className="font-extrabold text-green-600">Congratulations!</h5>
                                      </div>
                                      <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-1">
                                        You have successfully cleared both interview rounds and been selected for this position!
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Further onboarding details and next steps will be shared with you shortly.
                                      </p>
                                    </div>
                                  )}
                                </div>,
                                app.status === 'INTERVIEW_SCHEDULED' || app.status === 'HR_REVIEW' || app.status === 'SELECTED',
                                getStepIndex(app.status) > 8
                              )}

                              <div className="relative pl-8 pb-0">
                                <div className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${getStepIndex(app.status) === 9 ? 'bg-primary border-primary' : 'bg-background border-muted'}`} />
                                <h4 className={`font-semibold ${getStepIndex(app.status) === 9 ? 'text-foreground' : 'text-muted-foreground'}`}>Hired</h4>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <h2 className="text-2xl font-bold tracking-tight mb-2">My Candidate ID</h2>
                <CandidateProfileCard
                  user={user}
                  profile={profile}
                  profileLoading={profileLoading}
                  onEditProfile={() => setIsEditProfileOpen(true)}
                  onChangePassword={() => setIsChangePasswordOpen(true)}
                  onReplaceResume={handleReplaceResume}
                  isReplacingCv={isReplacingCv}
                  onUpgradeProfile={handleUpgradeProfile}
                  isUpgradingProfile={isUpgradingProfile}
                  onDeleteAccount={() => setIsDeleteAccountOpen(true)}
                  expandedCategories={expandedCategories}
                  onToggleCategory={toggleCategory}
                  categorizeSkills={categorizeSkills}
                />
              </div>
            </div>
          </TabsContent>

          {hasShortlistedApp && (
            <TabsContent value="scheduler" className="mt-0">
              <div className="space-y-6">
                {(() => {
                  const activeSchedulingApps = applications.filter((app: any) => 
                    ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(app.status)
                  );

                  const queryAppId = searchParams.get('appId');
                  const activeApp = queryAppId 
                    ? (applications.find((a: any) => a.id === parseInt(queryAppId, 10) && ['SHORTLISTED', 'INTERVIEW_SCHEDULED'].includes(a.status)) || activeSchedulingApps[0])
                    : activeSchedulingApps[0];

                  if (!activeApp) return null;

                  const activeInterview = activeApp.interviews?.[0];
                  const bookedSlot = bookedSlots.find((s: any) => s.status === 'BOOKED');

                  return (
                    <>
                      {activeSchedulingApps.length > 1 && (
                        <Card className="p-4 bg-muted/20 border-border/40 mb-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Select Job Application</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">Manage schedules or submit availability independently for different applications.</p>
                            </div>
                            <Select
                              value={activeApp.id.toString()}
                              onValueChange={(val) => setSearchParams({ appId: val })}
                            >
                              <SelectTrigger className="w-full sm:w-[300px] h-10 text-sm font-semibold">
                                <SelectValue placeholder="Select application" />
                              </SelectTrigger>
                              <SelectContent>
                                {activeSchedulingApps.map((a: any) => (
                                  <SelectItem key={a.id} value={a.id.toString()}>
                                    {a.job?.title} ({a.status.replace(/_/g, ' ')})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </Card>
                      )}

                      {activeApp.status === 'INTERVIEW_SCHEDULED' && (activeInterview || bookedSlot) ? (
                        (() => {
                          const displayDate = activeInterview?.date || bookedSlot?.date;
                          const displayTimeSlot = activeInterview?.timeSlot || bookedSlot?.timeSlot;
                          const isPassed = getInterviewPassed(activeApp);

                          return (
                            <div className="max-w-2xl mx-auto">
                              <Card className="overflow-hidden border-t-4 border-t-green-500 shadow-xl">
                                <CardContent className="p-8">
                                  <div className="flex flex-col items-center text-center mb-8">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight mb-2">Interview Confirmed</h2>
                                    <p className="text-muted-foreground font-medium">
                                      Your interview for the <span className="font-extrabold text-foreground">{activeApp.job?.title}</span> position has been scheduled by HR. Meeting details have been sent to your registered email.
                                    </p>
                                  </div>

                                  <div className="bg-muted/30 border rounded-xl divide-y divide-border">
                                    {displayDate && (
                                      <div className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                                          <CalendarIcon className="w-5 h-5 text-primary" />
                                          <span>Interview Date</span>
                                        </div>
                                        <span className="font-bold text-foreground">
                                          {new Date(displayDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {displayTimeSlot && (
                                      <div className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3 text-muted-foreground font-medium">
                                          <Timer className="w-5 h-5 text-primary" />
                                          <span>Time Slot</span>
                                        </div>
                                        <span className="font-bold text-foreground">{displayTimeSlot}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between px-6 py-4">
                                      <div className="flex items-center gap-3 text-muted-foreground font-medium">
                                        <Mail className="w-5 h-5 text-primary" />
                                        <span>Meeting Link</span>
                                      </div>
                                      <span className="text-sm font-medium text-muted-foreground italic">Sent to your email</span>
                                    </div>
                                  </div>

                                  <Alert className="mt-6 bg-blue-500/10 border-blue-500/20">
                                    <AlertCircle className="w-4 h-4 text-blue-500" />
                                    <AlertDescription className="text-blue-700 dark:text-blue-400 font-semibold">
                                      Your interview slot is locked. If you need to reschedule, please contact HR directly.
                                    </AlertDescription>
                                  </Alert>

                                  {!isPassed ? (
                                    <div className="space-y-4 mt-6">
                                      {isInterviewInFuture(activeApp) && (
                                        <Alert className="bg-amber-500/10 border-amber-500/20">
                                          <AlertCircle className="w-4 h-4 text-amber-500" />
                                          <AlertDescription className="text-amber-700 dark:text-amber-400 font-semibold">
                                            This video interview is not active yet. It will become accessible only during the scheduled date and time slot.
                                          </AlertDescription>
                                        </Alert>
                                      )}
                                      <Button 
                                        onClick={() => navigate(`/interview/${activeApp.id}`)}
                                        disabled={!isInterviewWindowActive(activeApp)}
                                        className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg text-sm ${
                                          isInterviewWindowActive(activeApp)
                                            ? 'bg-zinc-900 hover:bg-zinc-850 text-white shadow-zinc-900/10'
                                            : 'bg-zinc-300 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-650'
                                        }`}
                                      >
                                        <Video className="w-5 h-5" /> Start AI Video Interview
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                        The interview time slot has passed. Please contact HR to reschedule.
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })()
                      ) : (
                        (() => {
                          const availableSlots = bookedSlots.filter((s: any) => s.status === 'AVAILABLE');
                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <Card>
                                <CardContent className="p-6 md:p-8">
                                  <h2 className="text-2xl font-bold mb-2">Provide Availability</h2>
                                  <p className="text-muted-foreground mb-8">
                                    Select the dates and times you are free for the <span className="font-semibold text-foreground">{activeApp.job?.title}</span> interview. HR will pick the best slot and send confirmation.
                                  </p>

                                  <div className="space-y-4 mb-8">
                                    {getAppSlotsList(activeApp.id).map((slot, index) => (
                                      <div key={index} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                                        <div className="flex-1 w-full space-y-2">
                                          <label className="text-sm font-medium">Date</label>
                                          <Input
                                            type="date"
                                            value={slot.date}
                                            min={getMinDateString()}
                                            onChange={(e) => handleAppSlotValueChange(activeApp.id, index, 'date', e.target.value)}
                                          />
                                        </div>
                                        <div className="flex-1 w-full space-y-2">
                                          <label className="text-sm font-medium">Time Slot</label>
                                          <Select
                                            value={slot.timeSlot}
                                            onValueChange={(val) => handleAppSlotValueChange(activeApp.id, index, 'timeSlot', val)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select a slot" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="09:00 - 10:00">09:00 AM - 10:00 AM</SelectItem>
                                              <SelectItem value="10:00 - 11:00">10:00 AM - 11:00 AM</SelectItem>
                                              <SelectItem value="11:00 - 12:00">11:00 AM - 12:00 PM</SelectItem>
                                              <SelectItem value="13:00 - 14:00">01:00 PM - 02:00 PM</SelectItem>
                                              <SelectItem value="14:00 - 15:00">02:00 PM - 03:00 PM</SelectItem>
                                              <SelectItem value="15:00 - 16:00">03:00 PM - 04:00 PM</SelectItem>
                                              <SelectItem value="16:00 - 17:00">04:00 PM - 05:00 PM</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="flex gap-4">
                                    <Button 
                                      onClick={() => handleAppSaveAvailability(activeApp.id)} 
                                      disabled={submitSlotsMutation.isPending} 
                                      className="font-bold"
                                    >
                                      {submitSlotsMutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                                      ) : 'Submit to HR'}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>

                              <div>
                                <h2 className="text-2xl font-bold mb-6">Submitted Slots</h2>
                                {availableSlots.length === 0 ? (
                                  <Alert>
                                    <AlertCircle className="w-4 h-4" />
                                    <AlertTitle>No slots submitted yet</AlertTitle>
                                    <AlertDescription>Add your available dates and times and submit to HR.</AlertDescription>
                                  </Alert>
                                ) : (
                                  <>
                                    <Alert className="mb-4 bg-blue-500/10 border-blue-500/20">
                                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                      <AlertDescription className="text-blue-700 dark:text-blue-400 font-semibold">
                                        Your availability has been submitted. Awaiting HR to confirm a slot.
                                      </AlertDescription>
                                    </Alert>
                                    <div className="space-y-3">
                                      {availableSlots.map((slot: any) => (
                                        <Card key={slot.id} className="overflow-hidden border-l-4 border-l-blue-400">
                                          <CardContent className="p-4 flex justify-between items-center">
                                            <div>
                                              <p className="font-bold text-foreground">
                                                {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                <span>{slot.timeSlot}</span>
                                              </div>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">
                                              Pending
                                            </Badge>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </>
                  );
                })()}
              </div>
            </TabsContent>
          )}

          <TabsContent value="resume-optimization" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-lg border border-muted-foreground/10 bg-card">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-xl font-bold tracking-tight mb-2">Job Description</h3>
                    <p className="text-sm text-muted-foreground">
                      Select an active job posting to automatically prefill the description, or paste custom text.
                    </p>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Select Job Posting</label>
                      <Select value={selectedJobId} onValueChange={handleJobSelect}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Custom Job Description" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">-- Custom / Paste Description --</SelectItem>
                          {jobs.map((job: any) => (
                            <SelectItem key={job.id} value={job.id.toString()}>
                              {job.title} ({job.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Job Description details</label>
                      <textarea
                        value={customJd}
                        onChange={(e) => setCustomJd(e.target.value)}
                        placeholder="Paste details of the job responsibilities, role expectations, and required skills here..."
                        className="w-full h-80 p-3 rounded-xl border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {!matchResult && (
                  <Card className="shadow-lg border border-muted-foreground/10 bg-card">
                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="bg-primary/10 text-primary p-6 rounded-full">
                        <Sparkles className="w-12 h-12 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">AI Job Compatibility Matcher</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mt-2">
                          Analyze how well your registered CV matches the selected job posting using AI evaluation.
                        </p>
                      </div>

                      {profile?.resumes && profile.resumes.length > 0 ? (
                        <div className="w-full max-w-md bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            <FileText className="w-4 h-4" />
                            <span>Using Stored CV: {profile.resumes[0].fileName}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-md bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400">
                          Please complete CV upload on registration.
                        </div>
                      )}

                      <Button
                        size="lg"
                        onClick={handleAnalyzeMatch}
                        disabled={isMatching || !customJd.trim()}
                        className="w-full max-w-sm font-bold shadow-md"
                      >
                        {isMatching ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing Compatibility...
                          </>
                        ) : (
                          'Analyze Match'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {matchResult && !optimizedResume && (
                  <Card className="shadow-lg border border-muted-foreground/10 bg-card">
                    <CardContent className="p-6 md:p-8 space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8 justify-between border-b pb-6">
                        <div className="flex items-center gap-6">
                          <div className="relative flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full border-8 border-primary/20 flex items-center justify-center">
                              <span className="text-3xl font-black">{matchResult.matchPercentage}%</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">Compatibility Score</h4>
                            <p className="text-sm text-muted-foreground mt-1">Based on core skills, experience, and keywords.</p>
                          </div>
                        </div>

                        {matchResult.matchPercentage < 50 ? (
                          <div className="flex flex-col gap-2 w-full md:w-auto">
                            <Alert variant="destructive" className="py-2">
                              <AlertCircle className="w-4 h-4" />
                              <AlertDescription className="text-xs font-bold">Low Compatibility (&lt;50%)</AlertDescription>
                            </Alert>
                            <Button onClick={handleGenerateOptimized} disabled={isOptimizing} className="font-bold shadow-md bg-primary">
                              {isOptimizing ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Generating Tailored Resume...
                                </>
                              ) : (
                                'Generate Tailored Resume'
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-500 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm">
                            <CheckCircle2 className="w-5 h-5" /> Strong Match
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-base font-bold flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-destructive" /> Missing Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.missingSkills?.map((skill: string) => (
                            <Badge key={skill} variant="destructive" className="font-semibold">{skill}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-base font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" /> Key Recommendations
                        </h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {matchResult.suggestions?.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-black">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {matchResult.matchPercentage >= 50 && (
                        <div className="border-t pt-6 flex items-center justify-between">
                          <div>
                            <h5 className="font-bold text-foreground">Optimize anyway?</h5>
                            <p className="text-xs text-muted-foreground mt-0.5">Even with a passing match score, you can generate a resume tailored to this job.</p>
                          </div>
                          <Button variant="secondary" onClick={handleGenerateOptimized} disabled={isOptimizing} className="font-bold">
                            {isOptimizing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Generate Tailored Resume'
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {optimizedResume && (
                  <Card className="shadow-lg border border-muted-foreground/10 bg-card overflow-hidden">
                    <div className="bg-muted/30 border-b p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" /> AI Optimised Resume
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Preview and refine the tailored resume contents below, then download your tailored Markdown file.
                        </p>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => setOptimizedResume(null)} className="font-bold">
                          Back to Report
                        </Button>
                        <Button onClick={handleDownloadResume} className="font-bold shadow-md bg-green-500 hover:bg-green-600 text-white">
                          <Download className="w-4 h-4 mr-2" /> Download Resume
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                            <Input
                              value={optimizedResume.personalInfo?.fullName || ''}
                              onChange={(e) => setOptimizedResume((prev: any) => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, fullName: e.target.value }
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Location</label>
                            <Input
                              value={optimizedResume.personalInfo?.location || ''}
                              onChange={(e) => setOptimizedResume((prev: any) => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, location: e.target.value }
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Email</label>
                            <Input
                              value={optimizedResume.personalInfo?.email || ''}
                              onChange={(e) => setOptimizedResume((prev: any) => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, email: e.target.value }
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                            <Input
                              value={optimizedResume.personalInfo?.phoneNumber || ''}
                              onChange={(e) => setOptimizedResume((prev: any) => ({
                                ...prev,
                                personalInfo: { ...prev.personalInfo, phoneNumber: e.target.value }
                              }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Professional Summary</h4>
                        <textarea
                          value={optimizedResume.summary || ''}
                          onChange={(e) => setOptimizedResume((prev: any) => ({ ...prev, summary: e.target.value }))}
                          className="w-full h-32 p-3 rounded-xl border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Core Skills</h4>
                        <Input
                          value={Array.isArray(optimizedResume.skills) ? optimizedResume.skills.join(', ') : ''}
                          onChange={(e) => setOptimizedResume((prev: any) => ({
                            ...prev,
                            skills: e.target.value.split(',').map((s: string) => s.trim())
                          }))}
                          placeholder="React, TypeScript, Node.js..."
                        />
                        <span className="text-xs text-muted-foreground font-semibold">Separate multiple skills with commas.</span>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Work Experience</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptimizedResume((prev: any) => ({
                              ...prev,
                              experience: [...(prev.experience || []), { company: '', role: '', duration: '', responsibilities: [] }]
                            }))}
                            className="font-bold h-7 px-3 text-xs"
                          >
                            + Add Experience
                          </Button>
                        </div>

                        {optimizedResume.experience?.map((exp: any, expIdx: number) => (
                          <div key={expIdx} className="p-4 bg-muted/20 border rounded-xl space-y-4 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setOptimizedResume((prev: any) => ({
                                ...prev,
                                experience: prev.experience.filter((_: any, i: number) => i !== expIdx)
                              }))}
                              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 w-8 h-8 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Role</label>
                                <Input
                                  value={exp.role || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.experience];
                                    updated[expIdx] = { ...exp, role: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, experience: updated }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Company</label>
                                <Input
                                  value={exp.company || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.experience];
                                    updated[expIdx] = { ...exp, company: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, experience: updated }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                                <Input
                                  value={exp.duration || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.experience];
                                    updated[expIdx] = { ...exp, duration: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, experience: updated }));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">Responsibilities (One bullet per line)</label>
                              <textarea
                                value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''}
                                onChange={(e) => {
                                  const updated = [...optimizedResume.experience];
                                  updated[expIdx] = { ...exp, responsibilities: e.target.value.split('\n').filter((l: string) => l.trim().length > 0) };
                                  setOptimizedResume((prev: any) => ({ ...prev, experience: updated }));
                                }}
                                className="w-full h-32 p-3 rounded-xl border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Projects</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptimizedResume((prev: any) => ({
                              ...prev,
                              projects: [...(prev.projects || []), { title: '', description: '' }]
                            }))}
                            className="font-bold h-7 px-3 text-xs"
                          >
                            + Add Project
                          </Button>
                        </div>

                        {optimizedResume.projects?.map((proj: any, projIdx: number) => (
                          <div key={projIdx} className="p-4 bg-muted/20 border rounded-xl space-y-4 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setOptimizedResume((prev: any) => ({
                                ...prev,
                                projects: prev.projects.filter((_: any, i: number) => i !== projIdx)
                              }))}
                              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 w-8 h-8 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">Project Title</label>
                              <Input
                                value={proj.title || ''}
                                onChange={(e) => {
                                  const updated = [...optimizedResume.projects];
                                  updated[projIdx] = { ...proj, title: e.target.value };
                                  setOptimizedResume((prev: any) => ({ ...prev, projects: updated }));
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-muted-foreground">Project Description</label>
                              <textarea
                                value={proj.description || ''}
                                onChange={(e) => {
                                  const updated = [...optimizedResume.projects];
                                  updated[projIdx] = { ...proj, description: e.target.value };
                                  setOptimizedResume((prev: any) => ({ ...prev, projects: updated }));
                                }}
                                className="w-full h-24 p-3 rounded-xl border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Education</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOptimizedResume((prev: any) => ({
                              ...prev,
                              education: [...(prev.education || []), { degree: '', school: '', duration: '' }]
                            }))}
                            className="font-bold h-7 px-3 text-xs"
                          >
                            + Add Education
                          </Button>
                        </div>

                        {optimizedResume.education?.map((edu: any, eduIdx: number) => (
                          <div key={eduIdx} className="p-4 bg-muted/20 border rounded-xl space-y-4 relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setOptimizedResume((prev: any) => ({
                                ...prev,
                                education: prev.education.filter((_: any, i: number) => i !== eduIdx)
                              }))}
                              className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 w-8 h-8 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Degree / Major</label>
                                <Input
                                  value={edu.degree || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.education];
                                    updated[eduIdx] = { ...edu, degree: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, education: updated }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">School / University</label>
                                <Input
                                  value={edu.school || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.education];
                                    updated[eduIdx] = { ...edu, school: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, education: updated }));
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">Duration</label>
                                <Input
                                  value={edu.duration || ''}
                                  onChange={(e) => {
                                    const updated = [...optimizedResume.education];
                                    updated[eduIdx] = { ...edu, duration: e.target.value };
                                    setOptimizedResume((prev: any) => ({ ...prev, education: updated }));
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CandidateRatingModal
        ratingApp={ratingApp}
        onClose={() => setRatingApp(null)}
        ratings={ratings}
        newSkill={newSkill}
        onNewSkillChange={setNewSkill}
        onAddSkill={handleAddSkill}
        onRatingChange={handleRatingChange}
        onRemoveSkill={handleRemoveSkill}
        onSaveRatings={handleSaveRatings}
        isPending={rateSkillsMutation.isPending}
      />

      <CandidateFeedbackModal
        feedbackApp={feedbackApp}
        onClose={() => setFeedbackApp(null)}
        loadingFeedback={loadingFeedback}
        rejectionFeedback={rejectionFeedback}
      />

      <CandidateProfileModals
        user={user}
        isEditProfileOpen={isEditProfileOpen}
        onEditProfileClose={() => setIsEditProfileOpen(false)}
        registerProfile={registerProfile}
        handleProfileSubmit={handleProfileSubmit}
        onProfileSubmit={onProfileSubmit}
        profileErrors={profileErrors}
        isProfileSubmitting={isProfileSubmitting}
        isUpdatingProfile={isUpdatingProfile}

        isChangePasswordOpen={isChangePasswordOpen}
        onChangePasswordClose={() => setIsChangePasswordOpen(false)}
        registerPassword={registerPassword}
        handlePasswordSubmit={handlePasswordSubmit}
        onPasswordSubmit={onPasswordSubmit}
        passwordErrors={passwordErrors}
        isPasswordSubmitting={isPasswordSubmitting}
        isChangingPassword={isChangingPassword}

        isDeleteAccountOpen={isDeleteAccountOpen}
        onDeleteAccountClose={() => setIsDeleteAccountOpen(false)}
        onDeleteAccountConfirm={handleDeleteAccountConfirm}
        isDeletingAccount={isDeletingAccount}
      />
    </div>
  );
}

export default CandidateDashboardPage;
