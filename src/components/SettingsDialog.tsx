import { useState, useEffect } from 'react';
import { 
  Save, RotateCcw, CheckCircle, AlertCircle, Loader2,
  Plug, Terminal, Palette, MessageSquare, FileCode, Layout,
  Zap, Database, Sun, Moon, Monitor, Eye, EyeOff
} from 'lucide-react';
import { Settings, ChatMode, ModelInfo } from '../types';

interface SettingsEditorProps {
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
  onReset: () => void;
  initialTab?: SettingsCategory;
  availableModels?: ModelInfo[];
}

type SettingsCategory = 
  | 'connection' 
  | 'chat' 
  | 'terminal' 
  | 'editor' 
  | 'appearance' 
  | 'layout' 
  | 'system' 
  | 'privacy';

interface CategoryConfig {
  id: SettingsCategory;
  label: string;
  icon: React.ReactNode;
}

const categories: CategoryConfig[] = [
  { id: 'connection', label: 'Connection', icon: <Plug size={18} /> },
  { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
  { id: 'terminal', label: 'Terminal', icon: <Terminal size={18} /> },
  { id: 'editor', label: 'Editor', icon: <FileCode size={18} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'layout', label: 'Layout', icon: <Layout size={18} /> },
  { id: 'system', label: 'System', icon: <Zap size={18} /> },
  { id: 'privacy', label: 'Data', icon: <Database size={18} /> },
];

// Reusable form components
function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wide">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ 
  label, 
  description, 
  children 
}: { 
  label: string; 
  description?: string; 
  children: React.ReactNode 
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {description && (
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  error,
  className = ''
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  type?: 'text' | 'password' | 'number';
  error?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`px-3 py-1.5 bg-bg-primary border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent ${
        error ? 'border-error' : 'border-border'
      } ${className}`}
    />
  );
}

function NumberInput({ 
  value, 
  onChange, 
  min,
  max,
  step = 1,
  className = ''
}: { 
  value: number; 
  onChange: (value: number) => void; 
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={`w-20 px-3 py-1.5 bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent ${className}`}
    />
  );
}

