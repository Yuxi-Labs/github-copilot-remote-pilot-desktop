import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '../../services/websocket';

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWebSocket: any;

  beforeEach(() => {
    // Mock WebSocket
    mockWebSocket = {
      send: vi.fn(),
      close: vi.fn(),
      readyState: WebSocket.CONNECTING,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    };

    global.WebSocket = vi.fn(() => mockWebSocket) as any;
    client = new WebSocketClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connect', () => {
    it('should create WebSocket connection with correct URL', () => {
      const url = 'ws://localhost:3712/ws';
      const token = 'test-token';

      client.connect(url, token);

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(url)
      );
    });

    it('should include auth token in connection', () => {
      const url = 'ws://localhost:3712/ws';
      const token = 'test-token';

      client.connect(url, token);

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining(token)
      );
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', () => {
      client.connect('ws://localhost:3712/ws', 'token');
      client.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should send message when connected', () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      client.connect('ws://localhost:3712/ws', 'token');

      const message = { type: 'chat', content: 'Hello' };
      client.send(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should not send message when disconnected', () => {
      mockWebSocket.readyState = WebSocket.CLOSED;
      
      const message = { type: 'chat', content: 'Hello' };
      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });
});
