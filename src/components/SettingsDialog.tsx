import { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { Settings } from '../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Partial<Settings>) => void;
  onReset: () => void;
}

export function SettingsDialog({ isOpen, onClose, settings, onSave, onReset }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync with external settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-bg-secondary border border-border shadow-xl">
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

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Connection Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-text-primary">Connection</h3>

            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Controller URL</label>
              <input
                type="text"
                value={localSettings.connectionUrl}
                onChange={(e) => setLocalSettings({ ...localSettings, connectionUrl: e.target.value })}
                placeholder="ws://localhost:3712/ws"
                className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Auth Token</label>
              <input
                type="password"
                value={localSettings.authToken}
                onChange={(e) => setLocalSettings({ ...localSettings, authToken: e.target.value })}
                placeholder="Enter your auth token"
                className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Preferred Model (optional)</label>
              <input
                type="text"
                value={localSettings.model || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
                placeholder="e.g., claude-opus-4.5-preview or leave blank to use controller default"
                className="w-full px-3 py-2 bg-bg-primary border border-border text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-text-secondary">
                If set, this model id is sent with each message; the controller must honor it.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoReconnect"
                checked={localSettings.autoReconnect}
                onChange={(e) => setLocalSettings({ ...localSettings, autoReconnect: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="autoReconnect" className="text-sm text-text-primary">
                Auto-reconnect on disconnect
              </label>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-sm font-medium text-text-primary">Appearance</h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showToolbar"
                checked={localSettings.showToolbar}
                onChange={(e) => setLocalSettings({ ...localSettings, showToolbar: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="showToolbar" className="text-sm text-text-primary">
                Show toolbar
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showStatusBar"
                checked={localSettings.showStatusBar}
                onChange={(e) => setLocalSettings({ ...localSettings, showStatusBar: e.target.checked })}
                className="w-4 h-4 accent-accent"
              />
              <label htmlFor="showStatusBar" className="text-sm text-text-primary">
                Show status bar
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-text-primary bg-bg-tertiary border border-border hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-accent hover:bg-accent-hover transition-colors"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
