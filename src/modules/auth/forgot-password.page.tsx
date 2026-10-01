import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { AuthLayout } from '@/components/layout/AuthLayout.js';
import { Button } from '@/components/ui/Button/index.js';
import { FormInput } from '@/components/forms/FormInput.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { Sparkles, Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setApiError('');
    try {
      await axios.post('/auth/forgot-password', { email: data.email });
      setIsSubmitted(true);
    } catch (err: any) {
      setApiError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <AuthLayout
      marketingTitle={<>Security & Access.<br /><span className="text-zinc-500">Restored Instantly.</span></>}
      marketingDesc="Our secure token-based password reset system ensures you can recover access to your profile and resume your application workflow in minutes."
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

      {!isSubmitted ? (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Forgot Password</h2>
          <p className="text-muted-foreground font-medium mb-8">
            Enter your registered email address below, and we will send you a link to reset your password.
          </p>

          {apiError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-semibold">{apiError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<Mail className="h-4 w-4" />}
              register={register('email')}
              error={errors.email?.message}
            />

            <Button type="submit" size="lg" className="w-full font-bold mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-3">Check your inbox</h2>
          <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
            If an account is registered with that email, we've sent instructions on how to reset your password.
          </p>
          <Button onClick={() => navigate('/login')} size="lg" className="w-full font-bold">
            Return to Login
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
