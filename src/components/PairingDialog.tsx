import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PairingDialogProps {
  isOpen: boolean;
  status: 'requesting' | 'pending' | 'approved' | 'rejected' | 'error';
  pairingId?: string;
  error?: string;
  deviceName: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function PairingDialog({
  isOpen,
  status,
  pairingId,
  error,
  deviceName,
  onClose,
  onRetry,
}: PairingDialogProps) {
  if (!isOpen) return null;

  const canClose = status === 'approved' || status === 'rejected' || status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-bg-secondary border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Device Pairing</h2>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Requesting */}
          {status === 'requesting' && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
              <p className="text-text-primary font-medium mb-2">Requesting pairing...</p>
              <p className="text-sm text-text-secondary">Connecting to controller</p>
            </div>
          )}

          {/* Pending */}
          {status === 'pending' && (
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-accent mx-auto mb-4 animate-spin" />
              <p className="text-text-primary font-medium mb-2">Waiting for approval</p>
              <p className="text-sm text-text-secondary mb-4">
                A notification has been sent to VS Code.
                <br />
                Please approve the pairing request.
              </p>
              <div className="bg-bg-primary border border-border p-3 text-left">
                <div className="text-xs text-text-secondary mb-1">Device Name</div>
                <div className="text-sm text-text-primary font-medium">{deviceName}</div>
                {pairingId && (
                  <>
                    <div className="text-xs text-text-secondary mt-2 mb-1">Pairing ID</div>
                    <div className="text-xs text-text-tertiary font-mono">{pairingId}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Approved */}
          {status === 'approved' && (
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
              <p className="text-text-primary font-medium mb-2">Pairing approved!</p>
              <p className="text-sm text-text-secondary">
                Your device has been successfully paired.
                <br />
                Connecting...
              </p>
            </div>
          )}

          {/* Rejected */}
          {status === 'rejected' && (
            <div className="text-center">
              <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
              <p className="text-text-primary font-medium mb-2">Pairing rejected</p>
              <p className="text-sm text-text-secondary mb-4">
                The pairing request was denied.
              </p>
              {error && (
                <div className="bg-error/10 border border-error/30 p-3 text-left mb-4">
                  <div className="text-xs text-error">{error}</div>
                </div>
              )}
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="text-center">
              <XCircle className="w-12 h-12 text-error mx-auto mb-4" />
              <p className="text-text-primary font-medium mb-2">Connection error</p>
              <p className="text-sm text-text-secondary mb-4">
                Failed to connect to the controller.
              </p>
              {error && (
                <div className="bg-error/10 border border-error/30 p-3 text-left mb-4">
                  <div className="text-xs text-error">{error}</div>
                </div>
              )}
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
