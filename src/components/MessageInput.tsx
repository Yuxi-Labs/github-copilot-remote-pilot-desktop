import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, StopCircle } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function MessageInput({ onSend, onCancel, disabled, isStreaming }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-bg-secondary p-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Connect to start chatting...' : 'Type a message... (Enter to send, Shift+Enter for new line)'}
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full px-4 py-3 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute right-3 bottom-2 text-xs text-text-secondary">
            {message.length > 0 && `${message.length} chars`}
          </div>
        </div>

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-10 h-10 bg-error rounded-lg text-white hover:bg-error/90 transition-colors"
            title="Stop generating"
          >
            <StopCircle size={20} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="flex items-center justify-center w-10 h-10 bg-accent rounded-lg text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
