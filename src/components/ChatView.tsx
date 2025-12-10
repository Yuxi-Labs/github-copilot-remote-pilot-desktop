import { type Message, type ModelInfo, type ModeInfo, type ChatMode, type ContextFile } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Plus, History, FileText, RotateCcw, Download } from 'lucide-react';

interface ContextItem {
  type: 'file' | 'selection' | 'terminal' | 'workspace';
  name: string;
  preview?: string;
}

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onCancelMessage?: () => void;
  onNewChat: () => void;
  onExportChat?: () => void;
  onClearChat?: () => void;
  onOpenBranchManager?: () => void;
  onBranch?: (messageIndex: number) => void;
  onRetry?: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
  isConnected: boolean;
  isStreaming: boolean;
  streamingStatus?: string;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  includeContext: boolean;
  onIncludeContextChange: (include: boolean) => void;
  onOpenTerminal?: () => void;
  activeContext?: ContextItem[];
  contextFiles: ContextFile[];
  onToggleContextFile: (id: string) => void;
  onRemoveContextFile: (id: string) => void;
  onAttachManual: () => void;
}

export function ChatView({
  messages,
  onSendMessage,
  onCancelMessage,
  onNewChat,
  onBranch,
  isConnected,
  isStreaming,
  streamingStatus,
  models,
  selectedModel,
  onModelChange,
  modes,
  selectedMode,
  onModeChange,
  onRetry,
  onRegenerate,
  activeContext,
  contextFiles,
  onToggleContextFile,
  onRemoveContextFile,
  onAttachManual,
  onExportChat,
  onClearChat,
  onOpenBranchManager,
}: ChatViewProps) {
  const btnBase = "p-1.5 rounded transition-colors";
  const btnEnabled = "hover:bg-bg-hover text-text-primary";
  const btnDisabled = "text-text-disabled";
  const hasMessages = messages.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-secondary">
      {/* Header Toolbar */}
      <div className="px-3 border-b border-border flex items-center" style={{ height: '32px' }}>
        <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide flex-1">
          Chat
        </h3>
        <div className="flex items-center gap-0.5">
          {/* New Chat */}
          <button
            className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
            onClick={onNewChat}
            disabled={!hasMessages}
            title="Start new chat"
          >
            <Plus size={16} />
          </button>

          {/* Branch Manager */}
          <button
            className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
            onClick={onOpenBranchManager}
            disabled={!hasMessages}
            title="Manage conversation branches"
          >
            <History size={16} />
          </button>

          {/* Export Chat */}
          <button
            className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
            onClick={onExportChat}
            disabled={!hasMessages}
            title="Export chat"
          >
            <Download size={16} />
          </button>

          {/* Clear Chat */}
          <button
            className={`${btnBase} ${hasMessages ? btnEnabled : btnDisabled}`}
            onClick={onClearChat}
            disabled={!hasMessages}
            title="Clear chat"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <MessageList 
        messages={messages} 
        onNewChat={onNewChat} 
        onBranch={onBranch}
        onRetry={onRetry}
        onRegenerate={onRegenerate}
      />
      
      <MessageInput
        onSend={onSendMessage}
        onCancel={onCancelMessage}
        disabled={!isConnected}
        isStreaming={isStreaming}
        streamingStatus={streamingStatus}
        isConnected={isConnected}
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        modes={modes}
        selectedMode={selectedMode}
        onModeChange={onModeChange}
        contextFiles={contextFiles}
        onToggleContextFile={onToggleContextFile}
        onRemoveContextFile={onRemoveContextFile}
        onAttachManual={onAttachManual}
      />
    </div>
  );
}
