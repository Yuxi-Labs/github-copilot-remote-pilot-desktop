import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDialog } from '../../components/SettingsDialog';

describe('SettingsDialog', () => {
  const defaultSettings = {
    theme: 'dark' as const,
    fontSize: 14,
    autoReconnect: true,
    soundEnabled: false
  };

  it('should not render when closed', () => {
    render(
      <SettingsDialog
        isOpen={false}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={vi.fn()}
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
      />
    );

    expect(screen.getByLabelText(/theme/i)).toHaveValue('dark');
    expect(screen.getByLabelText(/font size/i)).toHaveValue(14);
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={vi.fn()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should call onSave with updated settings', () => {
    const onSave = vi.fn();
    render(
      <SettingsDialog
        isOpen={true}
        settings={defaultSettings}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );

    const themeSelect = screen.getByLabelText(/theme/i);
    fireEvent.change(themeSelect, { target: { value: 'light' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ theme: 'light' })
    );
  });
});
