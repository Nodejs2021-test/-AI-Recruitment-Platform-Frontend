import React from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Label } from '@/components/ui/Label/index.js';
import { Input } from '@/components/ui/Input/index.js';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: UseFormRegisterReturn;
  error?: string;
  icon?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  register,
  error,
  icon,
  id,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-fade-in">
            {icon}
          </div>
        )}
        <Input
          id={id}
          className={`${icon ? 'pl-9' : ''} bg-secondary/50 ${className}`}
          {...register}
          {...props}
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
};

export default FormInput;
