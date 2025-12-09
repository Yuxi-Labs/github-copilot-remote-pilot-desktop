import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar } from '../../components/StatusBar';

describe('StatusBar', () => {
  const defaultProps = {
    connectionStatus: 'connected' as const,
    connectionUrl: 'ws://localhost:3712/ws',
    messageCount: 0,
  };

  it('should display connected status', () => {
    render(<StatusBar {...defaultProps} />);
    // The status bar shows "Connected" text in the connected state
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('should display disconnected status', () => {
    render(
      <StatusBar 
        connectionStatus="disconnected"
        connectionUrl=""
        messageCount={0}
      />
    );
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should display message count', () => {
    render(<StatusBar {...defaultProps} messageCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display latency when provided', () => {
    render(<StatusBar {...defaultProps} latency={45} connectionQuality="good" />);
    expect(screen.getByText('45ms')).toBeInTheDocument();
  });

  it('should display streaming status when streaming', () => {
    render(
      <StatusBar 
        {...defaultProps}
        isStreaming={true}
        streamingStatus="Generating response..."
      />
    );
    expect(screen.getByText('Generating response...')).toBeInTheDocument();
  });

  it('should display selected model', () => {
    render(<StatusBar {...defaultProps} selectedModel="gpt-4" />);
    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  it('should display pending changes count', () => {
    render(<StatusBar {...defaultProps} pendingChangesCount={3} />);
    expect(screen.getByText(/3 pending/)).toBeInTheDocument();
  });

  it('should call onOpenPendingChanges when pending changes clicked', () => {
    const onOpenPendingChanges = vi.fn();
    render(
      <StatusBar 
        {...defaultProps} 
        pendingChangesCount={3}
        onOpenPendingChanges={onOpenPendingChanges}
      />
    );
    const pendingButton = screen.getByTitle('3 pending changes - click to review');
    fireEvent.click(pendingButton);
    expect(onOpenPendingChanges).toHaveBeenCalledTimes(1);
  });

  it('should display active branch', () => {
    render(<StatusBar {...defaultProps} activeBranch="main" />);
    expect(screen.getByText('main')).toBeInTheDocument();
  });
});
