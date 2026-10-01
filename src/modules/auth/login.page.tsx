import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from './login-form.component.js';
import { AuthLayout } from '@/components/layout/AuthLayout.js';
import { Button } from '@/components/ui/Button/index.js';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { Sparkles } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const applyJobId = searchParams.get('applyJobId');
      if (applyJobId) {
        navigate(`/?applyJobId=${applyJobId}`, { replace: true });
      } else if (user.role?.toUpperCase() === 'HR' || user.role?.toUpperCase() === 'ADMIN') {
        navigate('/hr-dashboard', { replace: true });
      } else {
        navigate('/candidate-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoading, navigate, searchParams]);

  if (isLoading) {
    return null;
  }

  return (
    <AuthLayout
      marketingTitle={<>Hire Smarter.<br /><span className="text-zinc-500">Scale Faster.</span></>}
      marketingDesc="Experience the next generation of recruitment. Our AI autonomously parses resumes, evaluates candidate skills, and seamlessly schedules interviews so you can focus on building your dream team."
    >
      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-lg">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">RecruitAI</h1>
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back</h2>
      <p className="text-muted-foreground font-medium mb-8">Please enter your details to sign in.</p>

      <LoginForm />

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        Don't have an account?{' '}
        <Button variant="link" className="p-0 h-auto font-bold" onClick={() => navigate('/register')}>
          Register
        </Button>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
