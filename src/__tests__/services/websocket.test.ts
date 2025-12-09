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
      removeEventListener: vi.fn(),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null
    };

    globalThis.WebSocket = vi.fn(() => mockWebSocket) as any;
    client = new WebSocketClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connect', () => {
    it('should create WebSocket connection with correct URL', () => {
      const url = 'ws://localhost:3712/ws';
      const token = 'test-token';
      const handlers = {};

      client.connect(url, token, handlers);

      expect(globalThis.WebSocket).toHaveBeenCalledWith(url);
    });

    it('should set up event handlers', () => {
      const url = 'ws://localhost:3712/ws';
      const token = 'test-token';
      const handlers = {
        onOpen: vi.fn(),
        onClose: vi.fn(),
        onError: vi.fn()
      };

      client.connect(url, token, handlers);

      expect(mockWebSocket.onopen).toBeDefined();
      expect(mockWebSocket.onclose).toBeDefined();
      expect(mockWebSocket.onerror).toBeDefined();
    });
  });

  describe('disconnect', () => {
    it('should close WebSocket connection', () => {
      const handlers = {};
      client.connect('ws://localhost:3712/ws', 'token', handlers);
      client.disconnect();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });
  });

  describe('sendChat', () => {
    it('should send chat message when connected', () => {
      mockWebSocket.readyState = WebSocket.OPEN;
      const handlers = {};
      client.connect('ws://localhost:3712/ws', 'token', handlers);

      const messageId = client.sendChat('Hello');

      expect(mockWebSocket.send).toHaveBeenCalled();
      expect(messageId).toBeDefined();
    });
  });
});
