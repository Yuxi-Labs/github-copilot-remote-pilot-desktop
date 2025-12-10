import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { Send, StopCircle, ChevronDown, FileCode, Mic, MicOff, Loader2, FolderOpen, Paperclip, X } from 'lucide-react';
import { type ModelInfo, type ModeInfo, type ChatMode, type ContextFile } from '../types';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useContextMenu, ContextMenuItem } from './ContextMenu';

interface ContextItem {
  type: 'file' | 'selection' | 'terminal' | 'workspace';
  name: string;
  preview?: string;
}

interface MessageInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  isConnected?: boolean;
  streamingStatus?: string;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  includeContext?: boolean;
  onIncludeContextChange?: (include: boolean) => void;
  onOpenTerminal?: () => void;
  activeContext?: ContextItem[];
  contextFiles?: ContextFile[];
  onToggleContextFile?: (id: string) => void;
  onRemoveContextFile?: (id: string) => void;
  onAttachManual?: () => void;
}

export function MessageInput({
  onSend,
  onCancel,
  disabled,
  isStreaming,
  isConnected,
  streamingStatus,
  models,
  selectedModel,
  onModelChange,
  modes,
  selectedMode,
  onModeChange,
  contextFiles = [],
  onToggleContextFile,
  onRemoveContextFile,
  onAttachManual,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const { showContextMenu } = useContextMenu();

  // Context menu for textarea
  const handleTextareaContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const textarea = textareaRef.current;
    const hasSelection = textarea && textarea.selectionStart !== textarea.selectionEnd;
    const hasText = message.length > 0;
    
    const items: ContextMenuItem[] = [
      {
        label: 'Cut',
        shortcut: 'Ctrl+X',
        action: () => document.execCommand('cut'),
        disabled: !hasSelection,
      },
      {
        label: 'Copy',
        shortcut: 'Ctrl+C',
        action: () => document.execCommand('copy'),
        disabled: !hasSelection,
      },
      {
        label: 'Paste',
        shortcut: 'Ctrl+V',
        action: () => document.execCommand('paste'),
      },
      { divider: true },
      {
        label: 'Select All',
        shortcut: 'Ctrl+A',
        action: () => {
          if (textarea) {
            textarea.select();
          }
        },
        disabled: !hasText,
      },
      { divider: true },
      {
        label: 'Clear',
        action: () => setMessage(''),
        disabled: !hasText,
      },
    ];
    
    showContextMenu(e, items);
  }, [message, showContextMenu]);

  // Voice input
  const {
    isSupported: isVoiceSupported,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error: voiceError,
  } = useVoiceInput({
    onResult: (transcript) => {
      setMessage(transcript);
    },
  });

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

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
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (showMentions) {
        setShowMentions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentions]);

  // Handle @ mentions
  useEffect(() => {
    const lastChar = message.slice(-1);
    if (lastChar === '@') {
      setShowMentions(true);
    } else if (showMentions && (lastChar === ' ' || message === '')) {
      setShowMentions(false);
    }
  }, [message, showMentions]);

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
    if (e.key === 'Escape' && showMentions) {
      setShowMentions(false);
    }
  };

  const insertMention = (type: string) => {
    setMessage(prev => prev.replace(/@$/, `@${type} `));
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const currentMode = modes.find(m => m.id === selectedMode);
  const currentModel = models.find(m => m.id === selectedModel);

  // Mode colors for visual distinction
  const modeColors: Record<ChatMode, string> = {
    agent: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ask: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    edit: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    plan: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <div className="bg-bg-secondary">
      {/* Context Bar - expandable container for files */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-1">
        <span className="text-sm text-text-secondary">Context:</span>
        <button
          onClick={onAttachManual}
          className="text-text-secondary hover:text-accent transition-colors"
          title="Attach file"
        >
          <Paperclip size={14} />
        </button>
        
        {contextFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {contextFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-bg-tertiary border border-border"
              >
                <FileCode size={11} className={file.enabled ? 'text-accent' : 'text-text-secondary'} />
                <span className={`max-w-[100px] truncate ${file.enabled ? 'text-text-primary' : 'text-text-secondary'}`} title={file.path}>
                  {file.name}
                </span>
                
                {/* Toggle Switch - matches icon size */}
                <button
                  onClick={() => onToggleContextFile?.(file.id)}
                  className={`relative inline-flex h-2.5 w-5 items-center rounded-full transition-all ${
                    file.enabled ? 'bg-green-500/40' : 'bg-text-secondary/30'
                  }`}
                  title={file.enabled ? 'Enabled' : 'Disabled'}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-all shadow-sm ${
                      file.enabled ? 'ml-auto bg-green-300' : 'mr-auto bg-text-secondary'
                    }`}
                  />
                </button>
                
                <button
                  onClick={() => onRemoveContextFile?.(file.id)}
                  className="p-0.5 hover:bg-error/20 hover:text-error rounded transition-colors"
                  title="Remove"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Streaming Status */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-accent/5 to-transparent">
          <Loader2 size={14} className="animate-spin text-accent" />
          <span className="text-xs text-text-secondary animate-pulse">
            {streamingStatus || 'Thinking...'}
          </span>
        </div>
      )}

      {/* Main Input Area */}
      <div className="p-3">
        <div className="relative">
          {/* Input container with controls */}
          <div className="relative bg-bg-tertiary border border-border focus-within:border-accent focus-within:shadow-[0_0_0_1px_var(--color-accent)] transition-all">
            <textarea
              ref={textareaRef}
              value={isListening && interimTranscript ? interimTranscript : message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled 
                  ? 'Connect to start chatting...' 
                  : isListening 
                    ? 'Listening...' 
                    : 'Ask Copilot anything... (@ to add context)'
              }
              disabled={disabled || isStreaming || isListening}
              rows={1}
              className={`w-full px-3 py-3 pr-28 text-sm text-text-primary bg-transparent resize-none outline-none placeholder:text-text-secondary/50 ${
                isListening ? 'bg-accent/5' : ''
              }`}
            />

            {/* Inline action buttons - contextually placed next to input */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              {/* Voice input */}
              {isVoiceSupported && (
                <button
                  onClick={handleVoiceToggle}
                  disabled={disabled || isStreaming}
                  className={`p-1.5 transition-colors ${
                    isListening 
                      ? 'text-accent bg-accent/20 animate-pulse' 
                      : 'text-text-secondary hover:text-accent hover:bg-accent/10'
                  }`}
                  title={isListening ? 'Stop recording' : 'Voice input'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-4 bg-border mx-1" />

              {/* Send/Stop button */}
              {isStreaming ? (
                <button
                  onClick={onCancel}
                  className="p-1.5 text-error hover:bg-error/10 transition-colors"
                  title="Stop generating"
                >
                  <StopCircle size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || disabled}
                  className="p-1.5 text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:text-text-secondary disabled:hover:bg-transparent"
                  title="Send message (Enter)"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          </div>

          {/* @ Mentions popup */}
          {showMentions && (
            <div className="absolute bottom-full left-0 mb-1 w-72 bg-bg-secondary border border-border shadow-xl z-50">
              <div className="px-3 py-2 text-[10px] text-text-secondary uppercase tracking-wider border-b border-border">
                Add context
              </div>
              <button 
                onClick={() => insertMention('file')} 
                className="w-full px-3 py-2.5 text-left hover:bg-bg-hover flex items-center gap-3 transition-colors"
              >
                <FileCode size={16} className="text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">@file</div>
                  <div className="text-xs text-text-secondary">Reference a specific file</div>
                </div>
              </button>
              <button 
                onClick={() => insertMention('workspace')} 
                className="w-full px-3 py-2.5 text-left hover:bg-bg-hover flex items-center gap-3 transition-colors"
              >
                <FolderOpen size={16} className="text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">@workspace</div>
                  <div className="text-xs text-text-secondary">Include workspace context</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Bottom bar: Mode + Model chips - compact, contextual */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-2">
            {/* Mode Chip - Click to cycle */}
            <button
              onClick={() => {
                const currentIndex = modes.findIndex(m => m.id === selectedMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                onModeChange(modes[nextIndex].id);
              }}
              className={`px-2.5 py-1 text-xs font-medium border transition-all hover:opacity-80 ${modeColors[selectedMode]}`}
              title={`${currentMode?.description || ''} - Click to change mode`}
            >
              {currentMode?.name || 'Agent'}
            </button>

            {/* Model Chip */}
            <div className="relative" ref={modelDropdownRef}>
              <button
                onClick={() => isConnected && models.length > 0 && setModelDropdownOpen(!modelDropdownOpen)}
                disabled={!isConnected || models.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-tertiary border border-border hover:border-border-hover transition-all disabled:opacity-50 disabled:cursor-default"
                title={!isConnected ? 'Connect to select model' : currentModel?.name || 'Select model'}
              >
                <span className="max-w-[100px] truncate">
                  {isConnected ? (currentModel?.name || 'Select Model') : 'Not connected'}
                </span>
                {isConnected && models.length > 0 && (
                  <ChevronDown size={10} className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {modelDropdownOpen && models.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 min-w-[200px] max-h-[250px] overflow-y-auto bg-bg-secondary border border-border shadow-xl z-50">
                  {models.map((model) => (
                    <button
                      key={`${model.vendor || 'default'}-${model.id}`}
                      className={`w-full px-3 py-2 text-left hover:bg-bg-hover transition-colors ${
                        model.id === selectedModel ? 'bg-bg-tertiary' : ''
                      }`}
                      onClick={() => {
                        onModelChange(model.id);
                        setModelDropdownOpen(false);
                      }}
                    >
                      <div className="text-xs font-medium text-text-primary">{model.name}</div>
                      {model.vendor && <div className="text-[10px] text-text-secondary">{model.vendor}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center gap-3 text-[10px] text-text-secondary">
            <span>
              <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border font-mono">Enter</kbd> send
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-bg-tertiary border border-border font-mono">Shift+Enter</kbd> newline
            </span>
          </div>
        </div>
      </div>

      {/* Voice error */}
      {voiceError && (
        <div className="px-4 py-2 text-xs text-error bg-error/10 border-t border-error/20">
          {voiceError}
        </div>
      )}
    </div>
  );
}
