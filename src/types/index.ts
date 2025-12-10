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
  hasError?: boolean;
  errorMessage?: string;
  retryCount?: number;
  toolCalls?: ToolCall[];
}

// Tool call for agent mode feedback
export interface ToolCall {
  id: string;
  type: 'file_read' | 'file_write' | 'file_edit' | 'terminal' | 'search' | 'thinking';
  status: 'pending' | 'running' | 'success' | 'error';
  description: string;
  details?: string;
  timestamp: number;
}

// Pending file change awaiting approval
export interface PendingChange {
  id: string;
  type: 'edit' | 'write';
  path: string;
  diff: string;
  additions: number;
  deletions: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Auth message (special format - token at root level)
export interface AuthMessage {
  type: 'auth';
  token: string;
}

// Client → Controller messages
export interface ClientMessage {
  id: string;
  type: 'auth' | 'pairRequest' | 'chat' | 'cancel' | 'ping' | 'models' | 'context' | 'files' | 'readFile' | 'writeFile' | 'editFile' | 'openFile' | 'terminal' | 'terminalSpawn' | 'terminalInput' | 'terminalResize' | 'terminalKill' | 'setBatteryMode' | 'setBandwidthMode';
  payload: {
    // Pairing
    deviceName?: string;
    deviceId?: string;
    sessionToken?: string;
    
    // Chat
    message?: string;
    requestId?: string;
    model?: string;
    mode?: ChatMode;           // Chat mode (agent, ask, edit, plan)
    includeContext?: boolean;
    targetFile?: string;       // For edit mode - file to edit
    selection?: {              // For edit mode - selection to edit
      startLine: number;
      endLine: number;
      text: string;
    };
    path?: string;  // For files/readFile/writeFile/editFile/openFile
    content?: string;  // For writeFile
    createDirs?: boolean;  // For writeFile
    edits?: FileEdit[];  // For editFile
    
    // Battery and Bandwidth optimization
    enabled?: boolean;  // For setBatteryMode
    bandwidthMode?: 'high' | 'medium' | 'low';  // For setBandwidthMode
    line?: number;  // For openFile
    column?: number;  // For openFile
    preview?: boolean;  // For openFile
    // Terminal (legacy command mode)
    command?: string;
    cwd?: string;
    shell?: string;
    terminalId?: string;
    // Terminal (interactive mode)
    data?: string;  // For terminalInput
    cols?: number;  // For terminalSpawn/terminalResize
    rows?: number;  // For terminalSpawn/terminalResize
  };
}

// Auth response from controller
export interface AuthResponse {
  type: 'auth_result';
  success: boolean;
  error?: string;
}

// Workspace context from controller
export interface WorkspaceContext {
  activeFile?: {
    path: string;
    fileName: string;
    language: string;
    content: string;
    selection?: {
      startLine: number;
      endLine: number;
      text: string;
    };
  };
  workspaceFolders?: string[];
  openFiles?: string[];
}

// Controller → Client messages
export interface ControllerMessage {
  id: string;
  type: 'authRequired' | 'authSuccess' | 'pairPending' | 'pairApproved' | 'pairRejected' | 'chunk' | 'done' | 'error' | 'toolCall' | 'pendingChange' | 'changeApproved' | 'changeRejected' | 'pong' | 'status' | 'models' | 'context' | 'files' | 'fileContent' | 'writeResult' | 'editResult' | 'openResult' | 'terminalOutput' | 'terminalExit';
  payload: {
    // Pairing responses
    pairingId?: string;
    status?: 'pending' | 'approved' | 'rejected';
    sessionToken?: string;
    deviceId?: string;
    reason?: string;
    
    // Pending change payload
    changeId?: string;
    changeType?: 'edit' | 'write';
    path?: string;
    diff?: string;
    additions?: number;
    deletions?: number;
    
    // Regular payloads
    content?: string;
    fullContent?: string;
    error?: string;
    message?: string;
    code?: string;
    timestamp?: number;
    models?: ModelInfo[];
    // Context payload
    activeFile?: WorkspaceContext['activeFile'];
    workspaceFolders?: string[];
    openFiles?: string[];
    // Files payload
    path?: string;
    entries?: FileEntry[];
    workspaceName?: string;
    workspaceId?: string;
    workspaceUri?: string;
    // FileContent payload
    fileName?: string;
    language?: string;
    size?: number;
    // Write/Edit/Open result payload
    success?: boolean;
    appliedEdits?: number;
    // Terminal payload
    terminalId?: string;
    output?: string;
    shellType?: string;
    isError?: boolean;
    exitCode?: number;
  };
}

// File browser types
export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  language?: string;
}

