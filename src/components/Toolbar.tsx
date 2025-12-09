import { Plug, Unplug, PlugZap, Terminal, GitBranch, FileCheck, Settings, PanelLeftClose, PanelLeft, RefreshCw, Trash2 } from 'lucide-react';
import { ConnectionStatus } from '../types';

interface ToolbarProps {
  connectionStatus: ConnectionStatus;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenTerminal?: () => void;
  onOpenBranchManager?: () => void;
  onOpenPendingChanges?: () => void;
  onOpenSettings?: () => void;
  onNewChat?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  pendingChangesCount?: number;
  hasMessages?: boolean;
}

export function Toolbar({
  connectionStatus,
  onConnect,
  onDisconnect,
  onOpenTerminal,
  onOpenBranchManager,
  onOpenPendingChanges,
  onOpenSettings,
  onNewChat,
  onToggleSidebar,
  sidebarOpen = false,
  pendingChangesCount = 0,
  hasMessages = false,
}: ToolbarProps) {
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  // Reusable button component styles
  const btnBase = "flex items-center justify-center w-8 h-8 transition-all";
  const btnEnabled = "text-text-secondary hover:text-text-primary hover:bg-bg-hover";
  const btnDisabled = "text-text-secondary opacity-40 cursor-not-allowed";

  return (
    <div className="flex items-center h-10 bg-bg-secondary border-b border-border px-2 gap-0.5">
      {/* Left group: Connection */}
      <div className="flex items-center gap-0.5">
        {/* Toggle sidebar */}
        {onToggleSidebar && (
          <button
            className={`${btnBase} ${btnEnabled}`}
            onClick={onToggleSidebar}
            title={sidebarOpen ? 'Hide favorites' : 'Show favorites'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        )}

        <div className="w-px h-5 bg-border mx-1" />

        {/* Connect/Disconnect */}
        {isConnected ? (
          <button
            className={`${btnBase} text-success hover:text-error hover:bg-error/10 group`}
            onClick={onDisconnect}
            title="Disconnect"
          >
            <PlugZap size={18} className="group-hover:hidden" />
            <Unplug size={18} className="hidden group-hover:block" />
          </button>
        ) : (
          <button
            className={`${btnBase} ${isConnecting ? 'text-warning animate-pulse' : btnEnabled}`}
            onClick={onConnect}
            disabled={isConnecting}
            title={isConnecting ? 'Connecting...' : 'Connect to VS Code'}
          >
            {isConnecting ? <RefreshCw size={18} className="animate-spin" /> : <Plug size={18} />}
          </button>
        )}
      </div>

      <div className="w-px h-5 bg-border mx-2" />

      {/* Center group: Workspace actions */}
      <div className="flex items-center gap-0.5">
        {/* Terminal */}
        <button
          className={`${btnBase} ${isConnected ? btnEnabled : btnDisabled}`}
          onClick={onOpenTerminal}
          disabled={!isConnected}
          title={isConnected ? 'Open terminal' : 'Connect to use terminal'}
        >
          <Terminal size={18} />
        </button>

        {/* Branch Manager */}
        <button
          className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
          onClick={onOpenBranchManager}
          disabled={!hasMessages}
          title={hasMessages ? 'Manage conversation branches' : 'Start a conversation to use branches'}
        >
          <GitBranch size={18} />
        </button>

        {/* Pending Changes - with badge */}
        <button
          className={`${btnBase} relative ${pendingChangesCount > 0 ? 'text-warning hover:text-warning hover:bg-warning/10' : isConnected ? btnEnabled : btnDisabled}`}
          onClick={onOpenPendingChanges}
          disabled={!isConnected && pendingChangesCount === 0}
          title={pendingChangesCount > 0 ? `${pendingChangesCount} pending changes` : 'No pending changes'}
        >
          <FileCheck size={18} />
          {pendingChangesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-warning text-bg-primary text-[9px] font-bold flex items-center justify-center">
              {pendingChangesCount > 9 ? '9+' : pendingChangesCount}
            </span>
          )}
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right group: Chat & Settings */}
      <div className="flex items-center gap-0.5">
        {/* New Chat */}
        <button
          className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
          onClick={onNewChat}
          disabled={!hasMessages}
          title="Start new chat"
        >
          <Trash2 size={16} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Settings */}
        <button
          className={`${btnBase} ${btnEnabled}`}
          onClick={onOpenSettings}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
