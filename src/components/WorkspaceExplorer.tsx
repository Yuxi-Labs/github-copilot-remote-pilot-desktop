import { useState, useEffect, useCallback } from 'react';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown, RefreshCw, ExternalLink, FileText, FileCode, FileJson, Image, Settings, GitBranch, Monitor, FilePlus, FolderPlus, Trash2, ChevronsDown, ChevronsUp } from 'lucide-react';
import { wsClient } from '../services/websocket';
import { FileEntry, ControllerMessage } from '../types';

interface WorkspaceExplorerProps {
  isConnected: boolean;
  onFileSelect?: (path: string, content: string) => void;
  onEditFile?: (path: string, content: string, language?: string, isPreview?: boolean) => void;
  onAttachFile?: (file: { name: string; path: string; content: string }) => void;
}

interface ExplorerState {
  entries: FileEntry[];
  workspaceName: string;
  workspaceId: string;
  workspaceUri: string;
  loading: boolean;
  error: string | null;
  expandedDirs: Set<string>;
}

// Get icon based on file extension
function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return <FileCode size={14} className="text-blue-400" />;
    case 'json':
      return <FileJson size={14} className="text-yellow-400" />;
    case 'md':
    case 'txt':
      return <FileText size={14} className="text-text-secondary" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image size={14} className="text-purple-400" />;
    case 'toml':
    case 'yaml':
    case 'yml':
      return <Settings size={14} className="text-orange-400" />;
    default:
      return <File size={14} className="text-text-secondary" />;
  }
}

