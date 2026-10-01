import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthLayout } from '@/components/layout/AuthLayout.js';
import { Button } from '@/components/ui/Button/index.js';
import { FormInput } from '@/components/forms/FormInput.js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert/index.js';
import { Sparkles, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Confirm Password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    let parsedToken = new URLSearchParams(hash.replace('#', '?')).get('access_token');

    if (!parsedToken) {
      const searchParams = new URLSearchParams(window.location.search);
      parsedToken = searchParams.get('token') || searchParams.get('access_token');
    }

    if (parsedToken) {
      setToken(parsedToken);
    } else {
      setErrorMsg('No active verification token was found. The password reset link may have expired or is invalid.');
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setApiError('Missing verification token. Cannot reset password.');
      return;
    }
    setApiError('');
    try {
      await axios.put(
        '/auth/change-password',
        { newPassword: data.newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setApiError(err.response?.data?.error || 'Failed to update your password. The link might be expired.');
    }
  };

  return (
    <AuthLayout
      marketingTitle={<>Secure Access.<br /><span className="text-zinc-500">Always Protected.</span></>}
      marketingDesc="Your credentials are encrypted and stored securely using state-of-the-art hashing algorithms, ensuring total privacy and control over your candidate profile."
    >
      <button
        onClick={() => navigate('/login')}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </button>

      <div className="mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center shadow-lg">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">RecruitAI</h1>
      </div>

      {errorMsg ? (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Recovery Link</AlertTitle>
            <AlertDescription className="font-semibold leading-relaxed mt-1">
              {errorMsg}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/forgot-password')}
            size="lg"
            className="w-full font-bold cursor-pointer"
          >
            Request a New Link
          </Button>
        </div>
      ) : isSuccess ? (
        <div className="text-center py-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-3">Password updated!</h2>
          <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
            Your password has been changed successfully. Redirecting you to the login page...
          </p>
          <Button onClick={() => navigate('/login')} size="lg" className="w-full font-bold cursor-pointer">
            Go to Login Page
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Reset Password</h2>
          <p className="text-muted-foreground font-medium mb-8">
            Please enter and confirm your new password below.
          </p>

          {apiError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-semibold">{apiError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
              id="newPassword"
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              register={register('newPassword')}
              error={errors.newPassword?.message}
            />

            <FormInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              register={register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button type="submit" size="lg" className="w-full font-bold mt-6" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordPage;
