import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Message } from '../../components/Message';

describe('Message', () => {
  it('should render user message', () => {
    const message = {
      id: '1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: Date.now()
    };

    render(<Message message={message} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    const message = {
      id: '2',
      role: 'assistant' as const,
      content: 'Hi there!',
      timestamp: Date.now()
    };

    render(<Message message={message} />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should display markdown content', () => {
    const message = {
      id: '3',
      role: 'assistant' as const,
      content: '**Bold text**',
      timestamp: Date.now()
    };

    render(<Message message={message} />);
    const boldElement = screen.getByText('Bold text');
    expect(boldElement.tagName).toBe('STRONG');
  });
});
