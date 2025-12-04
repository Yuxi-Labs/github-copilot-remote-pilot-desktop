import { Plug, Unplug, Loader2 } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ToolbarProps {
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function Toolbar({
  connectionStatus,
  onConnect,
  onDisconnect,
}: ToolbarProps) {
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  const statusStyles = {
    connected: 'bg-success/15 text-success',
    connecting: 'bg-warning/15 text-warning',
    disconnected: 'bg-gray-500/15 text-gray-500',
    error: 'bg-error/15 text-error',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Error',
  };

  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border px-3 gap-2">
      {/* Connect/Disconnect Button */}
      {isConnected ? (
        <button
          className="flex items-center gap-1.5 px-3 py-1 bg-bg-tertiary border border-border text-sm text-text-primary hover:bg-bg-hover hover:border-border-hover transition-colors"
          onClick={onDisconnect}
          title="Disconnect"
        >
          <Unplug size={14} />
          <span>Disconnect</span>
        </button>
      ) : (
        <button
          className="flex items-center gap-1.5 px-3 py-1 bg-accent border border-accent text-sm text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={onConnect}
          disabled={isConnecting}
          title="Connect"
        >
          {isConnecting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plug size={14} />
          )}
          <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}

      <div className="w-px h-5 bg-border" />

      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-2 py-0.5 text-xs font-medium ${statusStyles[connectionStatus]}`}>
        <span
          className={`w-1.5 h-1.5 bg-current ${connectionStatus === 'connecting' ? 'animate-pulse-slow' : ''}`}
        />
        <span>{statusLabels[connectionStatus]}</span>
      </div>

      <div className="flex-1" />
    </div>
  );
}
