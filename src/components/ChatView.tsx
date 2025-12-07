import { Message, ModelInfo, ModeInfo, ChatMode } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface AttachedFile {
  name: string;
  content: string;
}

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string, attachedFile?: AttachedFile) => void;
  onCancelMessage?: () => void;
  onNewChat: () => void;
  onRetry?: (messageId: string, content: string) => void;
  onRegenerate?: (messageId: string) => void;
  isConnected: boolean;
  isStreaming: boolean;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  includeContext: boolean;
  onIncludeContextChange: (include: boolean) => void;
  onOpenFileBrowser?: () => void;
  onOpenTerminal?: () => void;
  attachedFile?: AttachedFile | null;
  onAttachFile?: (file: AttachedFile) => void;
  onRemoveAttachedFile?: () => void;
}

export function ChatView({
  messages,
  onSendMessage,
  onCancelMessage,
  onNewChat,
  isConnected,
  isStreaming,
  models,
  selectedModel,
  onModelChange,
  modes,
  selectedMode,
  onModeChange,
  includeContext,
  onIncludeContextChange,
  onOpenFileBrowser,
  onOpenTerminal,
  attachedFile,
  onAttachFile,
  onRemoveAttachedFile,
  onRetry,
  onRegenerate,
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
      <MessageList 
        messages={messages} 
        onNewChat={onNewChat} 
        onRetry={onRetry}
        onRegenerate={onRegenerate}
      />
      <MessageInput
        onSend={onSendMessage}
        onCancel={onCancelMessage}
        disabled={!isConnected}
        isStreaming={isStreaming}
        isConnected={isConnected}
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        modes={modes}
        selectedMode={selectedMode}
        onModeChange={onModeChange}
        includeContext={includeContext}
        onIncludeContextChange={onIncludeContextChange}
        onOpenFileBrowser={onOpenFileBrowser}
        onOpenTerminal={onOpenTerminal}
        attachedFile={attachedFile}
        onAttachFile={onAttachFile}
        onRemoveAttachedFile={onRemoveAttachedFile}
      />
    </div>
  );
}
