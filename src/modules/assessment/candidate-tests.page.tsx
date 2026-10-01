import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { useGetCandidateTestsQuery } from './assessment.api.js';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.js';
import { 
  Sparkles, ArrowLeft, Sun, Moon, LogOut, FileText, CheckCircle2, XCircle, 
  Clock, Calendar, ChevronRight, AlertCircle
} from 'lucide-react';

export function CandidateTestsPage() {
  const { logout, themeMode, toggleTheme } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useGetCandidateTestsQuery();
  const tests = data?.tests || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/candidate-dashboard')} className="font-bold gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-md">
                <Sparkles className="text-white w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base tracking-tight">RecruitAI <span className="opacity-50">Test History</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {themeMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 font-bold"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-extrabold text-primary mb-3">
                <FileText className="w-3.5 h-3.5" /> Application Test History
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                My Assessment History
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                View your adaptive test scores, pass/fail status, and AI skill analysis for each applied position.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Progress value={45} className="w-64" />
            <p className="text-xs font-bold text-muted-foreground">Loading test attempts...</p>
          </div>
        ) : tests.length === 0 ? (
          <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-500 max-w-xl mx-auto py-6">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            <AlertTitle className="text-lg font-bold">No Tests Available Yet</AlertTitle>
            <AlertDescription className="text-sm mt-2 leading-relaxed">
              You haven't completed any assessments yet. When you apply for a job and calibrate your skills, your adaptive AI test report will be saved here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test: any) => {
              const isQualified = test.passFailStatus === 'QUALIFIED';
              const isFailed = test.passFailStatus === 'FAILED';

              return (
                <Card 
                  key={test.applicationId}
                  onClick={() => navigate(`/candidate/tests/${test.applicationId}`)}
                  className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${
                    isQualified ? 'border-green-500/30 hover:border-green-500/60' :
                    isFailed ? 'border-red-500/30 hover:border-red-500/60' : 'border-border/60'
                  }`}
                >
                  <CardContent className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                          {test.department}
                        </span>
                        <h3 className="text-xl font-black tracking-tight mt-1 text-foreground">
                          {test.jobTitle}
                        </h3>
                      </div>
                      <Badge className={`font-black uppercase tracking-wider text-[10px] px-2.5 py-1 ${
                        isQualified ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' :
                        isFailed ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' :
                        'bg-yellow-500/15 text-yellow-600 border-yellow-500/30'
                      }`}>
                        {isQualified ? <CheckCircle2 className="w-3 h-3 mr-1 inline" /> : null}
                        {isFailed ? <XCircle className="w-3 h-3 mr-1 inline" /> : null}
                        {test.passFailStatus}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block">Test Score</span>
                        <div className="text-2xl font-black text-foreground mt-0.5">
                          {test.score !== null ? `${test.score}%` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground block">Time Taken</span>
                        <div className="text-sm font-bold text-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-primary" /> {test.timeTaken}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(test.testDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-bold hover:underline">
                        <span>View Detailed Report</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default CandidateTestsPage;
