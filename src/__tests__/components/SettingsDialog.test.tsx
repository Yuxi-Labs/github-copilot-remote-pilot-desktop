import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDialog } from '../../components/SettingsDialog';

describe('SettingsDialog', () => {
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
    model: 'gpt-4'
  };

  it('should not render when closed', () => {
    render(
      <SettingsDialog
        isOpen={false}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.queryByText(/settings/i)).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
      />
    );

    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('should display current settings', () => {
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
        onReset={vi.fn()}
      />
    );

    // Check that inputs display the current values
    const urlInput = screen.getByPlaceholderText(/ws:\/\/localhost/i);
    expect(urlInput).toHaveValue('ws://localhost:3712/ws');
    
    const tokenInput = screen.getByPlaceholderText(/enter your auth token/i);
    expect(tokenInput).toHaveValue('test-token');
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={onClose}
        onReset={vi.fn()}
      />
    );

    // Find close button (X icon)
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('svg'));
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should call onSave with updated settings', () => {
    const onSave = vi.fn();
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={onSave}
        onClose={vi.fn()}
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
