import { Wifi, WifiOff, MessageCircle, Clock } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  connectionUrl: string;
  messageCount: number;
  latency?: number;
}

export function StatusBar({
  connectionStatus,
  connectionUrl,
  messageCount,
  latency,
}: StatusBarProps) {
  const isConnected = connectionStatus === 'connected';

  const statusColors = {
    connected: 'text-success',
    connecting: 'text-warning',
    disconnected: 'text-gray-500',
    error: 'text-error',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  };

  return (
    <div className="flex items-center justify-between h-6 bg-bg-secondary border-t border-border px-3 text-xs">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 ${statusColors[connectionStatus]}`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{statusLabels[connectionStatus]}</span>
        </div>

        {/* URL */}
        {isConnected && connectionUrl && (
          <div className="text-text-secondary max-w-[200px] truncate" title={connectionUrl}>
            {connectionUrl.replace(/^wss?:\/\//, '')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Latency */}
        {latency !== undefined && isConnected && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Clock size={12} />
            <span>{latency}ms</span>
          </div>
        )}

        {/* Message Count */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <MessageCircle size={12} />
          <span>{messageCount} messages</span>
        </div>
      </div>
    </div>
  );
}
