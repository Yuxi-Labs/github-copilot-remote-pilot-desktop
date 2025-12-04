// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Message roles
export type MessageRole = 'user' | 'assistant';

// Chat mode (similar to VS Code Copilot)
export type ChatMode = 'agent' | 'ask' | 'edit' | 'plan';

// Mode information
export interface ModeInfo {
  id: ChatMode;
  name: string;
  description: string;
}

// Model information
export interface ModelInfo {
  id: string;
  name: string;
  vendor?: string;
  version?: string;
  isDefault?: boolean;
}

// Chat message
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// Auth message (special format - token at root level)
export interface AuthMessage {
  type: 'auth';
  token: string;
}

// Client → Controller messages
export interface ClientMessage {
  id: string;
  type: 'chat' | 'cancel' | 'ping' | 'models';
  payload: {
    message?: string;
    requestId?: string;
    model?: string;
  };
}

// Auth response from controller
export interface AuthResponse {
  type: 'auth_result';
  success: boolean;
  error?: string;
}

// Controller → Client messages
export interface ControllerMessage {
  id: string;
  type: 'chunk' | 'done' | 'error' | 'pong' | 'status' | 'models';
  payload: {
    content?: string;
    fullContent?: string;
    error?: string;
    message?: string;
    code?: string;
    timestamp?: number;
    models?: ModelInfo[];
  };
}

// App settings
export interface Settings {
  connectionUrl: string;
  authToken: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  showToolbar: boolean;
  showStatusBar: boolean;
  model?: string;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  connectionUrl: 'ws://localhost:3712/ws',
  authToken: '',
  autoReconnect: true,
  reconnectInterval: 5000,
  theme: 'system',
  fontSize: 14,
  showToolbar: true,
  showStatusBar: true,
  model: '',
};

// App state
export interface AppState {
  connectionStatus: ConnectionStatus;
  messages: Message[];
  currentStreamingId: string | null;
  settings: Settings;
  error: string | null;
}
