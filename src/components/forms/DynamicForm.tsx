import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import { Button } from '@/components/ui/Button/index.js';
import { FormInput } from './FormInput.js';
import { FormSelect } from './FormSelect.js';
import { FormTextarea } from './FormTextarea.js';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'select' | 'textarea';
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  icon?: React.ReactNode;
}

interface DynamicFormProps {
  fields: FormFieldConfig[];
  schema: ZodSchema;
  defaultValues?: any;
  onSubmit: (data: any) => void;
  submitText: string;
  isSubmitting?: boolean;
}

export function DynamicForm({
  fields,
  schema,
  defaultValues,
  onSubmit,
  submitText,
  isSubmitting,
}: DynamicFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field) => {
        const error = errors[field.name]?.message as string | undefined;

        if (field.type === 'select') {
          return (
            <FormSelect
              key={field.name}
              label={field.label}
              name={field.name}
              value={watch(field.name) || ''}
              onValueChange={(val) => setValue(field.name, val, { shouldValidate: true })}
              options={field.options || []}
              placeholder={field.placeholder}
              error={error}
            />
          );
        }

        if (field.type === 'textarea') {
          return (
            <FormTextarea
              key={field.name}
              id={field.name}
              label={field.label}
              placeholder={field.placeholder}
              register={register(field.name)}
              error={error}
            />
          );
        }

        return (
          <FormInput
            key={field.name}
            id={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            icon={field.icon}
            register={register(field.name)}
            error={error}
          />
        );
      })}

      <Button type="submit" size="lg" className="w-full font-bold mt-2" disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : submitText}
      </Button>
    </form>
  );
}

export default DynamicForm;
