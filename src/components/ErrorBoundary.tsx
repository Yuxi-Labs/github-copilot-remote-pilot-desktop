import React, { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logger } from '../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: React.ErrorInfo) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Error boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      return (
        <div className="flex items-center justify-center h-full bg-bg-primary">
          <div className="max-w-lg p-6 bg-bg-secondary border border-border rounded-lg shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={32} />
              <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
            </div>
            
            <p className="text-text-secondary mb-4">
              An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 bg-bg-primary rounded border border-border">
                <p className="text-sm font-mono text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-bg-hover text-text-primary rounded hover:bg-border transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
