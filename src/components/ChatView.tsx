import { Message } from '../types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onCancelMessage?: () => void;
  isConnected: boolean;
  isStreaming: boolean;
}

export function ChatView({
  messages,
  onSendMessage,
  onCancelMessage,
  isConnected,
  isStreaming,
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
      <MessageList messages={messages} />
      <MessageInput
        onSend={onSendMessage}
        onCancel={onCancelMessage}
        disabled={!isConnected}
        isStreaming={isStreaming}
      />
    </div>
  );
}
