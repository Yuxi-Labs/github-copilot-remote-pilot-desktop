import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../services/websocket';
import { ControllerMessage } from '../types';
import { useContextMenu, ContextMenuItem } from './ContextMenu';

interface FileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  initialContent: string;
  language?: string;
  onSaved?: () => void;
  onEditorInfoChange?: (info: { fileName: string; language: string; lineCount: number; charCount: number; hasChanges: boolean }) => void;
}

export function FileEditor({
  isOpen,
  onClose,
  filePath,
  initialContent,
  language = 'plaintext',
  onSaved,
  onEditorInfoChange,
}: FileEditorProps) {
  const { showContextMenu } = useContextMenu();
  const [content, setContent] = useState(initialContent);
  const [originalContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const hasChanges = content !== originalContent;
  const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
  const lineCount = content.split('\n').length;
  const charCount = content.length;

  // Reset state when file changes
  useEffect(() => {
    setContent(initialContent);
    setError(null);
    setSaved(false);
  }, [initialContent, filePath]);

  // Send editor info to status bar
  useEffect(() => {
    if (isOpen && onEditorInfoChange) {
      onEditorInfoChange({
        fileName,
        language,
        lineCount,
        charCount,
        hasChanges,
      });
    }
  }, [isOpen, fileName, language, lineCount, charCount, hasChanges, onEditorInfoChange]);

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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasChanges, saving, onClose]);

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

  // Sync line numbers scroll with textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

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

  // Handle context menu for editor
  const handleEditorContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const textarea = textareaRef.current;
    const hasSelection = textarea && textarea.selectionStart !== textarea.selectionEnd;
    
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
        action: () => document.execCommand('selectAll'),
      },
      { divider: true },
      {
        label: 'Revert Changes',
        action: handleRevert,
        disabled: !hasChanges,
      },
    ];
    
    showContextMenu(e, items);
  }, [hasChanges, handleRevert, showContextMenu]);

  if (!isOpen) return null;

  return (
    <div className="file-editor flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Editor */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="bg-[#1e1e1e] text-[#858585] text-right pr-3 pl-4 py-4 font-mono select-none overflow-hidden"
          style={{ minWidth: '50px', fontSize: '15px', lineHeight: '21px' }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        {/* Text editor */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSaved(false);
          }}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onContextMenu={handleEditorContextMenu}
          className="flex-1 p-4 bg-bg-primary text-text-primary font-mono resize-none focus:outline-none"
          style={{ fontSize: '15px', lineHeight: '21px' }}
          spellCheck={false}
          placeholder="File content..."
          data-context-menu
        />
      </div>
    </div>
  );
}
