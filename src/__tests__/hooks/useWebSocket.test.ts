import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../hooks/useWebSocket';

describe('useWebSocket', () => {
  let mockWebSocket: any;

  beforeEach(() => {
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.CONNECTING,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket());

    expect(result.current.connected).toBe(false);
    expect(result.current.messages).toEqual([]);
  });

  it('should connect to WebSocket', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.connect('ws://localhost:3712/ws', 'test-token');
    });

    expect(global.WebSocket).toHaveBeenCalled();
  });

  it('should send messages when connected', async () => {
    mockWebSocket.readyState = WebSocket.OPEN;
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.connect('ws://localhost:3712/ws', 'test-token');
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(mockWebSocket.send).toHaveBeenCalled();
  });

  it('should disconnect properly', () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.connect('ws://localhost:3712/ws', 'test-token');
    });

    act(() => {
      result.current.disconnect();
    });

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const { result } = renderHook(() => useWebSocket());

    act(() => {
      result.current.connect('ws://invalid-url', 'token');
    });

    // Simulate error event
    const errorHandler = mockWebSocket.addEventListener.mock.calls.find(
      (call: any) => call[0] === 'error'
    )?.[1];

    if (errorHandler) {
      act(() => {
        errorHandler(new Event('error'));
      });
    }

    expect(result.current.connected).toBe(false);
  });
});
