import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Save, RotateCcw, ExternalLink, FileCode } from 'lucide-react';
import { wsClient } from '../services/websocket';
import { ControllerMessage } from '../types';

interface FileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  initialContent: string;
  language?: string;
  onSaved?: () => void;
}

export function FileEditor({
  isOpen,
  onClose,
  filePath,
  initialContent,
  language = 'plaintext',
  onSaved,
}: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [originalContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasChanges = content !== originalContent;
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;

  // Reset state when file changes
  useEffect(() => {
    setContent(initialContent);
    setError(null);
    setSaved(false);
  }, [initialContent, filePath]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleSave();
        }
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges, saving]);

  const handleSave = useCallback(() => {
    if (!hasChanges || saving) return;

    setSaving(true);
    setError(null);

    const requestId = wsClient.writeFile(filePath, content);

    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        wsClient.removeMessageHandler(handleMessage);
        setSaving(false);

        if (msg.type === 'writeResult' && msg.payload.success) {
          setSaved(true);
          onSaved?.();
          // Auto-close after successful save (optional)
          // setTimeout(onClose, 500);
        } else if (msg.type === 'error') {
          setError(msg.payload.message || 'Failed to save file');
        } else if (msg.type === 'writeResult' && !msg.payload.success) {
          setError(msg.payload.error || 'Failed to save file');
        }
      }
    };

    wsClient.addMessageHandler(handleMessage);

    // Timeout after 10 seconds
    setTimeout(() => {
      wsClient.removeMessageHandler(handleMessage);
      if (saving) {
        setSaving(false);
        setError('Save timed out');
      }
    }, 10000);
  }, [filePath, content, hasChanges, saving, onSaved]);

  const handleRevert = useCallback(() => {
    setContent(originalContent);
    setError(null);
    setSaved(false);
  }, [originalContent]);

  const handleOpenInVSCode = useCallback(() => {
    wsClient.openFile(filePath);
  }, [filePath]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  // Handle Tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        // Insert 2 spaces for indentation
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setContent(newValue);
        
        // Move cursor after the inserted spaces
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border w-[90vw] h-[85vh] max-w-[1200px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-3">
            <FileCode size={16} className="text-accent" />
            <div>
              <span className="text-sm font-medium text-text-primary">{fileName}</span>
              <span className="text-xs text-text-secondary ml-2">{filePath}</span>
            </div>
            {hasChanges && (
              <span className="text-xs text-warning px-1.5 py-0.5 bg-warning/10">
                Modified
              </span>
            )}
            {saved && !hasChanges && (
              <span className="text-xs text-success px-1.5 py-0.5 bg-success/10">
                Saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInVSCode}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
              title="Open in VS Code"
            >
              <ExternalLink size={14} />
              <span>Open in VS Code</span>
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="Close"
            >
              <X size={18} className="text-text-secondary hover:text-text-primary" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSaved(false);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 bg-bg-primary text-text-primary font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
            placeholder="File content..."
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-bg-secondary">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">
              {language}
            </span>
            <span className="text-xs text-text-secondary">
              • {content.split('\n').length} lines
            </span>
            <span className="text-xs text-text-secondary">
              • {content.length} chars
            </span>
          </div>

          {error && (
            <span className="text-xs text-error">{error}</span>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleRevert}
              disabled={!hasChanges || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Revert changes"
            >
              <RotateCcw size={14} />
              <span>Revert</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Save changes (Ctrl+S)"
            >
              <Save size={14} />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
