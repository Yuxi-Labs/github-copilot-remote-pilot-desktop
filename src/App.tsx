import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useSettings } from './hooks/useSettings';
import { useSystemOptimization } from './hooks/useSystemOptimization';
import { useTheme } from './hooks/useTheme';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useWindowState } from './hooks/useWindowState';
import { wsClient } from './services/websocket';
import { saveConnection } from './utils/connectionFavorites';
import { getDeviceName } from './utils/devicePairing';
import { exportChat } from './utils/storage';
import { logger } from './utils/logger';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ChatView } from './components/ChatView';
import { SettingsDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { FileBrowser } from './components/FileBrowser';
import { FileEditor } from './components/FileEditor';
import { Terminal } from './components/Terminal';
import { FavoritesSidebar } from './components/FavoritesSidebar';
import { PairingDialog } from './components/PairingDialog';
import { SessionManagementDialog } from './components/SessionManagementDialog';
import { ErrorNotification, ErrorDetails } from './components/ErrorNotification';
import { ModelInfo, ModeInfo, ChatMode } from './types';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [pairingStatus, setPairingStatus] = useState<'requesting' | 'pending' | 'approved' | 'rejected' | 'error'>('requesting');
  const [pairingId, setPairingId] = useState<string>();
  const [pairingError, setPairingError] = useState<string>();
  const [error, setError] = useState<ErrorDetails | string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(settings.model || '');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('agent');
  const [includeContext, setIncludeContext] = useState<boolean>(true);  // Include VS Code context by default
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor' | 'unknown'>('unknown');
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    filePath: string;
    content: string;
    language?: string;
  }>({ isOpen: false, filePath: '', content: '' });

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

  const {
    connectionStatus,
    messages,
    currentStreamingId,
    connect,
    disconnect,
    sendMessage,
    cancelMessage,
    clearMessages,
  } = useWebSocket({
    url: settings.connectionUrl,
    token: settings.authToken,
    autoReconnect: settings.autoReconnect,
    onError: setError,
    onModelsReceived: handleModelsReceived,
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
        setSettingsOpen(true);
      }
      // Escape: Cancel current request or close dialogs
      if (e.key === 'Escape') {
        if (currentStreamingId) {
          cancelMessage(currentStreamingId);
        } else if (settingsOpen) {
          setSettingsOpen(false);
        } else if (aboutOpen) {
          setAboutOpen(false);
        } else if (fileBrowserOpen) {
          setFileBrowserOpen(false);
        } else if (terminalOpen) {
          setTerminalOpen(false);
        } else if (favoritesOpen) {
          setFavoritesOpen(false);
        } else if (sessionsOpen) {
          setSessionsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStreamingId, cancelMessage, clearMessages, settingsOpen, aboutOpen, fileBrowserOpen, terminalOpen, favoritesOpen, sessionsOpen]);

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

  // Menu handlers
  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleExportChat = useCallback(() => {
    // Export as markdown by default
    exportChat(messages, 'markdown');
  }, [messages]);

  const handleExit = useCallback(() => {
    window.close();
  }, []);

  const handleCopy = useCallback(() => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      navigator.clipboard.writeText(selection);
    }
  }, []);

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
      setSettingsOpen(true);
      return;
    }
    connect();
  }, [settings.connectionUrl, settings.authToken, connect]);

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

  return (
    <div className="flex flex-col h-screen bg-bg-primary">
      {/* Menu Bar */}
      <MenuBar
        onNewChat={handleNewChat}
        onExportChat={handleExportChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onExit={handleExit}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onClearChat={clearMessages}
        onShowAbout={handleShowAbout}
        onShowDocs={handleShowDocs}
        onOpenFavorites={() => setFavoritesOpen(true)}
        onOpenSessions={() => setSessionsOpen(true)}
        theme={theme}
        onThemeChange={setTheme}
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
      />

      {/* Chat View */}
      <ChatView
        messages={messages}
        onSendMessage={(content, file) => {
          // Build the message content with optional attached file
          let messageContent = content;
          if (file) {
            messageContent = `\`\`\`${file.name}\n${file.content}\n\`\`\`\n\n${content}`;
          }
          sendMessage(messageContent, selectedModel, includeContext, selectedMode);
          // Clear the attached file after sending
          setAttachedFile(null);
        }}
        onCancelMessage={handleCancelMessage}
        onNewChat={handleNewChat}
        isConnected={isConnected}
        isStreaming={isStreaming}
        models={availableModels}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        modes={AVAILABLE_MODES}
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        includeContext={includeContext}
        onIncludeContextChange={setIncludeContext}
        onOpenFileBrowser={() => setFileBrowserOpen(true)}
        onOpenTerminal={() => setTerminalOpen(true)}
        attachedFile={attachedFile}
        onAttachFile={setAttachedFile}
        onRemoveAttachedFile={() => setAttachedFile(null)}
        onRetry={handleRetry}
        onRegenerate={handleRegenerate}
      />

      {/* Status Bar */}
      {settings.showStatusBar && (
        <StatusBar
          connectionStatus={connectionStatus}
          connectionUrl={settings.connectionUrl}
          messageCount={messages.length}
          latency={latency}
          connectionQuality={connectionQuality}
          batteryLevel={systemStatus.batteryLevel}
          isCharging={systemStatus.isCharging}
          bandwidthMode={bandwidthMode}
          isOnline={isOnline}
          reconnectAttempts={wsClient.getReconnectAttempts()}
          onManualReconnect={() => wsClient.manualReconnect()}
        />
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onReset={resetSettings}
      />

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

      {/* File Browser */}
      <FileBrowser
        isOpen={fileBrowserOpen}
        onClose={() => setFileBrowserOpen(false)}
        onFileSelect={(path, content) => {
          // Extract just the filename from the path
          const fileName = path.split('/').pop() || path.split('\\').pop() || path;
          setAttachedFile({ name: fileName, content });
          setFileBrowserOpen(false);
        }}
        onEditFile={(path, content, language) => {
          setEditorState({
            isOpen: true,
            filePath: path,
            content,
            language,
          });
          setFileBrowserOpen(false);
        }}
      />

      {/* File Editor */}
      <FileEditor
        isOpen={editorState.isOpen}
        onClose={() => setEditorState(prev => ({ ...prev, isOpen: false }))}
        filePath={editorState.filePath}
        initialContent={editorState.content}
        language={editorState.language}
        onSaved={() => {
          // Optionally refresh or show notification
        }}
      />

      {/* Terminal */}
      <Terminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />

      {/* Favorites Sidebar */}
      <FavoritesSidebar
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
        onSelectConnection={(url, token) => {
          updateSettings({ connectionUrl: url, authToken: token });
          setFavoritesOpen(false);
        }}
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
