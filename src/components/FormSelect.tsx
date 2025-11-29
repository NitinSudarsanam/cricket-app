'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

export interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, required, className = '', children, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg
            focus:ring-2 focus:outline-none transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError 
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }
            ${className}
          `}
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
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        
        {!hasError && helperText && (
          <p 
            id={`${props.id}-helper`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