function SelectInput<T extends string>({ 
  value, 
  onChange, 
  options,
  className = ''
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`px-3 py-1.5 bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function Toggle({ 
  checked, 
  onChange 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void 
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-bg-tertiary'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function SettingsEditor({ settings, onSave, onReset, initialTab, availableModels = [] }: SettingsEditorProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialTab as SettingsCategory || 'connection');
  const [urlError, setUrlError] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Sync with external settings when they change externally
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(localSettings) !== JSON.stringify(settings));
  }, [localSettings, settings]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const validateUrl = (url: string): string => {
    if (!url) return 'URL is required';
    try {
      const parsed = new URL(url);
      if (!['ws:', 'wss:'].includes(parsed.protocol)) {
        return 'URL must use ws:// or wss:// protocol';
      }
      return '';
    } catch {
      return 'Invalid URL format';
    }
  };

  const validateToken = (token: string): string => {
    if (!token) return 'Auth token is required';
    if (token.length < 10) return 'Auth token seems too short';
    return '';
  };

  const handleTestConnection = async () => {
    const urlErr = validateUrl(localSettings.connectionUrl);
    const tokenErr = validateToken(localSettings.authToken);
    
    setUrlError(urlErr);
    setTokenError(tokenErr);
    
    if (urlErr || tokenErr) return;

    setTestStatus('testing');
    setTestMessage('Connecting...');

    let ws: WebSocket | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      ws = new WebSocket(localSettings.connectionUrl);
      
      timeoutId = setTimeout(() => {
        if (ws) {
          ws.close();
          ws = null;
        }
        setTestStatus('error');
        setTestMessage('Connection timeout - server did not respond');
      }, localSettings.connectionTimeout);

      ws.onopen = () => {
        setTestMessage('Connected, authenticating...');
        // Auth format: { type: 'auth', token: '<token>' }
        ws?.send(JSON.stringify({
          type: 'auth',
          token: localSettings.authToken
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_result') {
            if (timeoutId) clearTimeout(timeoutId);
            if (data.success) {
              setTestStatus('success');
              setTestMessage('Connection successful! Authentication verified.');
            } else {
              setTestStatus('error');
              setTestMessage(data.error || 'Authentication failed - invalid token');
            }
            ws?.close();
          }
        } catch {
          // Ignore parse errors for non-JSON messages
        }
      };

      ws.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId);
        setTestStatus('error');
        setTestMessage('Failed to connect - check URL and ensure controller is running');
        ws = null;
      };

      ws.onclose = (event) => {
        if (testStatus === 'testing') {
          if (timeoutId) clearTimeout(timeoutId);
          if (event.code !== 1000) {
            setTestStatus('error');
            setTestMessage(`Connection closed unexpectedly (code: ${event.code})`);
          }
        }
      };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      setTestStatus('error');
      setTestMessage(`Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSave = () => {
    const urlErr = validateUrl(localSettings.connectionUrl);
    const tokenErr = validateToken(localSettings.authToken);
    
    setUrlError(urlErr);
    setTokenError(tokenErr);
    
    if (urlErr || tokenErr) {
      setActiveCategory('connection');
      return;
    }

    onSave(localSettings);
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      onReset();
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-border bg-bg-secondary shrink-0 overflow-y-auto">
          <nav className="py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-accent/10 text-accent border-l-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover border-l-2 border-transparent'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto p-6">
            {/* Connection Settings */}
            {activeCategory === 'connection' && (
              <div>
                <SettingGroup title="Server Connection">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Controller URL</label>
                    <TextInput
                      value={localSettings.connectionUrl}
                      onChange={(v) => { updateSetting('connectionUrl', v); setUrlError(''); setTestStatus('idle'); }}
                      placeholder="ws://localhost:3712/ws"
                      error={urlError}
                      className="w-full"
                    />
                    {urlError ? (
                      <p className="text-xs text-error flex items-center gap-1">
                        <AlertCircle size={12} /> {urlError}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary">WebSocket URL for the Controller extension</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Auth Token</label>
                    <div className="relative">
                      <TextInput
                        type={showToken ? 'text' : 'password'}
                        value={localSettings.authToken}
                        onChange={(v) => { updateSetting('authToken', v); setTokenError(''); setTestStatus('idle'); }}
                        placeholder="Enter your auth token"
                        error={tokenError}
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary"
                        title={showToken ? 'Hide token' : 'Show token'}
                      >
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {tokenError ? (
                      <p className="text-xs text-error flex items-center gap-1">
                        <AlertCircle size={12} /> {tokenError}
                      </p>
                    ) : (
                      <p className="text-xs text-text-secondary">Generated from VS Code Controller extension</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
                    >
                      {testStatus === 'testing' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : testStatus === 'success' ? (
                        <CheckCircle size={16} />
                      ) : testStatus === 'error' ? (
                        <AlertCircle size={16} />
                      ) : null}
                      <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                    {testMessage && (
                      <p className={`mt-2 text-xs ${
                        testStatus === 'success' ? 'text-success' : testStatus === 'error' ? 'text-error' : 'text-text-secondary'
                      }`}>
                        {testMessage}
                      </p>
                    )}
                  </div>
                </SettingGroup>

                <SettingGroup title="Reconnection">
                  <SettingRow label="Auto-reconnect" description="Automatically reconnect when connection is lost">
                    <Toggle
                      checked={localSettings.autoReconnect}
                      onChange={(v) => updateSetting('autoReconnect', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Max reconnect attempts" description="Maximum number of reconnection attempts">
                    <NumberInput
                      value={localSettings.maxReconnectAttempts}
                      onChange={(v) => updateSetting('maxReconnectAttempts', v)}
                      min={1}
                      max={50}
                    />
                  </SettingRow>

                  <SettingRow label="Connection timeout (ms)" description="Timeout for connection attempts">
                    <NumberInput
                      value={localSettings.connectionTimeout}
                      onChange={(v) => updateSetting('connectionTimeout', v)}
                      min={1000}
                      max={60000}
                      step={1000}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Chat Settings */}
            {activeCategory === 'chat' && (
              <div>
                <SettingGroup title="Model & Mode">
                  <SettingRow label="Preferred Model" description={availableModels.length > 0 ? "Select from available models" : "Connect to controller to see available models"}>
                    <select
                      value={localSettings.model || ''}
                      onChange={(e) => updateSetting('model', e.target.value)}
                      className="px-3 py-1.5 bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent min-w-[200px]"
                    >
                      <option value="">Use default</option>
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name || model.id}
                          {model.isDefault ? ' (default)' : ''}
                        </option>
                      ))}
                    </select>
                  </SettingRow>

                  <SettingRow label="Default Mode" description="Default chat mode when starting new conversations">
                    <SelectInput<ChatMode>
                      value={localSettings.defaultMode}
                      onChange={(v) => updateSetting('defaultMode', v)}
                      options={[
                        { value: 'agent', label: 'Agent' },
                        { value: 'ask', label: 'Ask' },
                        { value: 'edit', label: 'Edit' },
                        { value: 'plan', label: 'Plan' },
                      ]}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Behavior">
                  <SettingRow label="Include context by default" description="Automatically include workspace context in messages">
                    <Toggle
                      checked={localSettings.includeContextByDefault}
                      onChange={(v) => updateSetting('includeContextByDefault', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Send on Enter" description="Press Enter to send (Shift+Enter for new line)">
                    <Toggle
                      checked={localSettings.sendOnEnter}
                      onChange={(v) => updateSetting('sendOnEnter', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Show streaming indicator" description="Show typing indicator during AI response">
                    <Toggle
                      checked={localSettings.showStreamingIndicator}
                      onChange={(v) => updateSetting('showStreamingIndicator', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Enable Markdown rendering" description="Render markdown formatting in responses">
                    <Toggle
                      checked={localSettings.enableMarkdownRendering}
                      onChange={(v) => updateSetting('enableMarkdownRendering', v)}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="History">
                  <SettingRow label="Auto-save chat history" description="Automatically save conversations">
                    <Toggle
                      checked={localSettings.autoSaveHistory}
                      onChange={(v) => updateSetting('autoSaveHistory', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Maximum history size" description="Maximum messages to keep in history">
                    <NumberInput
                      value={localSettings.maxHistorySize}
                      onChange={(v) => updateSetting('maxHistorySize', v)}
                      min={100}
                      max={10000}
                      step={100}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Terminal Settings */}
            {activeCategory === 'terminal' && (
              <div>
                <SettingGroup title="Shell">
                  <SettingRow label="Default Shell" description="Shell to use when opening new terminals">
                    <SelectInput
                      value={localSettings.defaultShell}
                      onChange={(v) => updateSetting('defaultShell', v)}
                      options={[
                        { value: 'pwsh', label: 'PowerShell Core (pwsh)' },
                        { value: 'powershell', label: 'Windows PowerShell' },
                        { value: 'cmd', label: 'Command Prompt' },
                        { value: 'bash', label: 'Bash' },
                        { value: 'zsh', label: 'Zsh' },
                      ]}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Font">
                  <SettingRow label="Font Size" description="Terminal font size in pixels">
                    <NumberInput
                      value={localSettings.terminalFontSize}
                      onChange={(v) => updateSetting('terminalFontSize', v)}
                      min={10}
                      max={24}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Font Family</label>
                    <TextInput
                      value={localSettings.terminalFontFamily}
                      onChange={(v) => updateSetting('terminalFontFamily', v)}
                      className="w-full"
                    />
                    <p className="text-xs text-text-secondary">Comma-separated list of font families</p>
                  </div>
                </SettingGroup>

                <SettingGroup title="Cursor">
                  <SettingRow label="Cursor Style" description="Terminal cursor appearance">
                    <SelectInput<'block' | 'underline' | 'bar'>
                      value={localSettings.terminalCursorStyle}
                      onChange={(v) => updateSetting('terminalCursorStyle', v)}
                      options={[
                        { value: 'block', label: 'Block' },
                        { value: 'underline', label: 'Underline' },
                        { value: 'bar', label: 'Bar' },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow label="Cursor Blink" description="Enable cursor blinking">
                    <Toggle
                      checked={localSettings.terminalCursorBlink}
                      onChange={(v) => updateSetting('terminalCursorBlink', v)}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Behavior">
                  <SettingRow label="Scrollback Lines" description="Lines of scrollback history">
                    <NumberInput
                      value={localSettings.terminalScrollback}
                      onChange={(v) => updateSetting('terminalScrollback', v)}
                      min={1000}
                      max={100000}
                      step={1000}
                    />
                  </SettingRow>

                  <SettingRow label="Copy on Select" description="Automatically copy selected text">
                    <Toggle
                      checked={localSettings.copyOnSelect}
                      onChange={(v) => updateSetting('copyOnSelect', v)}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Editor Settings */}
            {activeCategory === 'editor' && (
              <div>
                <SettingGroup title="Font">
                  <SettingRow label="Font Size" description="Editor font size in pixels">
                    <NumberInput
                      value={localSettings.editorFontSize}
                      onChange={(v) => updateSetting('editorFontSize', v)}
                      min={10}
                      max={24}
                    />
                  </SettingRow>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-primary">Font Family</label>
                    <TextInput
                      value={localSettings.editorFontFamily}
                      onChange={(v) => updateSetting('editorFontFamily', v)}
                      className="w-full"
                    />
                    <p className="text-xs text-text-secondary">Comma-separated list of font families</p>
                  </div>
                </SettingGroup>

                <SettingGroup title="Display">
                  <SettingRow label="Show Line Numbers" description="Display line numbers in editor">
                    <Toggle
                      checked={localSettings.editorLineNumbers}
                      onChange={(v) => updateSetting('editorLineNumbers', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Word Wrap" description="Wrap long lines to fit viewport">
                    <Toggle
                      checked={localSettings.editorWordWrap}
                      onChange={(v) => updateSetting('editorWordWrap', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Tab Size" description="Spaces per tab indentation">
                    <NumberInput
                      value={localSettings.editorTabSize}
                      onChange={(v) => updateSetting('editorTabSize', v)}
                      min={1}
                      max={8}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Appearance Settings */}
            {activeCategory === 'appearance' && (
              <div>
                <SettingGroup title="Theme">
                  <div className="flex gap-3">
                    {[
                      { value: 'light' as const, label: 'Light', icon: <Sun size={20} /> },
                      { value: 'dark' as const, label: 'Dark', icon: <Moon size={20} /> },
                      { value: 'system' as const, label: 'System', icon: <Monitor size={20} /> },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateSetting('theme', opt.value)}
                        className={`flex-1 flex flex-col items-center gap-2 p-4 border rounded transition-colors ${
                          localSettings.theme === opt.value
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-bg-primary text-text-secondary hover:text-text-primary hover:border-text-secondary'
                        }`}
                      >
                        {opt.icon}
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </SettingGroup>

                <SettingGroup title="Font">
                  <SettingRow label="Base Font Size" description="Default UI font size in pixels">
                    <NumberInput
                      value={localSettings.fontSize}
                      onChange={(v) => updateSetting('fontSize', v)}
                      min={10}
                      max={20}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Effects">
                  <SettingRow label="Enable Animations" description="Enable UI animations and transitions">
                    <Toggle
                      checked={localSettings.enableAnimations}
                      onChange={(v) => updateSetting('enableAnimations', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Compact Mode" description="Reduce spacing for denser UI">
                    <Toggle
                      checked={localSettings.compactMode}
                      onChange={(v) => updateSetting('compactMode', v)}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Layout Settings */}
            {activeCategory === 'layout' && (
              <div>
                <SettingGroup title="Panels">
                  <SettingRow label="Show Toolbar" description="Display the main toolbar">
                    <Toggle
                      checked={localSettings.showToolbar}
                      onChange={(v) => updateSetting('showToolbar', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Show Status Bar" description="Display the status bar at bottom">
                    <Toggle
                      checked={localSettings.showStatusBar}
                      onChange={(v) => updateSetting('showStatusBar', v)}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Default Sizes">
                  <SettingRow label="Explorer Width" description="Default file explorer width (px)">
                    <NumberInput
                      value={localSettings.defaultExplorerWidth}
                      onChange={(v) => updateSetting('defaultExplorerWidth', v)}
                      min={150}
                      max={600}
                      step={10}
                    />
                  </SettingRow>

                  <SettingRow label="Chat Width" description="Default chat panel width (px)">
                    <NumberInput
                      value={localSettings.defaultChatWidth}
                      onChange={(v) => updateSetting('defaultChatWidth', v)}
                      min={300}
                      max={800}
                      step={10}
                    />
                  </SettingRow>

                  <SettingRow label="Terminal Height" description="Default terminal height (px)">
                    <NumberInput
                      value={localSettings.defaultTerminalHeight}
                      onChange={(v) => updateSetting('defaultTerminalHeight', v)}
                      min={100}
                      max={600}
                      step={10}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Window">
                  <SettingRow label="Remember Window State" description="Persist window size and position">
                    <Toggle
                      checked={localSettings.rememberWindowState}
                      onChange={(v) => updateSetting('rememberWindowState', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Confirm on Exit" description="Ask before closing the application">
                    <Toggle
                      checked={localSettings.confirmOnExit}
                      onChange={(v) => updateSetting('confirmOnExit', v)}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* System Settings */}
            {activeCategory === 'system' && (
              <div>
                <SettingGroup title="Power Management">
                  <SettingRow label="Battery Optimization" description="Reduce resource usage when on battery">
                    <Toggle
                      checked={localSettings.batteryOptimization}
                      onChange={(v) => updateSetting('batteryOptimization', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Low Battery Threshold (%)" description="Threshold for low battery mode">
                    <NumberInput
                      value={localSettings.lowBatteryThreshold}
                      onChange={(v) => updateSetting('lowBatteryThreshold', v)}
                      min={5}
                      max={50}
                    />
                  </SettingRow>

                  <SettingRow label="Bandwidth Optimization" description="Optimize for network conditions">
                    <Toggle
                      checked={localSettings.bandwidthOptimization}
                      onChange={(v) => updateSetting('bandwidthOptimization', v)}
                    />
                  </SettingRow>
                </SettingGroup>

                <SettingGroup title="Logging">
                  <SettingRow label="Log Level" description="Minimum log level to record">
                    <SelectInput<'debug' | 'info' | 'warn' | 'error'>
                      value={localSettings.logLevel}
                      onChange={(v) => updateSetting('logLevel', v)}
                      options={[
                        { value: 'debug', label: 'Debug' },
                        { value: 'info', label: 'Info' },
                        { value: 'warn', label: 'Warning' },
                        { value: 'error', label: 'Error' },
                      ]}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}

            {/* Data Settings */}
            {activeCategory === 'privacy' && (
              <div>
                <SettingGroup title="History">
                  <SettingRow label="Clear History on Exit" description="Delete chat history when closing app">
                    <Toggle
                      checked={localSettings.clearHistoryOnExit}
                      onChange={(v) => updateSetting('clearHistoryOnExit', v)}
                    />
                  </SettingRow>

                  <SettingRow label="Export Format" description="Default format for exporting chats">
                    <SelectInput<'markdown' | 'json' | 'text'>
                      value={localSettings.exportFormat}
                      onChange={(v) => updateSetting('exportFormat', v)}
                      options={[
                        { value: 'markdown', label: 'Markdown' },
                        { value: 'json', label: 'JSON' },
                        { value: 'text', label: 'Plain Text' },
                      ]}
                    />
                  </SettingRow>
                </SettingGroup>
              </div>
            )}
          </div>
        </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-secondary shrink-0">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          <RotateCcw size={14} />
          <span>Reset to Defaults</span>
        </button>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-text-secondary">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
