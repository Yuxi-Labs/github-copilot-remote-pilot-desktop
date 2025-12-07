import { Wifi, WifiOff, MessageCircle, Clock, RefreshCw, Signal, SignalHigh, SignalLow, SignalMedium, Battery, BatteryCharging, Zap, CloudOff } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  connectionUrl: string;
  messageCount: number;
  latency?: number;
  connectionQuality?: 'good' | 'fair' | 'poor' | 'unknown';
  batteryLevel?: number;
  isCharging?: boolean;
  bandwidthMode?: 'high' | 'medium' | 'low';
  isOnline?: boolean;
  reconnectAttempts?: number;
  onManualReconnect?: () => void;
}

export function StatusBar({
  connectionStatus,
  connectionUrl,
  messageCount,
  latency,
  connectionQuality = 'unknown',
  batteryLevel,
  isCharging,
  bandwidthMode,
  isOnline = true,
  reconnectAttempts = 0,
  onManualReconnect,
}: StatusBarProps) {
  const isConnected = connectionStatus === 'connected';

  const statusColors = {
    connected: 'text-success',
    connecting: 'text-warning',
    disconnected: 'text-gray-500',
    error: 'text-error',
  };

  const qualityColors = {
    good: 'text-green-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500',
    unknown: 'text-gray-500',
  };

  const qualityIcons = {
    good: SignalHigh,
    fair: SignalMedium,
    poor: SignalLow,
    unknown: Signal,
  };

  const QualityIcon = qualityIcons[connectionQuality];

  const getStatusLabel = () => {
    if (connectionStatus === 'connecting' && reconnectAttempts > 0) {
      return `Reconnecting (${reconnectAttempts}/10)...`;
    }
    return {
      connected: 'Connected',
      connecting: 'Connecting...',
      disconnected: 'Disconnected',
      error: 'Connection Error',
    }[connectionStatus];
  };

  const showManualReconnect = reconnectAttempts >= 10 && connectionStatus !== 'connected';

  return (
    <div className="flex items-center justify-between h-6 bg-bg-secondary border-t border-border px-3 text-xs">
      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className={`flex items-center gap-1.5 ${statusColors[connectionStatus]}`} title={`Status: ${getStatusLabel()}`}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{getStatusLabel()}</span>
        </div>

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 text-warning" title="No internet connection">
            <CloudOff size={12} />
            <span>Offline</span>
          </div>
        )}

        {/* Connection Quality Indicator */}
        {isConnected && connectionQuality !== 'unknown' && (
          <div 
            className={`flex items-center gap-1.5 ${qualityColors[connectionQuality]}`}
            title={`Connection quality: ${connectionQuality} (${latency}ms avg)`}
          >
            <QualityIcon size={12} />
            <span className="text-xs capitalize">{connectionQuality}</span>
          </div>
        )}

        {/* Manual Reconnect Button */}
        {showManualReconnect && (
          <button
            onClick={onManualReconnect}
            className="flex items-center gap-1 px-2 py-0.5 text-xs text-accent hover:bg-bg-hover transition-colors"
            title="Reconnect manually"
          >
            <RefreshCw size={10} />
            <span>Reconnect</span>
          </button>
        )}

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

        {/* Battery Status */}
        {batteryLevel !== undefined && batteryLevel < 90 && (
          <div 
            className={`flex items-center gap-1.5 ${
              batteryLevel < 20 ? 'text-error' : batteryLevel < 50 ? 'text-warning' : 'text-text-secondary'
            }`}
            title={`Battery: ${batteryLevel}% ${isCharging ? '(Charging)' : ''}`}
          >
            {isCharging ? <BatteryCharging size={12} /> : <Battery size={12} />}
            <span>{batteryLevel}%</span>
          </div>
        )}

        {/* Bandwidth Mode */}
        {bandwidthMode && bandwidthMode !== 'high' && isConnected && (
          <div 
            className={`flex items-center gap-1.5 ${
              bandwidthMode === 'low' ? 'text-warning' : 'text-text-secondary'
            }`}
            title={`Bandwidth mode: ${bandwidthMode}`}
          >
            <Zap size={12} />
            <span className="capitalize">{bandwidthMode}</span>
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
