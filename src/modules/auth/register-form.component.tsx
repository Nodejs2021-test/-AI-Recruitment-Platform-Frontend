import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from './auth.validation.js';
import { useAuth } from '@/app/providers/AuthProvider.js';
import { Button } from '@/components/ui/Button/index.js';
import { FormInput } from '@/components/forms/FormInput.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { Mail, Lock, User as UserIcon, Phone, AlertCircle, Sparkles } from 'lucide-react';

export function RegisterForm() {
  const { register: signup } = useAuth();
  const [apiError, setApiError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      membershipType: 'Non-Premium'
    }
  });

  const membershipType = watch('membershipType');

  const onSubmit = async (data: any) => {
    setApiError('');
    setResumeError('');

    if (!resumeFile) {
      setResumeError('Please upload your CV/Resume file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('email', data.email);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('password', data.password);
      formData.append('membershipType', data.membershipType);
      formData.append('resume', resumeFile);

      await signup(formData);
    } catch (err: any) {
      const errMsg = err.message || 'Registration failed';
      const field = err.field;
      if (field === 'email' || field === 'phoneNumber') {
        setError(field, { type: 'manual', message: errMsg });
      } else {
        setApiError(errMsg);
      }
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          id="signup-name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<UserIcon className="h-4 w-4" />}
          register={register('fullName')}
          error={errors.fullName?.message as string}
        />

        <FormInput
          id="signup-email"
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          icon={<Mail className="h-4 w-4" />}
          register={register('email')}
          error={errors.email?.message as string}
        />

        <FormInput
          id="signup-phone"
          label="Phone Number"
          type="tel"
          placeholder="10 digit number"
          icon={<Phone className="h-4 w-4" />}
          register={register('phoneNumber')}
          error={errors.phoneNumber?.message as string}
        />

        <FormInput
          id="signup-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          register={register('password')}
          error={errors.password?.message as string}
        />

        <FormInput
          id="signup-confirm"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message as string}
        />

        <div className="space-y-2.5">
          <label className="text-sm font-bold text-foreground">Select Your Membership Plan</label>
          <div className="grid grid-cols-2 gap-3.5">
            <div 
              onClick={() => setValue('membershipType', 'Non-Premium')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between h-28 relative ${
                membershipType === 'Non-Premium' 
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div>
                <span className="font-extrabold text-sm block text-zinc-900">Standard Plan</span>
                <span className="text-[10px] font-medium text-zinc-500 mt-1 block leading-tight">Basic applications & dashboards.</span>
              </div>
              <span className="font-extrabold text-xs text-primary mt-2">FREE</span>
            </div>

            <div 
              onClick={() => setValue('membershipType', 'Premium')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 text-left flex flex-col justify-between h-28 relative ${
                membershipType === 'Premium' 
                  ? 'border-yellow-500 bg-yellow-500/5 shadow-md shadow-yellow-500/5' 
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="absolute -top-2.5 -right-2 bg-yellow-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Popular
              </div>
              <div>
                <span className="font-extrabold text-sm block text-zinc-900 flex items-center gap-1">
                  AI Premium
                </span>
                <span className="text-[10px] font-medium text-zinc-500 mt-1 block leading-tight">Unlock AI Job Matching % & assessments.</span>
              </div>
              <span className="font-extrabold text-xs text-yellow-600 dark:text-yellow-400 mt-2">$15 / mo</span>
            </div>
          </div>
          <input type="hidden" {...register('membershipType')} />
          {errors.membershipType?.message && (
            <p className="text-xs font-semibold text-destructive">{errors.membershipType.message as string}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-foreground">Upload CV / Resume (PDF, DOC, DOCX)</label>
          <div className="flex flex-col gap-1.5 border border-dashed rounded-md p-3.5 bg-card">
            <input 
              type="file" 
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setResumeFile(e.target.files[0]);
                  setResumeError('');
                }
              }} 
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
            />
            {resumeFile && (
              <p className="text-xs text-green-500 font-semibold">Selected: {resumeFile.name}</p>
            )}
          </div>
          {resumeError && (
            <p className="text-xs font-semibold text-destructive">{resumeError}</p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full font-bold mt-4" disabled={isSubmitting}>
          {isSubmitting ? 'Registering & Analyzing CV...' : 'Register & Log In'}
        </Button>
      </form>
    </div>
  );
}

export default RegisterForm;