// Context file types
export interface ContextFile {
  id: string;
  name: string;
  path: string;
  content: string;
  enabled: boolean;  // Toggle visibility in context
  isAuto: boolean;   // Auto-attached vs. manual
}

// File editing types
export interface FileEdit {
  startLine: number;  // 1-based
  endLine: number;    // 1-based (inclusive)
  newText: string;
}

export interface WriteFileRequest {
  path: string;
  content: string;
  createDirs?: boolean;
}

export interface EditFileRequest {
  path: string;
  edits: FileEdit[];
}

export interface OpenFileRequest {
  path: string;
  line?: number;
  column?: number;
  preview?: boolean;
}

// App settings
export interface Settings {
  // Connection
  connectionUrl: string;
  authToken: string;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  connectionTimeout: number;
  
  // Chat
  model?: string;
  defaultMode: ChatMode;
  includeContextByDefault: boolean;
  sendOnEnter: boolean;
  showStreamingIndicator: boolean;
  enableMarkdownRendering: boolean;
  maxHistorySize: number;
  autoSaveHistory: boolean;
  
  // Terminal
  defaultShell: string;
  terminalFontSize: number;
  terminalFontFamily: string;
  terminalCursorBlink: boolean;
  terminalCursorStyle: 'block' | 'underline' | 'bar';
  terminalScrollback: number;
  copyOnSelect: boolean;
  
  // Editor
  editorFontSize: number;
  editorFontFamily: string;
  editorTabSize: number;
  editorLineNumbers: boolean;
  editorWordWrap: boolean;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  enableAnimations: boolean;
  compactMode: boolean;
  
  // Layout
  showToolbar: boolean;
  showStatusBar: boolean;
  rememberWindowState: boolean;
  defaultExplorerWidth: number;
  defaultTerminalHeight: number;
  defaultChatWidth: number;
  confirmOnExit: boolean;
  
  // System
  batteryOptimization: boolean;
  bandwidthOptimization: boolean;
  lowBatteryThreshold: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Privacy
  clearHistoryOnExit: boolean;
  exportFormat: 'markdown' | 'json' | 'text';
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  // Connection
  connectionUrl: 'ws://localhost:3712/ws',
  authToken: '',
  autoReconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  connectionTimeout: 10000,
  
  // Chat
  model: '',
  defaultMode: 'agent',
  includeContextByDefault: true,
  sendOnEnter: true,
  showStreamingIndicator: true,
  enableMarkdownRendering: true,
  maxHistorySize: 1000,
  autoSaveHistory: true,
  
  // Terminal
  defaultShell: 'pwsh',
  terminalFontSize: 14,
  terminalFontFamily: 'Menlo, Monaco, "Courier New", monospace',
  terminalCursorBlink: true,
  terminalCursorStyle: 'block',
  terminalScrollback: 10000,
  copyOnSelect: false,
  
  // Editor
  editorFontSize: 15,
  editorFontFamily: 'Consolas, Monaco, monospace',
  editorTabSize: 2,
  editorLineNumbers: true,
  editorWordWrap: false,
  
  // Appearance
  theme: 'system',
  fontSize: 14,
  enableAnimations: true,
  compactMode: false,
  
  // Layout
  showToolbar: true,
  showStatusBar: true,
  rememberWindowState: true,
  defaultExplorerWidth: 220,
  defaultTerminalHeight: 200,
  defaultChatWidth: 420,
  confirmOnExit: false,
  
  // System
  batteryOptimization: true,
  bandwidthOptimization: true,
  lowBatteryThreshold: 20,
  logLevel: 'info',
  
  // Privacy
  clearHistoryOnExit: false,
  exportFormat: 'markdown',
};

// App state
export interface AppState {
  connectionStatus: ConnectionStatus;
  messages: Message[];
  currentStreamingId: string | null;
  settings: Settings;
  error: string | null;
}
