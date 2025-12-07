import { X, AlertCircle, WifiOff, Shield, Bug, RefreshCw } from 'lucide-react';

export interface ErrorDetails {
  message: string;
  type?: 'auth' | 'network' | 'copilot' | 'validation' | 'internal';
  code?: string;
  suggestion?: string;
  canRetry?: boolean;
}

interface ErrorNotificationProps {
  error: ErrorDetails | string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export function ErrorNotification({ error, onDismiss, onRetry }: ErrorNotificationProps) {
  const errorDetails: ErrorDetails = typeof error === 'string' 
    ? { message: error } 
    : error;

  const getIcon = () => {
    switch (errorDetails.type) {
      case 'auth':
        return <Shield className="w-5 h-5" />;
      case 'network':
        return <WifiOff className="w-5 h-5" />;
      case 'copilot':
        return <Bug className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch (errorDetails.type) {
      case 'auth':
        return 'Authentication Error';
      case 'network':
        return 'Connection Error';
      case 'copilot':
        return 'Copilot Error';
      case 'validation':
        return 'Validation Error';
      case 'internal':
        return 'Internal Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className="px-4 py-3 bg-error/10 border-b border-error/30 text-error">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1">{getTitle()}</div>
          <div className="text-sm text-error/90">{errorDetails.message}</div>
          
          {/* Error Code */}
          {errorDetails.code && (
            <div className="text-xs text-error/70 mt-1 font-mono">
              Code: {errorDetails.code}
            </div>
          )}

          {/* Suggestion */}
          {errorDetails.suggestion && (
            <div className="text-sm text-error/80 mt-2 bg-error/5 border border-error/20 p-2">
              <div className="font-medium mb-1">💡 Suggestion:</div>
              <div>{errorDetails.suggestion}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {errorDetails.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1 text-xs bg-error/20 hover:bg-error/30 border border-error/40 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-3 py-1 text-xs hover:bg-error/20 border border-error/40 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-error/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
