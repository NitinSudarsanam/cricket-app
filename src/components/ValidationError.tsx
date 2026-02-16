'use client';

export interface ValidationErrorProps {
  error: string | string[] | null;
  className?: string;
}

export function ValidationError({ error, className = '' }: ValidationErrorProps) {
  if (!error) return null;
  
  const errors = Array.isArray(error) ? error : [error];
  
  if (errors.length === 0) return null;
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
      <div className="flex items-start gap-2">
        <svg 
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
        
        <div className="flex-1">
          {errors.length === 1 ? (
            <p className="text-sm text-red-800">{errors[0]}</p>
          ) : (
            <ul className="text-sm text-red-800 space-y-1">
              {errors.map((err, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-red-600">•</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
