import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { useGetTestReportQuery } from './assessment.api.js';
import { TestReportDetails } from './test-report-details.component.js';
import { Button } from '@/components/ui/Button/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.js';
import { ArrowLeft, Sun, Moon, LogOut, Sparkles, AlertTriangle } from 'lucide-react';

export function CandidateTestReportPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();
  const { logout, themeMode, toggleTheme } = useAuth();

  const appId = parseInt(applicationId || '0', 10);
  const { data: report, isLoading, error } = useGetTestReportQuery(appId, { skip: !appId });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Progress value={50} className="w-64" />
        <p className="text-xs font-bold text-muted-foreground">Loading test report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background p-8 container mx-auto max-w-xl">
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Report Not Found</AlertTitle>
          <AlertDescription>
            Unable to fetch test report for application ID {applicationId}.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/candidate/tests')} className="mt-4 font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Test History
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/candidate/tests')}
              className="font-bold gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tests
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-md">
                <Sparkles className="text-white w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight">
                {report.job.title}{' '}
                <span className="text-muted-foreground font-normal text-xs">Report</span>
              </span>
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

      {/* Report Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <TestReportDetails report={report} />
      </main>
    </div>
  );
}

export default CandidateTestReportPage;
