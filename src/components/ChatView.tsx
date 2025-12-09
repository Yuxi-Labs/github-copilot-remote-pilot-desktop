import { type Message, type ModelInfo, type ModeInfo, type ChatMode, type ContextFile } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

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
}: ChatViewProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-primary">
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
