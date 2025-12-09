import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../components/MessageInput';

describe('MessageInput', () => {
  const defaultProps = {
    onSend: vi.fn(),
    disabled: false,
    models: [{ id: 'gpt-4', name: 'GPT-4' }],
    selectedModel: 'gpt-4',
    onModelChange: vi.fn(),
    modes: [
      { id: 'agent' as const, name: 'Agent', description: 'Chat with AI agent' },
      { id: 'ask' as const, name: 'Ask', description: 'Ask a question' }
    ],
    selectedMode: 'agent' as const,
    onModeChange: vi.fn()
  };

  it('should render textarea', () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.getByPlaceholderText(/ask copilot anything/i)).toBeInTheDocument();
  });

  it('should call onSend when Enter is pressed', () => {
    const onSend = vi.fn();
    render(<MessageInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/ask copilot anything/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Test message', undefined);
  });

  it('should not send empty messages', () => {
    const onSend = vi.fn();
    render(<MessageInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/ask copilot anything/i);
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should allow Shift+Enter for new line', () => {
    const onSend = vi.fn();
    render(<MessageInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/ask copilot anything/i);
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MessageInput {...defaultProps} disabled={true} />);
    const textarea = screen.getByPlaceholderText(/connect to start chatting/i);
    expect(textarea).toBeDisabled();
  });

  it('should clear input after sending', () => {
    const onSend = vi.fn();
    render(<MessageInput {...defaultProps} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/ask copilot anything/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(textarea.value).toBe('');
  });
});
