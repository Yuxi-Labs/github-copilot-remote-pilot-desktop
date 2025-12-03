import { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { MessageSquare } from 'lucide-react';

interface MessageListProps {
  messages: MessageType[];
}

export function MessageList({ messages }: MessageListProps) {
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
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
