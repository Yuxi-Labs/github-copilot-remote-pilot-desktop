import { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
  onNewChat: () => void;
}

export function MessageList({ messages, onNewChat }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-text-secondary">
        <MessageSquare size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm">Connect to the controller and start chatting with Copilot</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* New Chat button at top of messages */}
      <div className="sticky top-0 z-10 flex justify-end p-2 bg-bg-primary/80 backdrop-blur-sm border-b border-border">
        <button
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="New Chat"
        >
          <MessageSquarePlus size={14} />
          <span>New Chat</span>
        </button>
      </div>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
