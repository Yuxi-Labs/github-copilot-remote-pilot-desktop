import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsEditor } from '../../components/SettingsDialog';

describe('SettingsEditor', () => {
  const defaultSettings = {
    connectionUrl: 'ws://localhost:3712/ws',
    authToken: 'test-token',
    theme: 'dark' as const,
    fontSize: 14,
    autoReconnect: true,
    reconnectInterval: 5000,
    showToolbar: true,
    showStatusBar: true,
    defaultShell: 'pwsh',
    model: 'gpt-4',
    maxReconnectAttempts: 10,
    connectionTimeout: 10000,
    defaultMode: 'agent' as const,
    includeContextByDefault: true,
    sendOnEnter: true,
    showStreamingIndicator: true,
    enableMarkdownRendering: true,
    maxHistorySize: 1000,
    autoSaveHistory: true,
    terminalFontSize: 14,
    terminalFontFamily: 'monospace',
    terminalCursorBlink: true,
    terminalCursorStyle: 'block' as const,
    terminalScrollback: 10000,
    copyOnSelect: false,
    editorFontSize: 15,
    editorFontFamily: 'monospace',
    editorTabSize: 2,
    editorLineNumbers: true,
    editorWordWrap: false,
    enableAnimations: true,
    compactMode: false,
    rememberWindowState: true,
    defaultExplorerWidth: 220,
    defaultTerminalHeight: 200,
    defaultChatWidth: 420,
    confirmOnExit: false,
    batteryOptimization: true,
    bandwidthOptimization: true,
    lowBatteryThreshold: 20,
    logLevel: 'info' as const,
    clearHistoryOnExit: false,
    exportFormat: 'markdown' as const,
  };

  it('should render settings editor', () => {
    render(
      <SettingsEditor
        settings={defaultSettings}
        onSave={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // Check that sidebar categories are visible
    expect(screen.getByText('Connection')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
  });

  it('should display current settings', () => {
    render(
      <SettingsEditor
        settings={defaultSettings}
        onSave={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // Check that inputs display the current values
    const urlInput = screen.getByPlaceholderText(/ws:\/\/localhost/i);
    expect(urlInput).toHaveValue('ws://localhost:3712/ws');
    
    const tokenInput = screen.getByPlaceholderText(/enter your auth token/i);
    expect(tokenInput).toHaveValue('test-token');
  });

  it('should switch between categories', () => {
    render(
      <SettingsEditor
        settings={defaultSettings}
        onSave={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // Click on Terminal category
    fireEvent.click(screen.getByText('Terminal'));
    
    // Should show terminal settings
    expect(screen.getByText('Default Shell')).toBeInTheDocument();
  });

  it('should call onSave with updated settings', () => {
    const onSave = vi.fn();
    render(
      <SettingsEditor
        settings={defaultSettings}
        onSave={onSave}
        onReset={vi.fn()}
      />
    );

    const urlInput = screen.getByPlaceholderText(/ws:\/\/localhost/i);
    fireEvent.change(urlInput, { target: { value: 'ws://newurl:3712/ws' } });

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ connectionUrl: 'ws://newurl:3712/ws' })
    );
  });
});
