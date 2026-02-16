'use client';

import { Component, ReactNode } from 'react';
import { Button, Card } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReport = () => {
    const { error } = this.state;
    if (error) {
      console.error('Error report:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      alert('Error has been logged to the console. Please contact support if the issue persists.');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card padded className="max-w-md w-full shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-slate-900 text-center">
              Something went wrong
            </h2>
            
            <p className="mt-2 text-sm text-slate-600 text-center">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button className="flex-1" variant="secondary" onClick={this.handleReport}>
                Report Issue
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
