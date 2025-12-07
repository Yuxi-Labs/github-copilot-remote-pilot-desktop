import { AuthMessage, AuthResponse, ClientMessage, ControllerMessage } from '../types';
import { generateUUID } from '../utils/uuid';
import { logger } from '../utils/logger';

export type WebSocketEventHandler = {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: ControllerMessage) => void;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  onPairingPending?: (pairingId: string) => void;
  onPairingApproved?: (sessionToken: string) => void;
  onPairingRejected?: (reason: string) => void;
};

export type MessageHandler = (message: ControllerMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string = '';
  private token: string = '';
  private handlers: WebSocketEventHandler = {};
  private messageHandlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private autoReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isAuthenticated: boolean = false;
  private isConnecting: boolean = false;
  private lastPingTime: number = 0;
  private latency: number = 0;
  private latencyHistory: number[] = [];

  constructor() {}

  /**
   * Connect to the controller
   */
  connect(url: string, token: string, handlers: WebSocketEventHandler): void {
    // Don't reconnect if already connected to the same URL
    if (this.ws?.readyState === WebSocket.OPEN && this.url === url && this.isAuthenticated) {
      logger.log('Already connected to:', url);
      return;
    }

    // Don't start new connection if one is in progress
    if (this.isConnecting) {
      logger.log('Connection already in progress...');
      return;
    }

    // Close existing connection if any
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      logger.log('Closing existing connection...');
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
      logger.log('Creating new WebSocket connection to:', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        logger.log('WebSocket connected to:', url);
        this.reconnectAttempts = 0; // Reset on successful connection
        this.sendAuth();
      };

      this.ws.onclose = (event) => {
        logger.log('WebSocket closed:', {
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
          logger.log('Received message:', data);
          
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
    this.reconnectAttempts = 0;
    this.cleanup();
    this.ws?.close(1000, 'User disconnected');
    this.ws = null;
  }

  /**
   * Send a chat message
   */
  sendChat(
    content: string, 
    model?: string, 
    includeContext?: boolean, 
    mode?: 'agent' | 'ask' | 'edit' | 'plan',
    editOptions?: {
      targetFile?: string;
      selection?: {
        startLine: number;
        endLine: number;
        text: string;
      };
    }
  ): string {
    const id = generateUUID();
    logger.log(`[WebSocket] Sending chat with model: "${model}", mode: "${mode || 'agent'}", includeContext: ${includeContext}`);
    const message: ClientMessage = {
      id,
      type: 'chat',
      payload: { 
        message: content, 
        ...(model ? { model } : {}),
        ...(mode ? { mode } : { mode: 'agent' }),
        ...(includeContext ? { includeContext } : {}),
        ...(editOptions?.targetFile ? { targetFile: editOptions.targetFile } : {}),
        ...(editOptions?.selection ? { selection: editOptions.selection } : {}),
      },
    };
    logger.log('[WebSocket] Message payload:', JSON.stringify(message));
    this.send(message);
    return id;
  }

  /**
   * Request workspace context from controller
   */
  requestContext(): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'context',
      payload: {},
    };
    this.send(message);
    return id;
  }

  /**
   * Request file listing from controller
   */
  requestFiles(path?: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'files',
      payload: path ? { path } : {},
    };
    this.send(message);
    return id;
  }

  /**
   * Request file content from controller
   */
  requestFileContent(path: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'readFile',
      payload: { path },
    };
    this.send(message);
    return id;
  }

  /**
   * Write/create a file in the workspace
   */
  writeFile(path: string, content: string, createDirs = true): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'writeFile',
      payload: { path, content, createDirs },
    };
    this.send(message);
    return id;
  }

  /**
   * Apply edits to a file
   */
  editFile(path: string, edits: Array<{ startLine: number; endLine: number; newText: string }>): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'editFile',
      payload: { path, edits },
    };
    this.send(message);
    return id;
  }

  /**
   * Open a file in VS Code editor
   */
  openFile(path: string, line?: number, column?: number, preview = false): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'openFile',
      payload: { path, line, column, preview },
    };
    this.send(message);
    return id;
  }

  /**
   * Execute a command in the VS Code terminal (legacy single-command mode)
   */
  executeTerminal(command: string, cwd?: string, shell?: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'terminal',
      payload: { command, cwd, shell },
    };
    this.send(message);
    return id;
  }

  /**
   * Spawn an interactive shell
   */
  spawnTerminal(terminalId: string, cwd?: string, shell?: string, cols?: number, rows?: number): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'terminalSpawn',
      payload: { terminalId, cwd, shell, cols, rows },
    };
    this.send(message);
    return id;
  }

  /**
   * Send input to an interactive terminal
   */
  sendTerminalInput(terminalId: string, data: string): void {
    const message: ClientMessage = {
      id: generateUUID(),
      type: 'terminalInput',
      payload: { terminalId, data },
    };
    this.send(message);
  }

  /**
   * Resize an interactive terminal
   */
  resizeTerminal(terminalId: string, cols: number, rows: number): void {
    const message: ClientMessage = {
      id: generateUUID(),
      type: 'terminalResize',
      payload: { terminalId, cols, rows },
    };
    this.send(message);
  }

  /**
   * Kill a running terminal
   */
  killTerminal(terminalId: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'terminalKill',
      payload: { terminalId },
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
   * Request available models from the controller
   */
  requestModels(): void {
    logger.log('Sending models request to controller...');
    const message: ClientMessage = {
      id: generateUUID(),
      type: 'models',
      payload: {},
    };
    this.send(message);
  }

  /**
   * Set battery optimization mode
   */
  setBatteryMode(enabled: boolean): void {
    if (!this.isConnected()) return;
    const message: ClientMessage = {
      id: generateUUID(),
      type: 'setBatteryMode',
      payload: { enabled },
    };
    this.send(message);
  }

  /**
   * Set bandwidth optimization mode
   */
  setBandwidthMode(mode: 'high' | 'medium' | 'low'): void {
    if (!this.isConnected()) return;
    const message: ClientMessage = {
      id: generateUUID(),
      type: 'setBandwidthMode',
      payload: { bandwidthMode: mode },
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
  setAutoReconnect(enabled: boolean): void {
    this.autoReconnect = enabled;
    if (!enabled) {
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Get current reconnect attempt count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Manually trigger reconnect (resets attempt counter)
   */
  manualReconnect(): void {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connect(this.url, this.token, this.handlers);
  }

  /**
   * Send pairing request (alternative to manual token auth)
   */
  sendPairingRequest(deviceName: string, deviceId: string): string {
    const id = generateUUID();
    const message: ClientMessage = {
      id,
      type: 'pairRequest',
      payload: {
        deviceName,
        deviceId,
      },
    };
    this.send(message);
    return id;
  }

  // Private methods

  private sendAuth(): void {
    // Controller expects: { type: 'auth', token: '<token>' }
    if (this.ws?.readyState === WebSocket.OPEN) {
      const authMessage: AuthMessage = {
        type: 'auth',
        token: this.token,
      };
      logger.log('Sending auth message:', { type: 'auth', token: this.token.substring(0, 8) + '...' });
      this.ws.send(JSON.stringify(authMessage));
    } else {
      console.warn('WebSocket not open, cannot send auth');
    }
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.isConnecting = false;
    
    if (response.success) {
      logger.log('Authentication successful');
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
    // First, notify all registered message handlers
    for (const handler of this.messageHandlers) {
      handler(message);
    }

    switch (message.type) {
      case 'pairPending':
        logger.log('Pairing pending:', message.payload.pairingId);
        this.handlers.onPairingPending?.(message.payload.pairingId!);
        break;

      case 'pairApproved':
        logger.log('Pairing approved, session token received');
        this.handlers.onPairingApproved?.(message.payload.sessionToken!);
        break;

      case 'pairRejected':
        logger.log('Pairing rejected:', message.payload.reason);
        this.handlers.onPairingRejected?.(message.payload.reason || 'Pairing rejected');
        break;

      case 'pong':
        // Ping response received - calculate latency
        if (this.lastPingTime > 0) {
          const currentLatency = Date.now() - this.lastPingTime;
          this.latency = currentLatency;
          
          // Keep last 10 latency readings for average
          this.latencyHistory.push(currentLatency);
          if (this.latencyHistory.length > 10) {
            this.latencyHistory.shift();
          }
          
          logger.log('Pong received, latency:', currentLatency, 'ms');
        }
        break;

      default:
        this.handlers.onMessage?.(message);
    }
  }

  /**
   * Add a message handler for one-off message handling
   */
  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Remove a message handler
   */
  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  private startPing(): void {
    this.stopPing();
    
    // Send first ping immediately to get initial latency
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.lastPingTime = Date.now();
      const message: ClientMessage = {
        id: generateUUID(),
        type: 'ping',
        payload: {},
      };
      this.send(message);
    }
    
    // Then ping every 5 seconds
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        const message: ClientMessage = {
          id: generateUUID(),
          type: 'ping',
          payload: {},
        };
        this.send(message);
      }
    }, 5000); // Ping every 5 seconds for responsive quality indicator
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.log(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Manual reconnect required.`);
      this.handlers.onError?.(new Event('max_reconnect_attempts'));
      return;
    }

    this.reconnectAttempts++;
    
    // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    logger.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.autoReconnect) {
        this.connect(this.url, this.token, this.handlers);
      }
    }, delay);
  }

  /**
   * Get current latency in milliseconds
   */
  getLatency(): number {
    return this.latency;
  }

  /**
   * Get average latency over recent pings
   */
  getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencyHistory.length);
  }

  /**
   * Get connection quality: 'good' (green), 'fair' (yellow), 'poor' (red)
   */
  getConnectionQuality(): 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.isAuthenticated || this.latencyHistory.length === 0) {
      return 'unknown';
    }

    const avgLatency = this.getAverageLatency();
    
    if (avgLatency < 100) return 'good';
    if (avgLatency < 300) return 'fair';
    return 'poor';
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
