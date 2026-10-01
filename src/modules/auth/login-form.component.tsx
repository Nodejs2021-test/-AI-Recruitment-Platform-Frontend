import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from './auth.validation.js';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { Button } from '@/components/ui/Button/index.js';
import { FormInput } from '@/components/forms/FormInput.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setApiError('');
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setApiError(err.message || 'Login failed');
    }
  };

  return (
    <div className="space-y-6">
      {apiError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-semibold">{apiError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormInput
          id="signin-email"
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={<Mail className="h-4 w-4" />}
          register={register('email')}
          error={errors.email?.message as string}
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Password</label>
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <FormInput
            id="signin-password"
            label=""
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            register={register('password')}
            error={errors.password?.message as string}
          />
        </div>

        <Button type="submit" size="lg" className="w-full font-bold mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;
