import { Plug, Unplug, PlugZap } from 'lucide-react';
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

  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border px-3 gap-1">
      {/* Connect Button - shows Plug when disconnected, PlugZap when connected */}
      <button
        className={`flex items-center justify-center w-8 h-8 transition-colors ${
          isConnected
            ? 'text-success cursor-default'
            : 'text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
        onClick={onConnect}
        disabled={isConnected || isConnecting}
        title={isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Connect to controller'}
      >
        {isConnected ? <PlugZap size={18} /> : <Plug size={18} />}
      </button>

      {/* Disconnect Button */}
      <button
        className={`flex items-center justify-center w-8 h-8 transition-colors ${
          isConnected
            ? 'text-text-secondary hover:bg-bg-hover'
            : 'text-text-secondary opacity-40 cursor-default'
        }`}
        onClick={onDisconnect}
        disabled={!isConnected}
        title={isConnected ? 'Disconnect from controller' : 'Not connected'}
      >
        <Unplug size={18} />
      </button>

      <div className="flex-1" />
    </div>
  );
}
