import { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useSettings } from './hooks/useSettings';
import { MenuBar } from './components/MenuBar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { ChatView } from './components/ChatView';
import { SettingsDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(settings.model || '');
  const [selectedMode, setSelectedMode] = useState<ChatMode>('agent');

  const handleModelsReceived = useCallback((models: ModelInfo[]) => {
    console.log('Models received in App:', models);
    console.log('Model IDs:', models.map(m => m.id));
    setAvailableModels(models);
    if (models.length === 0) {
      // Clear selected model on disconnect
      setSelectedModel('');
    } else {
      // Always update to ensure we have a valid model selected
      setSelectedModel(current => {
        // If current selection exists in new models, keep it
        if (current && models.some(m => m.id === current)) {
          console.log('Keeping current model:', current);
          return current;
        }
        // Otherwise select default or first model
        const defaultModel = models.find(m => m.isDefault) || models[0];
        console.log('Auto-selecting model:', defaultModel.id);
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

  // Menu handlers
  const handleNewChat = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleExportChat = useCallback(() => {
    const text = messages
      .map((m) => `[${m.role === 'user' ? 'You' : 'Copilot'}]: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copilot-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
    console.log('Model changed to:', modelId);
    setSelectedModel(modelId);
    updateSettings({ model: modelId });
  }, [updateSettings]);

  const handleModeChange = useCallback((mode: ChatMode) => {
    setSelectedMode(mode);
  }, []);

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
        showToolbar={settings.showToolbar}
        showStatusBar={settings.showStatusBar}
        onToggleToolbar={() => updateSettings({ showToolbar: !settings.showToolbar })}
        onToggleStatusBar={() => updateSettings({ showStatusBar: !settings.showStatusBar })}
        onShowAbout={handleShowAbout}
        onShowDocs={handleShowDocs}
      />

      {/* Toolbar */}
      {settings.showToolbar && (
        <Toolbar
          connectionStatus={connectionStatus}
          onConnect={handleConnect}
          onDisconnect={disconnect}
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-error/20 border-b border-error/30 text-error text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-error hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Chat View */}
      <ChatView
        messages={messages}
        onSendMessage={(content) => sendMessage(content, selectedModel)}
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
      />

      {/* Status Bar */}
      {settings.showStatusBar && (
        <StatusBar
          connectionStatus={connectionStatus}
          connectionUrl={settings.connectionUrl}
          messageCount={messages.length}
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
    </div>
  );
}

export default App;
