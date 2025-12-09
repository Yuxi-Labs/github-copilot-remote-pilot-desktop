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
      
      // Ctrl/Cmd + S to apply changes
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges && !saving) {
          handleApplyChanges();
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

  const handleApplyChanges = useCallback(() => {
    if (!hasChanges || saving) return;

    setSaving(true);
    setError(null);

    // Send changes to Copilot to implement
    const changeDescription = `Update the file ${fileName} with these changes:

Original content:
${originalContent}

New content:
${content}

Please analyze the differences and apply the appropriate code changes.`;

    const requestId = wsClient.sendMessage({
      type: 'chat',
      id: `apply-changes-${Date.now()}`,
      payload: {
        message: changeDescription,
        mode: 'agent',
        attachedFiles: [{
          name: fileName,
          path: filePath,
          content: originalContent
        }]
      }
    });

    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        if (msg.type === 'chatChunk' || msg.type === 'chatComplete') {
          // Copilot processed the changes
          if (msg.type === 'chatComplete') {
            wsClient.removeMessageHandler(handleMessage);
            setSaving(false);
            setSaved(true);
            onSaved?.();
          }
        } else if (msg.type === 'error') {
          wsClient.removeMessageHandler(handleMessage);
          setSaving(false);
          setError(msg.payload.message || 'Failed to apply changes via Copilot');
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
          {hasChanges && (
            <span className="text-xs text-warning px-1.5 py-0.5 bg-warning/10 rounded">
              Modified
            </span>
          )}
          {saved && !hasChanges && (
            <span className="text-xs text-success px-1.5 py-0.5 bg-success/10 rounded">
              Saved
            </span>
          )}
        </div>

        {error && (
          <span className="text-xs text-error">{error}</span>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInVSCode}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            title="Open in VS Code"
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={handleRevert}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Revert changes"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Apply changes via Copilot (Ctrl+S)"
          >
            <Save size={14} />
            <span>{saving ? 'Applying...' : 'Apply Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
