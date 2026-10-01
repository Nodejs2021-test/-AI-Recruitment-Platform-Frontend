import { useState } from 'react';
import { useGetJobsQuery } from './jobs.api.js';
import { 
  useGetCandidateApplicationsQuery, 
  useApplyJobMutation,
  useGetCandidateProfileQuery,
  useUpgradeCandidateMutation
} from '@/modules/candidates/index.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { Button } from '@/components/ui/Button/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { toast } from 'react-toastify';
import { Search, MapPin, Briefcase, Sun, Moon, LogOut, LayoutDashboard, Sparkles, TrendingUp, DollarSign, Clock, AlertCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  department: string;
  experienceRequired: string;
  employmentType: string;
  location: string;
  salaryRange: string;
  description: string;
  requiredSkills: string[];
  status: string;
  matchPercentage?: number;
}

export function JobPortalPage() {
  const { user, logout, themeMode, toggleTheme, updateUser } = useAuth();
  const navigate = useNavigate();

  // Filters
  const [keyword, setKeyword] = useState('');
  const [department, setDepartment] = useState('all');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

  // Upgrade Modal State
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Local applying state to prevent global loading on all cards
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);

  // Fetch candidate profile to check if they have a stored resume
  const { data: profile } = useGetCandidateProfileQuery(undefined, {
    skip: !user || user.role !== 'CANDIDATE',
  });

  // Query jobs using RTK Query
  const { data: jobs = [], isLoading, isError } = useGetJobsQuery({
    keyword,
    department: department === 'all' ? '' : department,
    location,
    experience,
    status: 'OPEN'
  });

  // Query candidate applications using RTK Query
  const { data: applications = [] } = useGetCandidateApplicationsQuery(undefined, {
    skip: !user || user.role !== 'CANDIDATE',
  });

  const getApplicationForJob = (job: Job) => {
    return applications.find((app: any) => app.jobId === job.id || (app.job && app.job.title === job.title));
  };

  // Mutation for applying using RTK Query
  const [applyJob] = useApplyJobMutation();
  const [upgradeCandidate, { isLoading: isUpgrading }] = useUpgradeCandidateMutation();

  const handleApplyClick = async (job: Job) => {
    if (!user) {
      navigate(`/login?applyJobId=${job.id}`);
      return;
    }
    if (user.role !== 'CANDIDATE') {
      toast.warn('Only candidates can apply for jobs.');
      return;
    }

    const hasResume = profile?.resumes && profile.resumes.length > 0;
    if (!hasResume) {
      toast.error('No CV uploaded. Please upload a CV in your profile tab first.');
      navigate('/candidate-dashboard');
      return;
    }

    setApplyingJobId(job.id);
    try {
      await applyJob({ jobId: job.id }).unwrap();
      toast.success('CV fetched automatically. Calibrate your skills to begin assessment.');
      navigate('/candidate-dashboard');
    } catch (err: any) {
      toast.error(err.data?.error || err.error || 'Failed to submit application. Please try again.');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleUpgradeSubmit = async () => {
    try {
      await upgradeCandidate().unwrap();
      updateUser({ membershipType: 'Premium' });
      toast.success('Successfully upgraded to Premium! AI matching features unlocked.');
      setUpgradeOpen(false);
    } catch (err: any) {
      toast.error(err.data?.error || 'Upgrade failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-md">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">RecruitAI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const role = user.role?.toUpperCase();
                    navigate(role === 'HR' || role === 'ADMIN' ? '/hr-dashboard' : '/candidate-dashboard');
                  }}
                  className="font-semibold gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive hover:text-destructive/90 font-semibold gap-1.5"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative py-12 sm:py-20 lg:py-28 text-center overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="absolute top-[-10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[25vw] h-[25vw] rounded-full bg-indigo-500/10 blur-[80px]" />
        
        <div className="container relative z-10 px-4 mx-auto">
          <Badge variant="secondary" className="mb-4 sm:mb-6 py-1.5 px-4 text-xs sm:text-sm font-semibold rounded-full">
            <Sparkles className="w-4 h-4 mr-2 text-primary" /> AI-Powered Recruitment
          </Badge>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight mb-4 sm:mb-6 max-w-4xl mx-auto leading-tight">
            Discover roles that match your <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">true potential</span>.
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-10 max-w-2xl mx-auto font-medium">
            Our autonomous AI evaluator seamlessly matches your skills with top companies, fast-tracking you directly to the interview stage.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-12">

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-6">
          <Button 
            variant="outline" 
            className="w-full justify-between font-bold"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> Refine Search Filters
            </span>
            {showMobileFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 space-y-6 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 p-6 rounded-xl border bg-card/50 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-6">Refine Search</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Frontend Developer" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Remote" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="relative">
                  <TrendingUp className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. 5+ years" 
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Job Listings */}
          <div className="lg:col-span-3">
            {isLoading && <Progress className="h-1.5 mb-8" />}
            
            {isError && (
              <Alert variant="destructive" className="mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Failed to fetch jobs. Please verify the backend connection.</AlertDescription>
              </Alert>
            )}

            {!isLoading && jobs.length === 0 && (
              <div className="text-center py-24 border-2 border-dashed rounded-xl">
                <Briefcase className="w-16 h-16 mx-auto text-muted mb-4" />
                <h3 className="text-2xl font-bold text-muted-foreground mb-2">No opportunities found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to discover more roles.</p>
              </div>
            )}

            <div className="space-y-4">
              {jobs.map((job: Job) => {
                const app = getApplicationForJob(job);
                return (
                  <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-all border-muted/60">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-3">
                        <div className="md:col-span-2 p-6 md:p-8">
                          <div className="flex gap-2 mb-4">
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{job.department}</Badge>
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-500">{job.employmentType}</Badge>
                            
                            {user && (user as any).membershipType === 'Premium' && job.matchPercentage !== undefined ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold ml-2">
                                <Sparkles className="w-3 h-3 mr-1 animate-pulse" /> {job.matchPercentage}% Match
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 font-bold ml-2 cursor-pointer hover:bg-yellow-500/10"
                                onClick={() => setUpgradeOpen(true)}
                              >
                                <Sparkles className="w-3 h-3 mr-1 text-yellow-500" /> Unlock Match %
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-2xl font-bold mb-3 tracking-tight">{job.title}</h2>
                          <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                            {job.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="font-normal">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l bg-muted/10 flex flex-col justify-between">
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-3" /> {job.location}
                            </div>
                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                              <DollarSign className="w-4 h-4 mr-3" /> {job.salaryRange}
                            </div>
                            <div className="flex items-center text-sm font-medium text-muted-foreground">
                              <Clock className="w-4 h-4 mr-3" /> {job.experienceRequired}
                            </div>
                          </div>
                          
                          <div>
                            {!app ? (
                              <Button 
                                className="w-full font-bold" 
                                onClick={() => handleApplyClick(job)} 
                                disabled={applyingJobId === job.id}
                              >
                                {applyingJobId === job.id ? 'Applying...' : 'Apply Now'}
                              </Button>
                            ) : (
                              <div className="text-center p-3 bg-muted rounded-xl border">
                                <p className="text-sm font-bold text-muted-foreground mb-1">Already Applied</p>
                                <Badge variant="outline" className="font-bold bg-primary/5 text-primary border-primary/20">
                                  Status: {app.status.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Premium Upgrade Modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-yellow-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" /> Upgrade to Premium
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium mt-1">
              Unlock the full power of RecruitAI's autonomous evaluation suite.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="border border-yellow-500/20 rounded-xl p-5 bg-yellow-500/5 space-y-3.5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">AI-Powered Job Match Percentage</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Automatically calculate how well your CV fits every job description instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">AI CV Analysis</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Structured extraction of your core skills, certifications, languages, and project experience.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">AI Resume Improvement Suggestions</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">Get personalized keywords recommendations and increase your ATS matching score.</p>
                </div>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-3xl font-black text-white">$19</span>
              <span className="text-zinc-400 text-sm font-medium"> / one-time upgrade</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setUpgradeOpen(false)} disabled={isUpgrading}>
              Maybe Later
            </Button>
            <Button onClick={handleUpgradeSubmit} disabled={isUpgrading} className="font-bold bg-yellow-500 hover:bg-yellow-600 text-zinc-950">
              {isUpgrading ? 'Upgrading...' : 'Upgrade Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JobPortalPage;
