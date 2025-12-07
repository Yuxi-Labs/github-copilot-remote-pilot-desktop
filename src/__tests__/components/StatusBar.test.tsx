import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../components/StatusBar';

describe('StatusBar', () => {
  it('should display connected status', () => {
    render(<StatusBar connected={true} />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it('should display disconnected status', () => {
    render(<StatusBar connected={false} />);
    expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
  });

  it('should show connection indicator', () => {
    const { container, rerender } = render(<StatusBar connected={true} />);
    let indicator = container.querySelector('[data-status-indicator]');
    expect(indicator).toHaveClass('bg-green-500');

    rerender(<StatusBar connected={false} />);
    indicator = container.querySelector('[data-status-indicator]');
    expect(indicator).toHaveClass('bg-red-500');
  });

  it('should display connection info when provided', () => {
    render(
      <StatusBar 
        connected={true} 
        connectionInfo={{ url: 'ws://localhost:3712/ws', latency: 45 }}
      />
    );
    
    expect(screen.getByText(/45ms/i)).toBeInTheDocument();
  });
});
