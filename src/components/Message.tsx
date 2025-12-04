import { User, Bot } from 'lucide-react';
import { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-bg-secondary' : 'bg-bg-primary'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center ${
          isUser ? 'bg-accent' : 'bg-purple-600'
        }`}
      >
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-text-primary">
            {isUser ? 'You' : 'Copilot'}
          </span>
          <span className="text-xs text-text-secondary">{time}</span>
          {message.isStreaming && (
            <span className="text-xs text-accent animate-pulse">typing...</span>
          )}
        </div>

        <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
          {message.content || (message.isStreaming && (
            <span className="text-text-secondary italic">Thinking...</span>
          ))}
        </div>
      </div>
    </div>
  );
}
