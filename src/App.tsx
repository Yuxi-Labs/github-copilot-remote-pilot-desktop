import { useState, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWebSocket } from './hooks/useWebSocket';
import { useSettings } from './hooks/useSettings';
import { useSystemOptimization } from './hooks/useSystemOptimization';
import { useTheme } from './hooks/useTheme';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useWindowState } from './hooks/useWindowState';
import { useContextMenu, ContextMenuItem } from './components/ContextMenu';
import { wsClient } from './services/websocket';
import { saveConnection } from './utils/connectionFavorites';
import { getDeviceName } from './utils/devicePairing';
import { exportChat } from './utils/storage';
import { logger } from './utils/logger';
import { 
  BranchTree, 
  createBranch, 
  createInitialBranchTree, 
  saveBranchTree, 
  loadBranchTree, 
  deleteBranch, 
  renameBranch 
} from './utils/conversationBranching';
import { 
  loadPendingChanges, 
  savePendingChanges, 
  approveChange, 
  rejectChange, 
  approveAllChanges, 
  rejectAllChanges, 
  removeChangeGroup 
} from './utils/changeTracking';
import { ChangeGroup } from './types/changes';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ChatView } from './components/ChatView';
import { SettingsEditor } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { WorkspaceExplorer } from './components/WorkspaceExplorer';
import { FileEditor } from './components/FileEditor';
import { Terminal } from './components/Terminal';
import { PairingDialog } from './components/PairingDialog';
import { SessionManagementDialog } from './components/SessionManagementDialog';
import { BranchManager } from './components/BranchManager';
import { ChangeApprovalDialog } from './components/ChangeApprovalDialog';
import { ErrorNotification, ErrorDetails } from './components/ErrorNotification';
import { type ModelInfo, type ModeInfo, type ChatMode, type ContextFile } from './types';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

// Available modes
const AVAILABLE_MODES: ModeInfo[] = [
  { id: 'agent', name: 'Agent', description: 'Autonomous coding agent that can make changes' },
  { id: 'ask', name: 'Ask', description: 'Ask questions and get answers about code' },
  { id: 'edit', name: 'Edit', description: 'Make targeted edits to selected code' },
  { id: 'plan', name: 'Plan', description: 'Plan and outline coding tasks step by step' },
];

