import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../components/StatusBar';

describe('StatusBar', () => {
  it('should display connected status', () => {
    render(
      <StatusBar 
        connectionStatus="connected"
        connectionUrl="ws://localhost:3712/ws"
        messageCount={0}
      />
    );
    expect(screen.getByTitle(/Status: connected/i)).toBeInTheDocument();
  });

  it('should display disconnected status', () => {
    render(
      <StatusBar 
        connectionStatus="disconnected"
        connectionUrl=""
        messageCount={0}
      />
    );
    expect(screen.getByTitle(/Status: disconnected/i)).toBeInTheDocument();
  });

  it('should display message count', () => {
    render(
      <StatusBar 
        connectionStatus="connected"
        connectionUrl="ws://localhost:3712/ws"
        messageCount={5}
      />
    );
    expect(screen.getByText(/5 messages/i)).toBeInTheDocument();
  });

  it('should display latency when provided', () => {
    render(
      <StatusBar 
        connectionStatus="connected"
        connectionUrl="ws://localhost:3712/ws"
        messageCount={0}
        latency={45}
      />
    );
    expect(screen.getByText(/45ms/i)).toBeInTheDocument();
  });
});
