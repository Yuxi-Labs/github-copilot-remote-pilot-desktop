import { Plug, Unplug, MessageSquarePlus, Settings, Loader2 } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ToolbarProps {
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

export function Toolbar({
  connectionStatus,
  onConnect,
  onDisconnect,
  onNewChat,
  onOpenSettings,
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
    <div className="flex items-center h-11 bg-bg-secondary border-b border-border px-3 gap-2">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[connectionStatus]}`}>
        <span
          className={`w-2 h-2 rounded-full bg-current ${connectionStatus === 'connecting' ? 'animate-pulse-slow' : ''}`}
        />
        <span>{statusLabels[connectionStatus]}</span>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary hover:bg-bg-hover hover:border-border-hover transition-colors"
            onClick={onDisconnect}
            title="Disconnect"
          >
            <Unplug size={16} />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-accent rounded-md text-sm text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={onConnect}
            disabled={isConnecting}
            title="Connect"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plug size={16} />
            )}
            <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
          </button>
        )}

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-tertiary border border-border rounded-md text-sm text-text-primary hover:bg-bg-hover hover:border-border-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={onNewChat}
          disabled={!isConnected}
          title="New Chat"
        >
          <MessageSquarePlus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Settings */}
      <button
        className="p-1.5 bg-bg-tertiary border border-border rounded-md text-text-primary hover:bg-bg-hover hover:border-border-hover transition-colors"
        onClick={onOpenSettings}
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </div>
  );
}