function App() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { systemStatus, batteryMode, bandwidthMode } = useSystemOptimization();
  const { theme, setTheme } = useTheme();
  const isOnline = useNetworkStatus();
  useWindowState(); // Persist window size/position
  const { showContextMenu } = useContextMenu();
  const [settingsInitialTab, setSettingsInitialTab] = useState<'connection' | 'terminal' | 'appearance'>('connection');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [explorerWidth, setExplorerWidth] = useState(220);
  const [chatWidth, setChatWidth] = useState(420);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [terminalMaximized, setTerminalMaximized] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [branchManagerOpen, setBranchManagerOpen] = useState(false);
  const [branchTree, setBranchTree] = useState<BranchTree | null>(null);
  const [changeApprovalOpen, setChangeApprovalOpen] = useState(false);
  const [pendingChangeGroups, setPendingChangeGroups] = useState<ChangeGroup[]>([]);
  const [pairingStatus, setPairingStatus] = useState<'requesting' | 'pending' | 'approved' | 'rejected' | 'error'>('requesting');
  const [pairingId, setPairingId] = useState<string>();
  const [pairingError, setPairingError] = useState<string>();
  const [error, setError] = useState<ErrorDetails | string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(settings.model || '');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('agent');
  const [includeContext, setIncludeContext] = useState<boolean>(true);  // Include VS Code context by default
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor' | 'unknown'>('unknown');
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    filePath: string;
    content: string;
    language?: string;
  }>({ isOpen: false, filePath: '', content: '' });
  const [editorInfo, setEditorInfo] = useState<{
    fileName: string;
    language: string;
    lineCount: number;
    charCount: number;
    hasChanges: boolean;
  } | null>(null);
  const [openTabs, setOpenTabs] = useState<{ path: string; name: string; isPreview: boolean; content: string; language?: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleModelsReceived = useCallback((models: ModelInfo[]) => {
    logger.log('Models received in App:', models);
    logger.log('Model IDs:', models.map(m => m.id));
    setAvailableModels(models);
    if (models.length === 0) {
      // Clear selected model on disconnect
      setSelectedModel('');
    } else {
      // Always update to ensure we have a valid model selected
      setSelectedModel(current => {
        // If current selection exists in new models, keep it
        if (current && models.some(m => m.id === current)) {
          logger.log('Keeping current model:', current);
          return current;
        }
        // Otherwise select default or first model
        const defaultModel = models.find(m => m.isDefault) || models[0];
        logger.log('Auto-selecting model:', defaultModel.id);
        return defaultModel.id;
      });
    }
  }, []);

  const handlePendingChange = useCallback((group: ChangeGroup) => {
    setPendingChangeGroups(prev => {
      // Check if group already exists
      const existing = prev.find(g => g.id === group.id);
      if (existing) {
        return prev.map(g => g.id === group.id ? group : g);
      }
      return [...prev, group];
    });
    savePendingChanges([...pendingChangeGroups, group]);
    
    // Auto-open change approval dialog if not already open
    if (!changeApprovalOpen) {
      setChangeApprovalOpen(true);
    }
  }, [pendingChangeGroups, changeApprovalOpen]);

  const {
    connectionStatus,
    messages,
    currentStreamingId,
    connect,
    disconnect,
    sendMessage,
    cancelMessage,
    clearMessages,
    approveChange: wsApproveChange,
    rejectChange: wsRejectChange,
  } = useWebSocket({
    url: settings.connectionUrl,
    token: settings.authToken,
    autoReconnect: settings.autoReconnect,
    onError: setError,
    onModelsReceived: handleModelsReceived,
    onPendingChange: handlePendingChange,
  });

  const isConnected = connectionStatus === 'connected';
  const isStreaming = currentStreamingId !== null;

  // Auto-save connection to favorites on successful connect
  useEffect(() => {
    if (isConnected && settings.connectionUrl && settings.authToken) {
      const url = new URL(settings.connectionUrl);
      const name = url.hostname === 'localhost' ? 'Local' : url.hostname;
      saveConnection(name, settings.connectionUrl, settings.authToken, false);
    }
  }, [isConnected, settings.connectionUrl, settings.authToken]);

  // Initialize branch tree on mount
  useEffect(() => {
    const initBranches = () => {
      const loaded = loadBranchTree();
      if (loaded) {
        setBranchTree(loaded);
      } else {
        setBranchTree(createInitialBranchTree(messages));
      }
    };
    initBranches();
  }, []);

  // Load pending changes on mount
  useEffect(() => {
    const groups = loadPendingChanges();
    setPendingChangeGroups(groups);
  }, []);

  // Update active branch messages when messages change
  useEffect(() => {
    if (branchTree?.branches) {
      const activeBranch = branchTree.branches.get(branchTree.activeBranchId);
      if (activeBranch) {
        const updatedBranch = { ...activeBranch, messages };
        const newTree = {
          ...branchTree,
          branches: new Map(branchTree.branches).set(branchTree.activeBranchId, updatedBranch),
        };
        setBranchTree(newTree);
        saveBranchTree(newTree);
      }
    }
  }, [messages]);

  // Pause auto-reconnect when offline
  useEffect(() => {
    if (!isOnline && connectionStatus === 'error') {
      // Temporarily disable auto-reconnect when offline
      wsClient.setAutoReconnect(false);
    } else if (isOnline && settings.autoReconnect) {
      // Re-enable auto-reconnect when back online
      wsClient.setAutoReconnect(true);
    }
  }, [isOnline, connectionStatus, settings.autoReconnect]);

  // Menu handlers (defined before keyboard shortcuts that use them)
  const handleExportChat = useCallback(() => {
    exportChat(messages, 'markdown');
  }, [messages]);

  // Open Settings as a tab
  const openSettingsTab = useCallback((initialTab?: 'connection' | 'terminal' | 'appearance') => {
    if (initialTab) {
      setSettingsInitialTab(initialTab);
    }
    const settingsPath = 'settings://Settings';
    setOpenTabs(prev => {
      const existing = prev.find(tab => tab.path === settingsPath);
      if (existing) return prev;
      return [...prev, { path: settingsPath, name: 'Settings', isPreview: false, content: '', language: 'settings' }];
    });
    setActiveTab(settingsPath);
    setEditorState({ isOpen: false, filePath: '', content: '' }); // Clear file editor state
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New Chat (same as Ctrl+K for now)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        clearMessages();
      }
      // Ctrl+K: Clear Chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearMessages();
      }
      // Ctrl+,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettingsTab();
      }
      // Ctrl+E: Export Chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExportChat();
      }
      // F1: Documentation
      if (e.key === 'F1') {
        e.preventDefault();
        window.open('https://github.com/Yuxi-Labs/vscode-github-copilot-controller', '_blank');
      }
      // Ctrl+`: Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setTerminalOpen(!terminalOpen);
      }
      // Ctrl+Shift+B: Toggle Branch Manager
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        setBranchManagerOpen(!branchManagerOpen);
      }
      // Ctrl+Shift+C: Toggle Change Approval
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setChangeApprovalOpen(!changeApprovalOpen);
      }
      // Escape: Cancel current request or close dialogs
      if (e.key === 'Escape') {
        if (currentStreamingId) {
          cancelMessage(currentStreamingId);
        } else if (aboutOpen) {
          setAboutOpen(false);
        } else if (terminalOpen) {
          setTerminalOpen(false);
        } else if (sessionsOpen) {
          setSessionsOpen(false);
        } else if (branchManagerOpen) {
          setBranchManagerOpen(false);
        } else if (changeApprovalOpen) {
          setChangeApprovalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStreamingId, cancelMessage, clearMessages, aboutOpen, terminalOpen, sessionsOpen, handleExportChat, openSettingsTab]);

  // Send battery and bandwidth optimization to controller
  useEffect(() => {
    if (isConnected) {
      wsClient.setBatteryMode(batteryMode);
      wsClient.setBandwidthMode(bandwidthMode);
    }
  }, [isConnected, batteryMode, bandwidthMode]);

  // Update latency and connection quality periodically
  useEffect(() => {
    if (!isConnected) {
      setLatency(0);
      setConnectionQuality('unknown');
      return;
    }

    const interval = setInterval(() => {
      const currentLatency = wsClient.getAverageLatency();
      const quality = wsClient.getConnectionQuality();
      setLatency(currentLatency);
      setConnectionQuality(quality);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isConnected]);

  // Other menu handlers
  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleExit = useCallback(() => {
    window.close();
  }, []);

  const handleCopy = useCallback(() => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }
  }, []);

  // Branch handlers
  const handleCreateBranch = useCallback((messageIndex: number) => {
    if (!branchTree?.branches) return;
    
    const activeBranch = branchTree.branches.get(branchTree.activeBranchId);
    if (!activeBranch) return;
    
    const newBranch = createBranch(activeBranch, messageIndex);
    const newTree = {
      branches: new Map(branchTree.branches).set(newBranch.id, newBranch),
      activeBranchId: newBranch.id,
    };
    
    setBranchTree(newTree);
    saveBranchTree(newTree);
  }, [branchTree]);

  const handleSwitchBranch = useCallback((branchId: string) => {
    if (!branchTree?.branches) return;
    
    const branch = branchTree.branches.get(branchId);
    if (!branch) return;
    
    const newTree = {
      ...branchTree,
      activeBranchId: branchId,
    };
    
    setBranchTree(newTree);
    saveBranchTree(newTree);
    setBranchManagerOpen(false);
  }, [branchTree]);

  const handleDeleteBranch = useCallback((branchId: string) => {
    if (!branchTree) return;
    
    const newTree = deleteBranch(branchTree, branchId);
    setBranchTree(newTree);
    saveBranchTree(newTree);
  }, [branchTree]);

  const handleRenameBranch = useCallback((branchId: string, newName: string) => {
    if (!branchTree) return;
    
    const newTree = renameBranch(branchTree, branchId, newName);
    setBranchTree(newTree);
    saveBranchTree(newTree);
  }, [branchTree]);

  const handleApproveChange = useCallback((groupId: string, changeId: string) => {
    approveChange(groupId, changeId);
    wsApproveChange(changeId);
    setPendingChangeGroups(loadPendingChanges());
  }, [wsApproveChange]);

  const handleRejectChange = useCallback((groupId: string, changeId: string) => {
    rejectChange(groupId, changeId);
    wsRejectChange(changeId);
    setPendingChangeGroups(loadPendingChanges());
  }, [wsRejectChange]);

  const handleApproveAllChanges = useCallback((groupId: string) => {
    approveAllChanges(groupId);
    const groups = loadPendingChanges();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.changes.forEach(change => wsApproveChange(change.id));
    }
    setPendingChangeGroups(loadPendingChanges());
  }, [wsApproveChange]);

  const handleRejectAllChanges = useCallback((groupId: string) => {
    rejectAllChanges(groupId);
    const groups = loadPendingChanges();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.changes.forEach(change => wsRejectChange(change.id));
    }
    setPendingChangeGroups(loadPendingChanges());
  }, [wsRejectChange]);

  const handlePaste = useCallback(async () => {
    // Paste is handled natively by the textarea
  }, []);

  const handleShowAbout = useCallback(() => {
    setAboutOpen(true);
  }, []);

  const handleShowDocs = useCallback(() => {
    window.open('https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop', '_blank');
  }, []);

  const handleConnect = useCallback(() => {
    if (!settings.connectionUrl || !settings.authToken) {
      openSettingsTab('connection');
      return;
    }
    connect();
  }, [settings.connectionUrl, settings.authToken, connect, openSettingsTab]);

  const handleCancelMessage = useCallback(() => {
    if (currentStreamingId) {
      cancelMessage(currentStreamingId);
    }
  }, [currentStreamingId, cancelMessage]);

  const handleModelChange = useCallback((modelId: string) => {
    logger.log('Model changed to:', modelId);
    setSelectedModel(modelId);
    updateSettings({ model: modelId });
  }, [updateSettings]);

  const handleModeChange = useCallback((mode: ChatMode) => {
    setSelectedMode(mode);
  }, []);

  // Context file handlers
  const handleToggleContextFile = useCallback((id: string) => {
    setContextFiles(prev => prev.map(f => 
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  }, []);

  const handleRemoveContextFile = useCallback((id: string) => {
    setContextFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleAttachManual = useCallback(() => {
    // TODO: Open file picker dialog
    logger.log('Manual file attach requested');
  }, []);

  const handleAttachFileToContext = useCallback((file: { name: string; content: string }) => {
    // Add file to context if not already present
    const exists = contextFiles.some(f => f.name === file.name);
    if (!exists) {
      const newContextFile: ContextFile = {
        id: uuidv4(),
        name: file.name,
        path: file.name, // TODO: Get actual path if available
        content: file.content,
        enabled: true,
        isAuto: false,
      };
      setContextFiles(prev => [...prev, newContextFile]);
    }
  }, [contextFiles]);

  const handleRetry = useCallback((_messageId: string, content: string) => {
    // Resend the message with context from the original message
    sendMessage(content, selectedModel, includeContext, selectedMode);
  }, [sendMessage, selectedModel, includeContext, selectedMode]);

  const handleRegenerate = useCallback((messageId: string) => {
    // Find the assistant message and the user message before it
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== 'assistant') return;

    // Find the previous user message and resend it
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        // Resend the user's message to get a new response
        sendMessage(messages[i].content, selectedModel, includeContext, selectedMode);
        break;
      }
    }
  }, [messages, sendMessage, selectedModel, includeContext, selectedMode]);

  // Build generic context menu items
  const buildGenericContextMenu = useCallback((): ContextMenuItem[] => {
    const hasSelection = window.getSelection()?.toString().trim();
    return [
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
    ];
  }, []);

  // Handle tab context menu
  const handleTabContextMenu = useCallback((e: React.MouseEvent, tabPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const items: ContextMenuItem[] = [
      {
        label: 'Close',
        action: () => {
          setOpenTabs(prev => {
            const filtered = prev.filter(t => t.path !== tabPath);
            if (activeTab === tabPath && filtered.length > 0) {
              const newActive = filtered[filtered.length - 1];
              setActiveTab(newActive.path);
              setEditorState({
                isOpen: true,
                filePath: newActive.path,
                content: newActive.content,
                language: newActive.language,
              });
            } else if (filtered.length === 0) {
              setActiveTab(null);
              setEditorState({ isOpen: false, filePath: '', content: '' });
            }
            return filtered;
          });
        },
      },
      {
        label: 'Close Others',
        action: () => {
          setOpenTabs(prev => prev.filter(t => t.path === tabPath));
          const tab = openTabs.find(t => t.path === tabPath);
          if (tab) {
            setActiveTab(tabPath);
            setEditorState({
              isOpen: true,
              filePath: tab.path,
              content: tab.content,
              language: tab.language,
            });
          }
        },
        disabled: openTabs.length <= 1,
      },
      {
        label: 'Close All',
        action: () => {
          setOpenTabs([]);
          setActiveTab(null);
          setEditorState({ isOpen: false, filePath: '', content: '' });
        },
      },
      { divider: true },
      {
        label: 'Copy Path',
        action: async () => {
          await navigator.clipboard.writeText(tabPath);
        },
      },
    ];
    
    showContextMenu(e, items);
  }, [activeTab, openTabs, showContextMenu]);

  // Handle context menu for generic areas
  const handleAppContextMenu = useCallback((e: React.MouseEvent) => {
    // Only show generic menu if the event didn't bubble up from a more specific handler
    if ((e.target as HTMLElement).closest('[data-context-menu]')) {
      return; // Let the specific context menu handler handle it
    }
    e.preventDefault();
    showContextMenu(e, buildGenericContextMenu());
  }, [showContextMenu, buildGenericContextMenu]);

  return (
    <div 
      className="flex flex-col h-screen bg-bg-primary"
      onContextMenu={handleAppContextMenu}
    >
      {/* Menu Bar */}
      <MenuBar
        isConnected={isConnected}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        onNewFile={() => {
          // TODO: Implement new file creation
        }}
        onNewFolder={() => {
          // TODO: Implement new folder creation
        }}
        onSave={() => {
          // Save current file via AI
          if (editorState.isOpen && activeTab) {
            // Trigger save via FileEditor's Save button functionality
          }
        }}
        onSaveAs={() => {
          // TODO: Implement save as
        }}
        onSaveAll={() => {
          // Save all modified tabs via AI
        }}
        onExit={handleExit}
        onUndo={() => document.execCommand('undo')}
        onRedo={() => document.execCommand('redo')}
        onCut={() => document.execCommand('cut')}
        onCopy={handleCopy}
        onPaste={handlePaste}
        terminalOpen={terminalOpen}
        terminalMaximized={terminalMaximized}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
        onMinimizeTerminal={() => setTerminalMaximized(false)}
        onMaximizeTerminal={() => setTerminalMaximized(true)}
        onOpenSettings={() => openSettingsTab()}
        onOpenConnections={() => openSettingsTab('connection')}
        onShowDocs={handleShowDocs}
        onReportIssue={() => window.open('https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop/issues/new?labels=bug', '_blank')}
        onRequestFeature={() => window.open('https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop/issues/new?labels=enhancement', '_blank')}
        onShowAbout={handleShowAbout}
      />

      {/* Error Notification */}
      {error && (
        <ErrorNotification
          error={error}
          onDismiss={() => setError(null)}
          onRetry={typeof error === 'object' && error.canRetry ? handleConnect : undefined}
        />
      )}

      {/* Toolbar */}
      <Toolbar
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        onOpenTerminal={() => setTerminalOpen(true)}
        onOpenBranchManager={() => setBranchManagerOpen(true)}
        onOpenPendingChanges={() => setChangeApprovalOpen(true)}
        pendingChangesCount={pendingChangeGroups.reduce((count, group) => 
          count + group.changes.filter(c => c.status === 'pending').length, 0)}
        hasMessages={messages.length > 0}
      />

      {/* Main Content Area - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Workspace Explorer - Full height */}
        <div className="shrink-0 flex flex-col" style={{ width: explorerWidth }}>
          <WorkspaceExplorer
            isConnected={isConnected}
            onAttachFile={(file) => {
              // Explicitly attach file to chat context (called from context menu)
              const exists = contextFiles.some(f => f.name === file.name);
              if (!exists) {
                const newContextFile: ContextFile = {
                  id: uuidv4(),
                  name: file.name,
                  path: file.name,
                  content: file.content,
                  enabled: true,
                  isAuto: false, // Explicitly attached from context menu
                };
                setContextFiles(prev => [...prev, newContextFile]);
              }
            }}
            onEditFile={(path, content, language, isPreview = true) => {
              // Manage tabs
              const fileName = path.split('/').pop() || path;
              setOpenTabs(prev => {
                const withoutPreview = isPreview ? prev.filter(tab => !tab.isPreview) : prev;
                const existingIndex = withoutPreview.findIndex(tab => tab.path === path);
                if (existingIndex >= 0) {
                  if (!isPreview && withoutPreview[existingIndex].isPreview) {
                    withoutPreview[existingIndex] = { ...withoutPreview[existingIndex], isPreview: false };
                  }
                  return withoutPreview;
                }
                return [...withoutPreview, { path, name: fileName, isPreview, content, language }];
              });
              setActiveTab(path);
              setEditorState({
                isOpen: true,
                filePath: path,
                content,
                language,
              });
            }}
          />
        </div>

        {/* Resize handle for Explorer */}
        <div
          className="w-px bg-border hover:bg-accent cursor-col-resize transition-colors shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = explorerWidth;
            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(150, Math.min(600, startWidth + e.clientX - startX));
              setExplorerWidth(newWidth);
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Center: Editor area + Terminal (stacked) */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Editor/content area */}
          <div className={`bg-bg-primary flex-1 min-h-0 flex flex-col ${terminalOpen && !terminalMaximized ? '' : ''}`} style={terminalOpen && !terminalMaximized ? { flex: `1 1 calc(100% - ${terminalHeight}px)` } : undefined}>
            {/* Tabs Row */}
            {openTabs.length > 0 && (
              <div className="flex items-center overflow-x-auto border-b border-border bg-bg-secondary" style={{ height: '32px' }}>
                {openTabs.map(tab => (
                  <div
                    key={tab.path}
                    className={`flex items-center gap-1.5 px-3 h-full text-xs border-r border-border cursor-pointer hover:bg-bg-hover ${
                      activeTab === tab.path ? 'bg-bg-primary text-text-primary' : 'text-text-secondary'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.path);
                      setEditorState({
                        isOpen: true,
                        filePath: tab.path,
                        content: tab.content,
                        language: tab.language,
                      });
                    }}
                    onContextMenu={(e) => handleTabContextMenu(e, tab.path)}
                    data-context-menu
                  >
                    <span className={tab.isPreview ? 'italic' : ''}>{tab.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTabs(prev => {
                          const filtered = prev.filter(t => t.path !== tab.path);
                          if (activeTab === tab.path && filtered.length > 0) {
                            const newActive = filtered[filtered.length - 1];
                            setActiveTab(newActive.path);
                            setEditorState({
                              isOpen: true,
                              filePath: newActive.path,
                              content: newActive.content,
                              language: newActive.language,
                            });
                          } else if (filtered.length === 0) {
                            setActiveTab(null);
                            setEditorState({ isOpen: false, filePath: '', content: '' });
                          }
                          return filtered;
                        });
                      }}
                      className="hover:bg-bg-tertiary rounded p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Editor, Settings, or Welcome */}
            {activeTab === 'settings://Settings' ? (
              <SettingsEditor
                settings={settings}
                onSave={updateSettings}
                onReset={resetSettings}
                initialTab={settingsInitialTab}
                availableModels={availableModels}
              />
            ) : editorState.isOpen ? (
              <FileEditor
                isOpen={true}
                filePath={editorState.filePath}
                initialContent={editorState.content}
                language={editorState.language}
                onClose={() => {
                  setOpenTabs(prev => prev.filter(t => t.path !== editorState.filePath));
                  setEditorState({ isOpen: false, filePath: '', content: '' });
                  setActiveTab(null);
                  setEditorInfo(null);
                }}
                onSaved={() => {
                  // File saved via Copilot
                }}
                onEditorInfoChange={setEditorInfo}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-sm">
                <div className="text-center">
                  <p className="mb-2">Select a file to open in editor</p>
                  <p className="text-xs text-text-secondary/60">Click files in Explorer to edit</p>
                </div>
              </div>
            )}
          </div>

          {/* Terminal Panel */}
          {terminalOpen && (
            <>
              {/* Resize handle for Terminal */}
              <div
                className="h-px bg-border hover:bg-accent cursor-row-resize transition-colors shrink-0"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startHeight = terminalHeight;
                  const handleMouseMove = (e: MouseEvent) => {
                    const newHeight = Math.max(100, Math.min(600, startHeight - (e.clientY - startY)));
                    setTerminalHeight(newHeight);
                  };
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
              <div 
                className="shrink-0" 
                style={{ height: terminalMaximized ? '100%' : terminalHeight }}
              >
              <Terminal
                isOpen={terminalOpen}
                onClose={() => setTerminalOpen(false)}
                onToggleMaximize={() => setTerminalMaximized(!terminalMaximized)}
                isMaximized={terminalMaximized}
                onOpenSettings={(tab) => openSettingsTab(tab || 'terminal')}
              />
              </div>
            </>
          )}
        </div>

        {/* Resize handle for Chat */}
        <div
          className="w-px bg-border hover:bg-accent cursor-col-resize transition-colors shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = chatWidth;
            const handleMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(300, Math.min(800, startWidth - (e.clientX - startX)));
              setChatWidth(newWidth);
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Right: Chat Sidebar - Full height */}
        <div className="shrink-0 flex flex-col" style={{ width: chatWidth }}>
          <ChatView
            messages={branchTree?.branches ? (branchTree.branches.get(branchTree.activeBranchId)?.messages || messages) : messages}
            onSendMessage={(content) => {
              // Build message content with open tabs as context
              let messageContent = content;
              // Use open tabs as context (+ any manually attached files)
              const tabContextFiles = openTabs.map(tab => ({
                id: tab.path,
                name: tab.name,
                path: tab.path,
                content: tab.content,
                enabled: true,
                isAuto: true,
              }));
              const allContextFiles = [...tabContextFiles, ...contextFiles.filter(f => !tabContextFiles.some(t => t.path === f.path))];
              const enabledFiles = allContextFiles.filter(f => f.enabled);
              if (enabledFiles.length > 0) {
                const contextSection = enabledFiles.map(f => 
                  `\`\`\`${f.name}\n${f.content}\n\`\`\``
                ).join('\n\n');
                messageContent = `${contextSection}\n\n${content}`;
              }
              setStreamingStatus('Sending to Copilot...');
              sendMessage(messageContent, selectedModel, includeContext, selectedMode);
            }}
            onCancelMessage={handleCancelMessage}
            onNewChat={handleNewChat}
            onBranch={handleCreateBranch}
            isConnected={isConnected}
            isStreaming={isStreaming}
            streamingStatus={streamingStatus}
            models={availableModels}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            modes={AVAILABLE_MODES}
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            includeContext={includeContext}
            onIncludeContextChange={setIncludeContext}
            onRetry={handleRetry}
            onRegenerate={handleRegenerate}
            contextFiles={[
              // Show open tabs as context files in chat
              ...openTabs.map(tab => ({
                id: tab.path,
                name: tab.name,
                path: tab.path,
                content: tab.content,
                enabled: true,
                isAuto: true,
              })),
              // Plus any manually attached files
              ...contextFiles.filter(f => !openTabs.some(t => t.path === f.path)),
            ]}
            onToggleContextFile={handleToggleContextFile}
            onRemoveContextFile={handleRemoveContextFile}
            onAttachManual={handleAttachManual}
            onExportChat={handleExportChat}
            onClearChat={clearMessages}
            onOpenBranchManager={() => setBranchManagerOpen(true)}
          />
        </div>
      </div>

      {/* Status Bar */}
      {settings.showStatusBar && (
        <StatusBar
          connectionStatus={connectionStatus}
          connectionUrl={settings.connectionUrl}
          messageCount={messages.length}
          latency={latency}
          connectionQuality={connectionQuality}
          bandwidthMode={bandwidthMode}
          batteryMode={batteryMode}
          isOnline={isOnline}
          reconnectAttempts={wsClient.getReconnectAttempts()}
          onManualReconnect={() => wsClient.manualReconnect()}
          selectedMode={selectedMode}
          selectedModel={availableModels.find(m => m.id === selectedModel)?.name}
          pendingChangesCount={pendingChangeGroups.reduce((count, group) => 
            count + group.changes.filter(c => c.status === 'pending').length, 0)}
          onOpenPendingChanges={() => setChangeApprovalOpen(true)}
          activeBranch={branchTree?.branches?.get(branchTree.activeBranchId)?.name}
          onOpenBranchManager={() => setBranchManagerOpen(true)}
          isStreaming={isStreaming}
          streamingStatus={streamingStatus}
          editorInfo={editorInfo}
        />
      )}

      {/* About Dialog */}
      <AboutDialog
        isOpen={aboutOpen}
        onClose={() => setAboutOpen(false)}
      />

      {/* Session Management Dialog */}
      <SessionManagementDialog
        isOpen={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
      />

      {/* Branch Manager */}
      {branchTree && (
        <BranchManager
          isOpen={branchManagerOpen}
          branchTree={branchTree}
          onSwitchBranch={handleSwitchBranch}
          onDeleteBranch={handleDeleteBranch}
          onRenameBranch={handleRenameBranch}
          onClose={() => setBranchManagerOpen(false)}
        />
      )}

      {/* Change Approval Dialog */}
      <ChangeApprovalDialog
        groups={pendingChangeGroups}
        onApprove={handleApproveChange}
        onReject={handleRejectChange}
        onApproveAll={handleApproveAllChanges}
        onRejectAll={handleRejectAllChanges}
        onClose={() => setChangeApprovalOpen(false)}
      />

      {/* Pairing Dialog */}
      <PairingDialog
        isOpen={pairingOpen}
        status={pairingStatus}
        pairingId={pairingId}
        error={pairingError}
        deviceName={getDeviceName()}
        onClose={() => {
          setPairingOpen(false);
          setPairingStatus('requesting');
          setPairingId(undefined);
          setPairingError(undefined);
        }}
        onRetry={() => {
          setPairingStatus('requesting');
          setPairingError(undefined);
          // Retry pairing logic would go here
        }}
      />
    </div>
  );
}

export default App;
