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

  const handleToggle = () => {
    if (isConnected) {
      onDisconnect();
    } else {
      onConnect();
    }
  };

  // Icon button styles based on connection state
  const iconButtonStyle = isConnected
    ? 'text-success hover:bg-success/10'
    : 'text-text-secondary hover:bg-bg-hover';

  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border px-3 gap-1">
      {/* Connection Toggle Icon */}
      <button
        className={`flex items-center justify-center w-8 h-8 transition-colors ${iconButtonStyle} disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleToggle}
        disabled={isConnecting}
        title={isConnected ? 'Disconnect from controller' : 'Connect to controller'}
      >
        {isConnecting ? (
          <Loader2 size={18} className="animate-spin text-warning" />
        ) : isConnected ? (
          <Unplug size={18} className="text-success" />
        ) : (
          <Plug size={18} />
        )}
      </button>

      <div className="flex-1" />
    </div>
  );
}
