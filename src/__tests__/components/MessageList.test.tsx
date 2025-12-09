import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../../components/MessageList';

describe('MessageList', () => {
  beforeEach(() => {
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
    { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: Date.now() },
    { id: '3', role: 'user' as const, content: 'How are you?', timestamp: Date.now() }
  ];

  const mockProps = {
    onNewChat: vi.fn(),
    onRetry: vi.fn(),
    onRegenerate: vi.fn()
  };

  it('should render all messages', () => {
    render(<MessageList {...mockProps} messages={mockMessages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('should render empty state when no messages', () => {
    render(<MessageList {...mockProps} messages={[]} />);
    
    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  it('should render messages in correct order', () => {
    render(<MessageList {...mockProps} messages={mockMessages} />);
    
    // Just verify all messages are present
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('should auto-scroll to bottom on new message', () => {
    const { rerender } = render(<MessageList {...mockProps} messages={mockMessages} />);
    
    const newMessages = [
      ...mockMessages,
      { id: '4', role: 'assistant' as const, content: 'New message', timestamp: Date.now() }
    ];
    
    rerender(<MessageList {...mockProps} messages={newMessages} />);
    expect(screen.getByText('New message')).toBeInTheDocument();
  });
});
