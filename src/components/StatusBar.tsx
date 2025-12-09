import { Wifi, WifiOff, MessageCircle, RefreshCw, Signal, SignalHigh, SignalLow, SignalMedium, Zap, CloudOff, GitBranch, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { ConnectionStatus, ChatMode } from '../types';

interface StatusBarProps {
  connectionStatus: ConnectionStatus;
  connectionUrl: string;
  messageCount: number;
  latency?: number;
  connectionQuality?: 'good' | 'fair' | 'poor' | 'unknown';
  bandwidthMode?: 'high' | 'medium' | 'low';
  isOnline?: boolean;
  reconnectAttempts?: number;
  onManualReconnect?: () => void;
  // New props for richer status
  selectedMode?: ChatMode;
  selectedModel?: string;
  pendingChangesCount?: number;
  onOpenPendingChanges?: () => void;
  activeBranch?: string;
  onOpenBranchManager?: () => void;
  isStreaming?: boolean;
  streamingStatus?: string;
}

export function StatusBar({
  connectionStatus,
  connectionUrl,
  messageCount,
  latency,
  connectionQuality = 'unknown',
  bandwidthMode,
  isOnline = true,
  reconnectAttempts = 0,
  onManualReconnect,
  selectedMode,
  selectedModel,
  pendingChangesCount = 0,
  onOpenPendingChanges,
  activeBranch,
  onOpenBranchManager,
  isStreaming,
  streamingStatus,
}: StatusBarProps) {
  const isConnected = connectionStatus === 'connected';

  const statusConfig = {
    connected: { color: 'text-success', bg: 'bg-success', label: 'Connected' },
    connecting: { color: 'text-warning', bg: 'bg-warning', label: 'Connecting...' },
    disconnected: { color: 'text-text-secondary', bg: 'bg-text-secondary', label: 'Disconnected' },
    error: { color: 'text-error', bg: 'bg-error', label: 'Error' },
  };

  const qualityConfig = {
    good: { icon: SignalHigh, color: 'text-success', label: 'Excellent' },
    fair: { icon: SignalMedium, color: 'text-warning', label: 'Fair' },
    poor: { icon: SignalLow, color: 'text-error', label: 'Poor' },
    unknown: { icon: Signal, color: 'text-text-secondary', label: 'Unknown' },
  };

  const modeColors: Record<ChatMode, string> = {
    agent: 'text-purple-400',
    ask: 'text-blue-400',
    edit: 'text-amber-400',
    plan: 'text-green-400',
  };

  const { color: statusColor, bg: statusBg, label: statusLabel } = statusConfig[connectionStatus];
  const QualityIcon = qualityConfig[connectionQuality].icon;
  const showReconnect = reconnectAttempts >= 10 && connectionStatus !== 'connected';

  return (
    <div className="flex items-center h-6 bg-bg-secondary border-t border-border px-2 text-[11px] select-none">
      {/* Left section */}
      <div className="flex items-center gap-3 flex-1">
        {/* Connection Status with indicator dot */}
        <div className={`flex items-center gap-1.5 ${statusColor}`}>
          <span className={`w-2 h-2 rounded-full ${statusBg} ${connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
          {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span>{reconnectAttempts > 0 && connectionStatus === 'connecting' ? `Reconnecting (${reconnectAttempts})...` : statusLabel}</span>
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1 text-warning">
            <CloudOff size={11} />
            <span>Offline</span>
          </div>
        )}

        {/* Connection Quality */}
        {isConnected && connectionQuality !== 'unknown' && (
          <div className={`flex items-center gap-1 ${qualityConfig[connectionQuality].color}`} title={`Quality: ${qualityConfig[connectionQuality].label}`}>
            <QualityIcon size={11} />
            {latency !== undefined && <span>{latency}ms</span>}
          </div>
        )}

        {/* Manual Reconnect */}
        {showReconnect && (
          <button
            onClick={onManualReconnect}
            className="flex items-center gap-1 px-1.5 py-0.5 text-accent hover:bg-accent/10 transition-colors"
          >
            <RefreshCw size={10} />
            <span>Retry</span>
          </button>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-accent">
            <Activity size={11} className="animate-pulse" />
            <span className="max-w-[150px] truncate">{streamingStatus || 'Processing...'}</span>
          </div>
        )}
      </div>

      {/* Center section - contextual info */}
      <div className="flex items-center gap-3">
        {/* Pending changes indicator - clickable */}
        {pendingChangesCount > 0 && (
          <button
            onClick={onOpenPendingChanges}
            className="flex items-center gap-1 px-1.5 py-0.5 text-warning hover:bg-warning/10 transition-colors"
            title={`${pendingChangesCount} pending changes - click to review`}
          >
            <AlertCircle size={11} />
            <span>{pendingChangesCount} pending</span>
          </button>
        )}

        {/* Active branch - clickable */}
        {activeBranch && (
          <button
            onClick={onOpenBranchManager}
            className="flex items-center gap-1 px-1.5 py-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Manage conversation branches"
          >
            <GitBranch size={11} />
            <span className="max-w-[80px] truncate">{activeBranch}</span>
          </button>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Mode indicator */}
        {selectedMode && (
          <div className={`flex items-center gap-1 ${modeColors[selectedMode]}`} title={`Mode: ${selectedMode}`}>
            <CheckCircle2 size={11} />
            <span className="capitalize">{selectedMode}</span>
          </div>
        )}

        {/* Model indicator */}
        {isConnected && selectedModel && (
          <div className="flex items-center gap-1 text-text-secondary max-w-[120px]" title={`Model: ${selectedModel}`}>
            <Zap size={11} />
            <span className="truncate">{selectedModel}</span>
          </div>
        )}

        {/* Bandwidth mode */}
        {bandwidthMode && bandwidthMode !== 'high' && isConnected && (
          <div className={`flex items-center gap-1 ${bandwidthMode === 'low' ? 'text-warning' : 'text-text-secondary'}`} title={`Bandwidth: ${bandwidthMode}`}>
            <Activity size={11} />
            <span className="capitalize">{bandwidthMode}</span>
          </div>
        )}

        {/* Message count */}
        <div className="flex items-center gap-1 text-text-secondary" title="Messages in conversation">
          <MessageCircle size={11} />
          <span>{messageCount}</span>
        </div>

        {/* URL - shown when connected */}
        {isConnected && connectionUrl && (
          <div className="text-text-secondary max-w-[150px] truncate" title={connectionUrl}>
            {connectionUrl.replace(/^wss?:\/\//, '').split('/')[0]}
          </div>
        )}
      </div>
    </div>
  );
}
