import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <GlobalErrorFallback
            error={this.state.error}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }
    return this.props.children;
  }
}

export const GlobalErrorFallback: React.FC<{
  error: Error | null;
  onRetry?: () => void;
}> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-red-500/20 p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.27 16A2 2 0 005.07 19z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="text-slate-400 text-sm">
        {error?.message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      )}
      <button
        onClick={() => (window.location.href = '/')}
        className="block w-full text-slate-400 hover:text-white text-sm transition-colors"
      >
        Go to Home
      </button>
    </div>
  </div>
);
