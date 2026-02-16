'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  "form-input",
  {
    variants: {
      variant: {
        default: "form-input-default",
        error: "form-input-error"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

/**
 * FormInput Component
 * 
 * Semantic form input component.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, className = '', variant, ...props }, ref) => {
    const hasError = !!error;
    const inputVariant = hasError ? 'error' : (variant || 'default');

    return (
      <div className="form-container">
        {label && (
          <InputLabel label={label} required={required} />
        )}

        <Input
          ref={ref}
          variant={inputVariant}
          className={className}
          aria-invalid={hasError}
          aria-describedby={getAriaDescribedBy(props.id, hasError, helperText)}
          {...props}
        />

        {hasError && (
          <ErrorMessage id={props.id} error={error!} />
        )}

        {!hasError && helperText && (
          <HelperText id={props.id} text={helperText} />
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

function InputLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="form-label">
      {label}
      {required && <span className="form-label-required">*</span>}
    </label>
  );
}

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & VariantProps<typeof inputVariants>>(
  ({ variant, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(inputVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

function ErrorMessage({ id, error }: { id?: string; error: string }) {
  return (
    <p
      id={id ? `${id}-error` : undefined}
      className="form-error-message"
    >
      <ErrorIcon />
      {error}
    </p>
  );
}

function HelperText({ id, text }: { id?: string; text: string }) {
  return (
    <p
      id={id ? `${id}-helper` : undefined}
      className="form-helper-text"
    >
      {text}
    </p>
  );
}

function ErrorIcon() {
  return (
    <svg className="form-error-icon" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getAriaDescribedBy(
  id: string | undefined,
  hasError: boolean,
  helperText: string | undefined
): string | undefined {
  if (!id) return undefined;
  if (hasError) return `${id}-error`;
  if (helperText) return `${id}-helper`;
  return undefined;
}
