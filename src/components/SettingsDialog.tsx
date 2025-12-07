import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Settings } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
  onReset: () => void;
}

type SettingsTab = 'connection' | 'terminal' | 'appearance';

export function SettingsDialog({ isOpen, onClose, settings, onSave, onReset }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeTab, setActiveTab] = useState<SettingsTab>('connection');
  const [urlError, setUrlError] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  // Sync with external settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setActiveTab('connection');
      setUrlError('');
      setTokenError('');
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

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
    // Validate first
    const urlErr = validateUrl(localSettings.connectionUrl);
    const tokenErr = validateToken(localSettings.authToken);
    
    setUrlError(urlErr);
    setTokenError(tokenErr);
    
    if (urlErr || tokenErr) {
      return;
    }

    setTestStatus('testing');
    setTestMessage('Connecting...');

    try {
      const ws = new WebSocket(localSettings.connectionUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        setTestStatus('error');
        setTestMessage('Connection timeout');
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        // Send auth
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { token: localSettings.authToken }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'auth_result') {
          clearTimeout(timeout);
          if (data.payload.success) {
            setTestStatus('success');
            setTestMessage('Connection successful!');
          } else {
            setTestStatus('error');
            setTestMessage(data.payload.error || 'Authentication failed');
          }
          ws.close();
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setTestStatus('error');
        setTestMessage('Failed to connect');
      };
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Connection failed');
    }
  };

  const handleSave = () => {
    // Validate before saving
    const urlErr = validateUrl(localSettings.connectionUrl);
    const tokenErr = validateToken(localSettings.authToken);
    
    setUrlError(urlErr);
    setTokenError(tokenErr);
    
    if (urlErr || tokenErr) {
      return;
    }

    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'connection', label: 'Connection' },
    { id: 'terminal', label: 'Terminal' },
    { id: 'appearance', label: 'Appearance' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-bg-secondary border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 h-[400px] overflow-y-auto">
          {/* Connection Tab */}
          {activeTab === 'connection' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Controller URL</label>
                <input
                  type="text"
                  value={localSettings.connectionUrl}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, connectionUrl: e.target.value });
                    setUrlError('');
                    setTestStatus('idle');
                  }}
                  placeholder="ws://localhost:3712/ws"
                  title="WebSocket URL from VS Code Controller extension"
                  className={`w-full px-3 py-2 bg-bg-primary border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent ${
                    urlError ? 'border-error' : 'border-border'
                  }`}
                />
                {urlError ? (
                  <p className="text-xs text-error flex items-center gap-1">
                    <AlertCircle size={12} />
                    {urlError}
                  </p>
                ) : (
                  <p className="text-xs text-text-secondary">
                    WebSocket URL for the Controller for GitHub Copilot extension
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Auth Token</label>
                <input
                  type="password"
                  value={localSettings.authToken}
                  onChange={(e) => {
                    setLocalSettings({ ...localSettings, authToken: e.target.value });
                    setTokenError('');
                    setTestStatus('idle');
                  }}
                  placeholder="Enter your auth token"
                  title="Authentication token from VS Code Controller extension"
                  className={`w-full px-3 py-2 bg-bg-primary border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent ${
                    tokenError ? 'border-error' : 'border-border'
                  }`}
                />
                {tokenError ? (
                  <p className="text-xs text-error flex items-center gap-1">
                    <AlertCircle size={12} />
                    {tokenError}
                  </p>
                ) : (
                  <p className="text-xs text-text-secondary">
                    Generated from VS Code via the Controller for GitHub Copilot extension
                  </p>
                )}
              </div>

              {/* Test Connection Button */}
              <div className="pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  title="Verify connection to VS Code controller"
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <p className={`mt-2 text-xs flex items-center gap-1 ${
                    testStatus === 'success' ? 'text-success' : testStatus === 'error' ? 'text-error' : 'text-text-secondary'
                  }`}>
                    {testMessage}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Preferred Model</label>
                <input
                  type="text"
                  value={localSettings.model || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                  placeholder="e.g., claude-opus-4.5-preview"
                  className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-text-secondary">
                  Optional: Specify preferred model ID. Leave blank to use controller's default model.
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="autoReconnect"
                    checked={localSettings.autoReconnect}
                    onChange={(e) => setLocalSettings({ ...localSettings, autoReconnect: e.target.checked })}
                    className="w-4 h-4 accent-accent"
                  />
                  <div>
                    <div className="text-sm font-medium text-text-primary">Auto-reconnect</div>
                    <div className="text-xs text-text-secondary">
                      Automatically reconnect when connection is lost
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Terminal Tab */}
          {activeTab === 'terminal' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Default Shell</label>
                <select
                  value={localSettings.defaultShell}
                  onChange={(e) => setLocalSettings({ ...localSettings, defaultShell: e.target.value })}
                  className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="pwsh">PowerShell Core (pwsh)</option>
                  <option value="powershell">Windows PowerShell</option>
                  <option value="cmd">Command Prompt (cmd)</option>
                  <option value="bash">Bash</option>
                </select>
                <p className="text-xs text-text-secondary">
                  Shell to use when opening terminal sessions
                </p>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div className="text-sm text-text-secondary">
                Appearance settings will be added in future updates.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-tertiary">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-text-primary bg-bg-secondary border border-border hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-accent hover:bg-accent-hover transition-colors"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
