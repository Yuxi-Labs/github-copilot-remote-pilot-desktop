import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageInput } from '../../components/MessageInput';

describe('MessageInput', () => {
  it('should render textarea', () => {
    render(<MessageInput onSend={vi.fn()} disabled={false} />);
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it('should call onSend when Enter is pressed', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: 'Test message' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('Test message');
  });

  it('should not send empty messages', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should allow Shift+Enter for new line', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} />);
    const textarea = screen.getByPlaceholderText(/type a message/i);
    expect(textarea).toBeDisabled();
  });

  it('should clear input after sending', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    expect(textarea.value).toBe('');
  });
});
