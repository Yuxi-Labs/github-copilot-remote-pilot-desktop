import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { Send, StopCircle, ChevronDown, FileCode, FolderOpen, X, Mic, MicOff, Terminal, Upload } from 'lucide-react';
import { type ModelInfo, type ModeInfo, type ChatMode } from '../types';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface AttachedFile {
  name: string;
  content: string;
}

interface MessageInputProps {
  onSend: (message: string, attachedFile?: AttachedFile) => void;
  onCancel?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  isConnected?: boolean;
  models: ModelInfo[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  modes: ModeInfo[];
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  includeContext?: boolean;
  onIncludeContextChange?: (include: boolean) => void;
  onOpenFileBrowser?: () => void;
  onOpenTerminal?: () => void;
  attachedFile?: AttachedFile | null;
  onAttachFile?: (file: AttachedFile) => void;
  onRemoveAttachedFile?: () => void;
}

export function MessageInput({
  onSend,
  onCancel,
  disabled,
  isStreaming,
  isConnected,
  models,
  selectedModel,
  onModelChange,
  modes,
  selectedMode,
  onModeChange,
  includeContext = true,
  onIncludeContextChange,
  onOpenFileBrowser,
  onOpenTerminal,
  attachedFile,
  onAttachFile,
  onRemoveAttachedFile,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local file upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAttachFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      onAttachFile({ name: file.name, content });
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

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
      onSend(trimmed, attachedFile || undefined);
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
    <div className="chat-input-container p-4">
      {/* Mode and Model selectors row */}
      <div className="flex items-center gap-2 mb-3">
        {/* Mode Selector */}
        <div className="relative" ref={modeDropdownRef}>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-all"
            onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
            title="Select chat mode (Agent, Ask, Edit, or Plan)"
          >
            <span>{currentMode?.name || 'Ask'}</span>
            <ChevronDown size={12} className={`transition-transform ${modeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {modeDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[160px] dropdown-menu z-50">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  className={`dropdown-item flex flex-col w-full text-left ${
                    mode.id === selectedMode ? 'bg-bg-tertiary' : ''
                  }`}
                  onClick={() => {
                    onModeChange(mode.id);
                    setModeDropdownOpen(false);
                  }}
                >
                  <span className="text-xs font-medium text-text-primary">{mode.name}</span>
                  <span className="text-[10px] text-text-secondary">{mode.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model Selector */}
        <div className="relative" ref={modelDropdownRef}>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-primary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-all"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            title={
              !isConnected
                ? 'Connect to load and select from available models'
                : models.length > 0
                  ? 'Select from available AI models'
                  : 'Loading available models...'
            }
          >
            <span>
              {!isConnected
                ? 'Select Model'
                : currentModel?.name || selectedModel || 'Select Model'}
            </span>
            <ChevronDown size={12} className={`transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {modelDropdownOpen && models.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 min-w-[200px] max-h-[250px] overflow-y-auto dropdown-menu z-50">
              {models.map((model) => (
                <button
                  key={`${model.vendor || 'default'}-${model.id}`}
                  className={`dropdown-item flex flex-col w-full text-left ${
                    model.id === selectedModel ? 'bg-bg-tertiary' : ''
                  }`}
                  onClick={() => {
                    onModelChange(model.id);
                    setModelDropdownOpen(false);
                  }}
                >
                  <span className="text-xs font-medium text-text-primary">{model.name}</span>
                  {model.vendor && (
                    <span className="text-[10px] text-text-secondary">{model.vendor}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Context Toggle */}
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all ${
            includeContext
              ? 'text-accent bg-accent/10 border-accent hover:bg-accent/20'
              : 'text-text-secondary bg-bg-tertiary border-border hover:bg-bg-hover hover:border-border-hover'
          }`}
          onClick={() => onIncludeContextChange?.(!includeContext)}
          title={includeContext 
            ? 'Context ON: Including currently open file from VS Code' 
            : 'Context OFF: Click to include currently open file from VS Code'}
        >
          <FileCode size={12} />
          <span>{includeContext ? 'Context' : 'No Context'}</span>
        </button>

        {/* File Browser Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-all disabled:opacity-50"
          onClick={onOpenFileBrowser}
          disabled={!isConnected}
          title={isConnected ? 'Browse workspace files' : 'Connect to browse workspace files'}
        >
          <FolderOpen size={12} />
          <span>Files</span>
        </button>

        {/* Terminal Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-all disabled:opacity-50"
          onClick={onOpenTerminal}
          disabled={!isConnected}
          title={isConnected ? 'Open terminal' : 'Connect to open terminal'}
        >
          <Terminal size={12} />
          <span>Terminal</span>
        </button>

        {/* Upload File Button */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary border border-border hover:bg-bg-hover hover:border-border-hover transition-all disabled:opacity-50"
          onClick={() => fileInputRef.current?.click()}
          disabled={!!attachedFile}
          title={attachedFile ? 'Remove current file first' : 'Upload a file from your device'}
        >
          <Upload size={12} />
          <span>Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept=".txt,.md,.js,.ts,.tsx,.jsx,.json,.css,.html,.py,.java,.c,.cpp,.h,.hpp,.rs,.go,.rb,.php,.sql,.yaml,.yml,.xml,.csv,.log,.sh,.bash,.ps1,.bat,.cmd"
        />
      </div>

      {/* Attached File Preview */}
      {attachedFile && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-bg-tertiary border border-border text-xs">
          <FileCode size={14} className="text-accent flex-shrink-0" />
          <span className="text-text-primary truncate flex-1 font-medium" title={attachedFile.name}>
            {attachedFile.name}
          </span>
          <span className="text-text-secondary flex-shrink-0">
            {attachedFile.content.length > 1000 
              ? `${Math.round(attachedFile.content.length / 1024)}KB`
              : `${attachedFile.content.length} chars`}
          </span>
          <button
            onClick={onRemoveAttachedFile}
            className="p-1 hover:bg-bg-hover transition-colors"
            title="Remove attached file"
          >
            <X size={14} className="text-text-secondary hover:text-text-primary" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={isListening && interimTranscript ? interimTranscript : message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Connect to start chatting...' : isListening ? 'Listening...' : 'Ask Copilot anything...'}
            disabled={disabled || isStreaming || isListening}
            rows={1}
            className={`chat-input-textarea w-full px-4 py-3 text-sm text-text-primary resize-none ${
              isListening 
                ? 'border-accent bg-accent/5 animate-pulse' 
                : ''
            }`}
          />
          {voiceError && (
            <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-error bg-error/10 border border-error">
              {voiceError}
            </div>
          )}
        </div>

        {/* Voice Input Button */}
        <button
          onClick={handleVoiceToggle}
          disabled={disabled || isStreaming || !isVoiceSupported}
          className={`action-button flex items-center justify-center w-10 min-h-[2.75rem] ${
            isListening
              ? 'action-button-primary animate-pulse'
              : ''
          } ${!isVoiceSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={!isVoiceSupported ? 'Voice input not available (Tauri only)' : isListening ? 'Stop recording' : 'Start voice input'}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        {isStreaming ? (
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-10 min-h-[2.75rem] bg-error text-white hover:bg-error/90 transition-all"
            title="Stop generating"
          >
            <StopCircle size={18} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="action-button-primary flex items-center justify-center w-10 min-h-[2.75rem]"
            title="Send message (Ctrl+Enter)"
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
