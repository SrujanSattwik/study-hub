import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[KnowNook UI ErrorBoundary]', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-gray-100 font-sans">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl text-center space-y-4">
            <span className="text-4xl block">⚠️</span>
            <h2 className="font-bold text-white text-lg">Something went wrong</h2>
            <p className="text-xs text-gray-400">
              An unexpected UI error occurred. Please refresh the page or click below to reload KnowNook.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs transition"
            >
              🔄 Refresh Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
