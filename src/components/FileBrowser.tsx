import { useState, useEffect, useCallback } from 'react';
import { Folder, File, ChevronRight, ChevronDown, X, FolderOpen, RefreshCw, Edit, ExternalLink } from 'lucide-react';
import { wsClient } from '../services/websocket';
import { FileEntry, ControllerMessage } from '../types';

interface FileBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect?: (path: string, content: string) => void;
  onEditFile?: (path: string, content: string, language?: string) => void;
}

interface BrowserState {
  currentPath: string;
  entries: FileEntry[];
  workspaceName: string;
  loading: boolean;
  error: string | null;
  expandedDirs: Set<string>;
  selectedFile: string | null;
  fileContent: string | null;
  fileLoading: boolean;
}

export function FileBrowser({ isOpen, onClose, onFileSelect, onEditFile }: FileBrowserProps) {
  const [state, setState] = useState<BrowserState>({
    currentPath: '',
    entries: [],
    workspaceName: '',
    loading: false,
    error: null,
    expandedDirs: new Set(),
    selectedFile: null,
    fileContent: null,
    fileLoading: false,
  });

  // Track nested directory contents
  const [dirContents, setDirContents] = useState<Map<string, FileEntry[]>>(new Map());

  const loadDirectory = useCallback((path: string = '') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const requestId = wsClient.requestFiles(path);
    
    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        if (msg.type === 'files') {
          if (path === '') {
            setState(prev => ({
              ...prev,
              currentPath: msg.payload.path || '',
              entries: msg.payload.entries || [],
              workspaceName: msg.payload.workspaceName || 'Workspace',
              loading: false,
            }));
          } else {
            setDirContents(prev => new Map(prev).set(path, msg.payload.entries || []));
            setState(prev => ({ ...prev, loading: false }));
          }
        } else if (msg.type === 'error') {
          setState(prev => ({ 
            ...prev, 
            error: msg.payload.message || 'Failed to load files', 
            loading: false 
          }));
        }
        wsClient.removeMessageHandler(handleMessage);
      }
    };

    wsClient.addMessageHandler(handleMessage);
  }, []);

  const loadFileContent = useCallback((path: string) => {
    setState(prev => ({ ...prev, fileLoading: true, selectedFile: path, fileContent: null }));
    
    const requestId = wsClient.requestFileContent(path);
    
    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        if (msg.type === 'fileContent') {
          setState(prev => ({
            ...prev,
            fileContent: msg.payload.content || '',
            fileLoading: false,
          }));
        } else if (msg.type === 'error') {
          setState(prev => ({ 
            ...prev, 
            error: msg.payload.message || 'Failed to read file', 
            fileLoading: false 
          }));
        }
        wsClient.removeMessageHandler(handleMessage);
      }
    };

    wsClient.addMessageHandler(handleMessage);
  }, []);

  // Load root directory when opening
  useEffect(() => {
    if (isOpen && wsClient.isConnected()) {
      loadDirectory();
    }
  }, [isOpen, loadDirectory]);

  const toggleDirectory = (path: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedDirs);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
        // Load directory contents if not already loaded
        if (!dirContents.has(path)) {
          loadDirectory(path);
        }
      }
      return { ...prev, expandedDirs: newExpanded };
    });
  };

  const handleFileClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      toggleDirectory(entry.path);
    } else {
      loadFileContent(entry.path);
    }
  };

  const handleInsertFile = () => {
    if (state.selectedFile && state.fileContent && onFileSelect) {
      onFileSelect(state.selectedFile, state.fileContent);
      onClose();
    }
  };

  const renderEntry = (entry: FileEntry, depth: number = 0) => {
    const isExpanded = state.expandedDirs.has(entry.path);
    const isSelected = state.selectedFile === entry.path;
    const children = dirContents.get(entry.path) || [];

    return (
      <div key={entry.path}>
        <button
          className={`flex items-center gap-2 w-full px-2 py-1 text-left text-sm hover:bg-bg-hover transition-colors ${
            isSelected ? 'bg-accent/20 text-accent' : 'text-text-primary'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => handleFileClick(entry)}
        >
          {entry.type === 'directory' ? (
            <>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isExpanded ? <FolderOpen size={14} className="text-yellow-500" /> : <Folder size={14} className="text-yellow-500" />}
            </>
          ) : (
            <>
              <span className="w-[14px]" />
              <File size={14} className="text-text-secondary" />
            </>
          )}
          <span className="truncate">{entry.name}</span>
          {entry.type === 'file' && entry.size !== undefined && (
            <span className="ml-auto text-xs text-text-secondary">
              {entry.size < 1024 ? `${entry.size}B` : `${(entry.size / 1024).toFixed(1)}KB`}
            </span>
          )}
        </button>
        
        {entry.type === 'directory' && isExpanded && (
          <div>
            {children.map(child => renderEntry(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border w-[800px] h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-accent" />
            <h2 className="text-sm font-medium text-text-primary">
              {state.workspaceName || 'File Browser'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDirectory()}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className="text-text-secondary" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-hover transition-colors"
            >
              <X size={18} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree */}
          <div className="w-[280px] border-r border-border overflow-y-auto bg-bg-secondary">
            {state.loading && state.entries.length === 0 ? (
              <div className="p-4 text-sm text-text-secondary">Loading...</div>
            ) : state.error ? (
              <div className="p-4 text-sm text-error">{state.error}</div>
            ) : (
              <div className="py-1">
                {state.entries.map(entry => renderEntry(entry))}
              </div>
            )}
          </div>

          {/* File Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {state.selectedFile ? (
              <>
                <div className="px-4 py-2 border-b border-border bg-bg-tertiary flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{state.selectedFile}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => wsClient.openFile(state.selectedFile!)}
                      disabled={!state.selectedFile}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                      title="Open in VS Code"
                    >
                      <ExternalLink size={12} />
                      <span>VS Code</span>
                    </button>
                    <button
                      onClick={() => {
                        if (state.selectedFile && state.fileContent) {
                          onEditFile?.(state.selectedFile, state.fileContent);
                        }
                      }}
                      disabled={!state.fileContent}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover disabled:opacity-50 transition-colors"
                      title="Edit file"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={handleInsertFile}
                      disabled={!state.fileContent}
                      className="px-3 py-1 text-xs bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                      Insert in Chat
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-bg-primary">
                  {state.fileLoading ? (
                    <div className="text-sm text-text-secondary">Loading file...</div>
                  ) : state.fileContent ? (
                    <pre className="text-xs text-text-primary font-mono whitespace-pre-wrap">
                      {state.fileContent}
                    </pre>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                Select a file to preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