export function WorkspaceExplorer({ 
  isConnected, 
  onFileSelect, 
  onEditFile,
  onAttachFile 
}: WorkspaceExplorerProps) {
  const [state, setState] = useState<ExplorerState>({
    entries: [],
    workspaceName: '',
    workspaceId: '',
    workspaceUri: '',
    loading: false,
    error: null,
    expandedDirs: new Set(),
  });

  const [dirContents, setDirContents] = useState<Map<string, FileEntry[]>>(new Map());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);

  const loadDirectory = useCallback((path: string = '') => {
    if (!wsClient.isConnected()) return;
    
    if (path === '') {
      setState(prev => ({ ...prev, loading: true, error: null }));
    }
    
    const requestId = wsClient.requestFiles(path);
    
    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        if (msg.type === 'files') {
          if (path === '') {
            setState(prev => ({
              ...prev,
              entries: msg.payload.entries || [],
              workspaceName: msg.payload.workspaceName || 'Workspace',
              workspaceId: msg.payload.workspaceId || '',
              workspaceUri: msg.payload.workspaceUri || '',
              loading: false,
            }));
          } else {
            setDirContents(prev => new Map(prev).set(path, msg.payload.entries || []));
          }
        } else if (msg.type === 'error') {
          if (path === '') {
            setState(prev => ({ 
              ...prev, 
              error: msg.payload.message || 'Failed to load files', 
              loading: false 
            }));
          }
        }
        wsClient.removeMessageHandler(handleMessage);
      }
    };

    wsClient.addMessageHandler(handleMessage);
  }, []);

  // Auto-load when connected
  useEffect(() => {
    if (isConnected) {
      loadDirectory();
    } else {
      // Reset state when disconnected
      setState({
        entries: [],
        workspaceName: '',
        workspaceId: '',
        workspaceUri: '',
        loading: false,
        error: null,
        expandedDirs: new Set(),
      });
      setDirContents(new Map());
    }
  }, [isConnected, loadDirectory]);

  const toggleDirectory = (path: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedDirs);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
        if (!dirContents.has(path)) {
          loadDirectory(path);
        }
      }
      return { ...prev, expandedDirs: newExpanded };
    });
  };

  const handleFileClick = (entry: FileEntry, isDoubleClick = false) => {
    if (entry.type === 'directory') {
      toggleDirectory(entry.path);
    } else {
      // Load file content and open in editor
      const requestId = wsClient.requestFileContent(entry.path);
      
      const handleMessage = (msg: ControllerMessage) => {
        if (msg.id === requestId) {
          if (msg.type === 'fileContent' && msg.payload.content) {
            // Open file in editor (single click = preview, double click = permanent)
            onEditFile?.(entry.path, msg.payload.content, msg.payload.language, !isDoubleClick);
          }
          wsClient.removeMessageHandler(handleMessage);
        }
      };
      
      wsClient.addMessageHandler(handleMessage);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const handleOpenInVSCode = (path: string) => {
    wsClient.openFile(path);
    setContextMenu(null);
  };

  const handleAttachToContext = (entry: FileEntry) => {
    // Explicitly attach file to chat context
    const requestId = wsClient.requestFileContent(entry.path);
    
    const handleMessage = (msg: ControllerMessage) => {
      if (msg.id === requestId) {
        if (msg.type === 'fileContent' && msg.payload.content) {
          onAttachFile?.({
            name: entry.name,
            path: entry.path,
            content: msg.payload.content,
          });
        }
        wsClient.removeMessageHandler(handleMessage);
      }
    };
    
    wsClient.addMessageHandler(handleMessage);
    setContextMenu(null);
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const renderEntry = (entry: FileEntry, depth: number = 0) => {
    const isExpanded = state.expandedDirs.has(entry.path);
    const children = dirContents.get(entry.path) || [];

    return (
      <div key={entry.path}>
        <button
          className="flex items-center gap-1.5 w-full px-2 py-0.5 text-left text-xs hover:bg-bg-hover transition-colors text-text-primary group"
          style={{ paddingLeft: `${4 + depth * 12}px` }}
          onClick={() => handleFileClick(entry, false)}
          onDoubleClick={() => handleFileClick(entry, true)}
          onContextMenu={(e) => handleContextMenu(e, entry)}
          title={entry.path}
        >
          {entry.type === 'directory' ? (
            <>
              <span className="text-text-secondary">
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </span>
              {isExpanded 
                ? <FolderOpen size={14} className="text-yellow-500 shrink-0" /> 
                : <Folder size={14} className="text-yellow-500 shrink-0" />
              }
            </>
          ) : (
            <>
              <span className="w-3" />
              {getFileIcon(entry.name)}
            </>
          )}
          <span className="truncate">{entry.name}</span>
        </button>
        
        {entry.type === 'directory' && isExpanded && (
          <div>
            {children.length === 0 && !dirContents.has(entry.path) ? (
              <div className="text-[10px] text-text-secondary pl-8 py-0.5">Loading...</div>
            ) : children.length === 0 ? (
              <div className="text-[10px] text-text-secondary pl-8 py-0.5 italic">Empty</div>
            ) : (
              children.map(child => renderEntry(child, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="h-full flex flex-col bg-bg-secondary border-r border-border">
        <div className="px-3 py-2 border-b border-border">
          <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">Explorer</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-text-secondary text-center">
            Connect to a workspace to browse files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary border-r border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
          Explorer
        </h3>
      </div>

      {/* Toolbar and Tabs */}
      <div className="border-b border-border">
        {/* Toolbar */}
        <div className="px-2 py-1.5 flex items-center gap-0.5">
        <button
          onClick={() => {/* TODO: Create file */}}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          title="New File"
        >
          <FilePlus size={14} className="text-text-secondary" />
        </button>
        <button
          onClick={() => {/* TODO: Create folder */}}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          title="New Folder"
        >
          <FolderPlus size={14} className="text-text-secondary" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button
          onClick={() => loadDirectory()}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          title="Refresh Explorer"
        >
          <RefreshCw size={14} className="text-text-secondary" />
        </button>
        <button
          onClick={() => {
            if (state.expandedDirs.size > 0) {
              // Collapse all
              setState(prev => ({ ...prev, expandedDirs: new Set() }));
            } else {
              // Expand all
              const allDirs = new Set<string>();
              const collectDirs = (entries: FileEntry[], basePath = '') => {
                entries.forEach(entry => {
                  if (entry.type === 'directory') {
                    const fullPath = basePath ? `${basePath}/${entry.name}` : entry.name;
                    allDirs.add(fullPath);
                  }
                });
              };
              collectDirs(state.entries);
              setState(prev => ({ ...prev, expandedDirs: allDirs }));
            }
          }}
          className="p-1 hover:bg-bg-hover rounded transition-colors"
          title={state.expandedDirs.size > 0 ? "Collapse All" : "Expand All"}
        >
          {state.expandedDirs.size > 0 ? (
            <ChevronsUp size={14} className="text-text-secondary" />
          ) : (
            <ChevronsDown size={14} className="text-text-secondary" />
          )}
        </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {state.loading ? (
          <div className="px-3 py-2 text-xs text-text-secondary">Loading workspace...</div>
        ) : state.error ? (
          <div className="px-3 py-2 text-xs text-error">{state.error}</div>
        ) : (
          <>
            {/* Workspace Root */}
            <div className="px-2 py-1">
              <div className="flex items-center gap-1.5 text-xs text-text-primary font-medium" title={state.workspaceUri}>
                <Monitor size={14} className="text-accent" />
                <span>{state.workspaceName || 'Workspace'}</span>
              </div>
            </div>
            {/* Entries */}
            {state.entries.length === 0 ? (
              <div className="px-3 py-2 text-xs text-text-secondary">No files found</div>
            ) : (
              state.entries.map(entry => renderEntry(entry))
            )}
          </>
        )}
      </div>

      {/* Hint */}
      <div className="px-3 py-1.5 border-t border-border bg-bg-tertiary">
        <p className="text-[10px] text-text-secondary">
          Click to open • Right-click to attach to chat
        </p>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-bg-primary border border-border shadow-lg py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.entry.type === 'file' && (
            <>
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-bg-hover flex items-center gap-2"
                onClick={() => handleAttachToContext(contextMenu.entry)}
              >
                <FileText size={12} />
                Attach to Chat
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-bg-hover flex items-center gap-2"
                onClick={() => handleOpenInVSCode(contextMenu.entry.path)}
              >
                <ExternalLink size={12} />
                Open in VS Code
              </button>
            </>
          )}
          {contextMenu.entry.type === 'directory' && (
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-bg-hover flex items-center gap-2"
              onClick={() => {
                toggleDirectory(contextMenu.entry.path);
                setContextMenu(null);
              }}
            >
              <FolderOpen size={12} />
              {state.expandedDirs.has(contextMenu.entry.path) ? 'Collapse' : 'Expand'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
