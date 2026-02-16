'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const selectVariants = cva(
  "form-select",
  {
    variants: {
      variant: {
        default: "form-select-default",
        error: "form-select-error"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>, VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, required, className = '', children, variant, ...props }, ref) => {
    const hasError = !!error;
    const selectVariant = hasError ? 'error' : (variant || 'default');

    return (
      <div className="form-container">
        {label && (
          <label className="form-label">
            {label}
            {required && <span className="form-label-required">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={cn(selectVariants({ variant: selectVariant }), className)}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          {...props}
        >
          {children}
        </select>

        {hasError && (
          <p
            id={`${props.id}-error`}
            className="form-error-message"
          >
            <svg className="form-error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={`${props.id}-helper`}
            className="form-helper-text"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
