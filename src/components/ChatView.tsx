import { Message, ModelInfo, ModeInfo, ChatMode } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onCancelMessage?: () => void;
  onNewChat: () => void;
  isConnected: boolean;
  isStreaming: boolean;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
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
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
      <MessageList messages={messages} onNewChat={onNewChat} />
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
      />
    </div>
  );
}
