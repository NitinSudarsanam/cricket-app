'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import styles from '@/styles/components/FormInput.module.css';
import { classNames, conditionalClass } from '@/utils/classNames';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

/**
 * FormInput Component
 * 
 * A reusable form input component with label, error, and helper text support.
 * Follows Single Responsibility Principle: Handles form input rendering and validation display.
 * Follows Interface Segregation Principle: Extends only necessary HTML input attributes.
 */
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, className = '', ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <div className={styles.container}>
        {label && (
          <InputLabel label={label} required={required} />
        )}
        
        <Input
          ref={ref}
          hasError={hasError}
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

/**
 * Input Label Component
 * Follows Single Responsibility: Only renders the label
 */
function InputLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className={styles.label}>
      {label}
      {required && <span className={styles.required}>*</span>}
    </label>
  );
}

/**
 * Input Field Component
 * Follows Single Responsibility: Only renders the input field
 */
const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { hasError: boolean }>(
  ({ hasError, className, ...props }, ref) => {
    const inputClasses = classNames(
      styles.input,
      conditionalClass(hasError, styles.inputError, styles.inputDefault),
      className
    );
    
    return (
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/**
 * Error Message Component
 * Follows Single Responsibility: Only renders error messages
 */
function ErrorMessage({ id, error }: { id?: string; error: string }) {
  return (
    <p 
      id={id ? `${id}-error` : undefined}
      className={styles.errorMessage}
    >
      <ErrorIcon />
      {error}
    </p>
  );
}

/**
 * Helper Text Component
 * Follows Single Responsibility: Only renders helper text
 */
function HelperText({ id, text }: { id?: string; text: string }) {
  return (
    <p 
      id={id ? `${id}-helper` : undefined}
      className={styles.helperText}
    >
      {text}
    </p>
  );
}

/**
 * Error Icon Component
 * Follows Single Responsibility: Only renders the error icon
 */
function ErrorIcon() {
  return (
    <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
      <path 
        fillRule="evenodd" 
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
        clipRule="evenodd" 
      />
    </svg>
  );
}

/**
 * Get aria-describedby attribute value
 * Follows Single Responsibility: Only handles accessibility attribute logic
 */
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
