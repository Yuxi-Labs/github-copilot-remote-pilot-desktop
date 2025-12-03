import { AuthMessage, AuthResponse, ClientMessage, ControllerMessage } from '../types';
import { generateUUID } from '../utils/uuid';

export type WebSocketEventHandler = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: ControllerMessage) => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
};

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private handlers: WebSocketEventHandler = {};
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private autoReconnect: boolean = true;
  private reconnectInterval: number = 5000;
  private isAuthenticated: boolean = false;
  private isConnecting: boolean = false;

  constructor() {}

  /**
   * Connect to the controller
   */
  connect(url: string, token: string, handlers: WebSocketEventHandler): void {
    // Don't reconnect if already connected to the same URL
    if (this.ws?.readyState === WebSocket.OPEN && this.url === url && this.isAuthenticated) {
      console.log('Already connected to:', url);
      return;
    }

    // Don't start new connection if one is in progress
    if (this.isConnecting) {
      console.log('Connection already in progress...');
      return;
    }

    // Close existing connection if any
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing connection...');
      this.ws.close(1000, 'Reconnecting');
      this.ws = null;
    }

    this.url = url;
    this.token = token;
    this.handlers = handlers;
    this.isAuthenticated = false;
    this.isConnecting = true;

    this.cleanup();

    try {
      console.log('Creating new WebSocket connection to:', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected to:', url);
        this.sendAuth();
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        this.stopPing();
        this.isAuthenticated = false;
        this.isConnecting = false;
        this.handlers.onClose?.(event);

        // Only auto-reconnect on abnormal close (not 1000 = normal, not 1001 = going away)
        if (this.autoReconnect && event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.handlers.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);
          
          // Handle auth response separately
          if (data.type === 'auth_result') {
            this.handleAuthResponse(data as AuthResponse);
          } else {
            this.handleMessage(data as ControllerMessage);
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.handlers.onError?.(new Event('connection_failed'));
    }
  }

  /**
   * Disconnect from the controller
   */
  disconnect(): void {
    this.autoReconnect = false;
    this.cleanup();
    this.ws?.close(1000, 'User disconnected');
    this.ws = null;
  }

  /**
   * Send a chat message
   */
  sendChat(content: string, model?: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'chat',
      payload: { message: content, ...(model ? { model } : {}) },
    };
    this.send(message);
    return id;
  }

  /**
   * Cancel current streaming response
   */
  sendCancel(messageId: string): void {
    const message: ClientMessage = {
      id: messageId,
      type: 'cancel',
      payload: {},
    };
    this.send(message);
  }

  /**
   * Check if connected and authenticated
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Set auto-reconnect settings
   */
  setAutoReconnect(enabled: boolean, interval: number = 5000): void {
    this.autoReconnect = enabled;
    this.reconnectInterval = interval;
  }

  // Private methods

  private sendAuth(): void {
    // Controller expects: { type: 'auth', token: '<token>' }
    if (this.ws?.readyState === WebSocket.OPEN) {
      const authMessage: AuthMessage = {
        type: 'auth',
        token: this.token,
      };
      console.log('Sending auth message:', { type: 'auth', token: this.token.substring(0, 8) + '...' });
      this.ws.send(JSON.stringify(authMessage));
    } else {
      console.warn('WebSocket not open, cannot send auth');
    }
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.isConnecting = false;
    
    if (response.success) {
      console.log('Authentication successful');
      this.isAuthenticated = true;
      this.startPing();
      this.handlers.onOpen?.();
      this.handlers.onAuthSuccess?.();
    } else {
      console.error('Authentication failed:', response.error);
      this.isAuthenticated = false;
      this.handlers.onAuthError?.(response.error || 'Authentication failed');
      this.disconnect();
    }
  }

  private send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not open, cannot send message');
    }
  }

  private handleMessage(message: ControllerMessage): void {
    switch (message.type) {
      case 'pong':
        // Ping response received
        console.log('Pong received');
        break;

      default:
        this.handlers.onMessage?.(message);
    }
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const message: ClientMessage = {
          id: generateUUID(),
          type: 'ping',
          payload: {},
        };
        this.send(message);
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    console.log(`Reconnecting in ${this.reconnectInterval}ms...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.autoReconnect) {
        this.connect(this.url, this.token, this.handlers);
      }
    }, this.reconnectInterval);
  }

  private cleanup(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
