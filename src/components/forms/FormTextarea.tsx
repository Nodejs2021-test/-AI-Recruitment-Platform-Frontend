import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '@/components/ui/Label/index.js';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  register,
  error,
  id,
  className = '',
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        className={`w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none ${className}`}
        rows={rows}
        {...register}
        {...props}
      />
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};

export default FormTextarea;
