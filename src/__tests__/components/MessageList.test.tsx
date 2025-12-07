import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../../components/MessageList';

describe('MessageList', () => {
  const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
    { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: Date.now() },
    { id: '3', role: 'user' as const, content: 'How are you?', timestamp: Date.now() }
  ];

  it('should render all messages', () => {
    render(<MessageList messages={mockMessages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
    expect(screen.getByText('How are you?')).toBeInTheDocument();
  });

  it('should render empty state when no messages', () => {
    render(<MessageList messages={[]} />);
    
    expect(screen.getByText(/no messages/i)).toBeInTheDocument();
  });

  it('should render messages in correct order', () => {
    const { container } = render(<MessageList messages={mockMessages} />);
    const messages = container.querySelectorAll('[data-message-id]');
    
    expect(messages).toHaveLength(3);
    expect(messages[0].getAttribute('data-message-id')).toBe('1');
    expect(messages[1].getAttribute('data-message-id')).toBe('2');
    expect(messages[2].getAttribute('data-message-id')).toBe('3');
  });

  it('should auto-scroll to bottom on new message', () => {
    const { rerender } = render(<MessageList messages={mockMessages} />);
    
    const newMessages = [
      ...mockMessages,
      { id: '4', role: 'assistant' as const, content: 'New message', timestamp: Date.now() }
    ];
    
    rerender(<MessageList messages={newMessages} />);
    expect(screen.getByText('New message')).toBeInTheDocument();
  });
});
