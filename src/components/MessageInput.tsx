import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, StopCircle, ChevronDown } from 'lucide-react';
import { ModelInfo, ModeInfo, ChatMode } from '../types';

interface MessageInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

export function MessageInput({
  onSend,
  onCancel,
  disabled,
  isStreaming,
  models,
  selectedModel,
  onModelChange,
  modes,
  selectedMode,
  onModeChange,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setModeDropdownOpen(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const currentMode = modes.find(m => m.id === selectedMode);
  const currentModel = models.find(m => m.id === selectedModel);

  return (
    <div className="border-t border-border bg-bg-secondary p-3">
      {/* Mode and Model selectors row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Mode Selector */}
        <div className="relative" ref={modeDropdownRef}>
          <button
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-primary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-colors"
            onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
            disabled={disabled}
          >
            <span>{currentMode?.name || 'Ask'}</span>
            <ChevronDown size={12} className={`transition-transform ${modeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {modeDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[140px] bg-bg-primary border border-border shadow-lg z-50">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  className={`flex flex-col w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors ${
                    mode.id === selectedMode ? 'bg-bg-tertiary' : ''
                  }`}
                  onClick={() => {
                    onModeChange(mode.id);
                    setModeDropdownOpen(false);
                  }}
                >
                  <span className="text-xs text-text-primary">{mode.name}</span>
                  <span className="text-[10px] text-text-secondary">{mode.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-primary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-colors"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            disabled={models.length === 0}
          >
            <span>{currentModel?.name || selectedModel || 'Select Model'}</span>
            <ChevronDown size={12} className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {modelDropdownOpen && models.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[180px] max-h-[250px] overflow-y-auto bg-bg-primary border border-border shadow-lg z-50">
              {models.map((model) => (
                <button
                  key={model.id}
                  className={`flex flex-col w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors ${
                    model.id === selectedModel ? 'bg-bg-tertiary' : ''
                  }`}
                  onClick={() => {
                    onModelChange(model.id);
                    setModelDropdownOpen(false);
                  }}
                >
                  <span className="text-xs text-text-primary">{model.name}</span>
                  {model.vendor && (
                    <span className="text-[10px] text-text-secondary">{model.vendor}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Connect to start chatting...' : 'Ask Copilot or type / for commands'}
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-8 h-8 bg-error text-white hover:bg-error/90 transition-colors"
            title="Stop generating"
          >
            <StopCircle size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="flex items-center justify-center w-8 h-8 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
