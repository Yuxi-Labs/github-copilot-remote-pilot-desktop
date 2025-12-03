# Remote Pilot for GitHub Copilot - Desktop Client

## Overview

A Tauri-based desktop application that connects to the **Controller for GitHub Copilot** VS Code extension, enabling real-time chat with GitHub Copilot from outside VS Code.

## Current Status: MVP Complete ✅

The desktop client is fully functional with the following working features:
- ✅ WebSocket connection to the controller
- ✅ Token-based authentication
- ✅ Real-time chat with streaming responses
- ✅ Connection state management
- ✅ Settings persistence
- ✅ Full UI (MenuBar, Toolbar, StatusBar, ChatView)

## Problem Statement

The Controller extension runs inside VS Code and exposes WebSocket/SSE endpoints. Users need a native desktop client to connect to this controller when they're away from VS Code but still want to interact with Copilot.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Desktop Client (This App)                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      React Frontend                      │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │    │
│  │  │   MenuBar   │    │   Toolbar   │    │  StatusBar  │  │    │
│  │  └─────────────┘    └─────────────┘    └─────────────┘  │    │
│  │                                                          │    │
│  │  ┌─────────────────────────────────────────────────────┐│    │
│  │  │                    Chat View                         ││    │
│  │  │  ┌───────────────────────────────────────────────┐  ││    │
│  │  │  │              Message List                      │  ││    │
│  │  │  │  - User messages                               │  ││    │
│  │  │  │  - Copilot responses (streaming)               │  ││    │
│  │  │  └───────────────────────────────────────────────┘  ││    │
│  │  │  ┌───────────────────────────────────────────────┐  ││    │
│  │  │  │              Message Input                     │  ││    │
│  │  │  └───────────────────────────────────────────────┘  ││    │
│  │  └─────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │                   WebSocket Client                         │  │
│  │  - Connect to controller                                   │  │
│  │  - Send auth token                                         │  │
│  │  - Send/receive messages                                   │  │
│  │  - Handle reconnection                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ WebSocket (ws:// or wss://)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                VS Code + Controller Extension                    │
│                    (Separate application)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Core Features
- **WebSocket Connection**: Connect to controller via local IP or tunnel URL
- **Real-time Chat**: Send messages and receive streaming responses
- **Authentication**: Token-based auth stored securely
- **Connection Management**: Connect, disconnect, auto-reconnect

### UI Components

#### MenuBar
- **File**: New Chat, Export Chat, Settings, Exit
- **Edit**: Copy, Paste, Clear Chat
- **View**: Toggle Toolbar, Toggle Status Bar
- **Help**: About, Documentation

#### Toolbar
- Connection status indicator
- Connect/Disconnect button
- Settings quick access
- New chat button

#### Status Bar
- Connection state (Connected/Disconnected/Connecting)
- Controller URL
- Latency indicator
- Message count

#### Chat View
- Message list with user/Copilot distinction
- Streaming response display
- Markdown rendering for Copilot responses
- Code block syntax highlighting
- Message timestamps

#### Message Input
- Multi-line text input
- Send button
- Keyboard shortcuts (Ctrl+Enter to send)
- Character/token count

## Message Protocol

Following the controller's protocol:

### Client → Controller
```typescript
interface ClientMessage {
    id: string;        // UUID for message tracking
    type: 'chat' | 'cancel' | 'ping';
    payload: {
        message?: string;  // For chat type
    };
}
```

### Controller → Client
```typescript
interface ControllerMessage {
    id: string;        // Matches request ID
    type: 'chunk' | 'done' | 'error' | 'pong' | 'status';
    payload: {
        content?: string;      // For chunk type
        fullContent?: string;  // For done type
        error?: string;        // For error type
    };
}
```

## State Management

```typescript
interface AppState {
    // Connection
    connectionUrl: string;
    authToken: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
    
    // Chat
    messages: Message[];
    currentStreamingMessage: string | null;
    
    // UI
    showToolbar: boolean;
    showStatusBar: boolean;
    
    // Settings
    settings: {
        theme: 'light' | 'dark' | 'system';
        fontSize: number;
        autoReconnect: boolean;
        reconnectInterval: number;
    };
}
```

## File Structure

```
├── index.html               # HTML entry point
├── package.json             # Node dependencies
├── vite.config.ts           # Vite bundler config
├── tsconfig.json            # TypeScript config
│
├── src/                     # React frontend
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component
│   ├── App.css              # Global styles
│   │
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   │
│   ├── hooks/
│   │   ├── useWebSocket.ts  # WebSocket connection hook
│   │   └── useSettings.ts   # Settings persistence hook
│   │
│   ├── components/
│   │   ├── MenuBar.tsx      # Application menu
│   │   ├── Toolbar.tsx      # Quick actions toolbar
│   │   ├── StatusBar.tsx    # Connection status bar
│   │   ├── ChatView.tsx     # Main chat container
│   │   ├── MessageList.tsx  # Message display
│   │   ├── MessageInput.tsx # User input
│   │   ├── Message.tsx      # Individual message
│   │   └── SettingsDialog.tsx # Settings modal
│   │
│   ├── services/
│   │   └── websocket.ts     # WebSocket client service
│   │
│   └── utils/
│       ├── uuid.ts          # UUID generation
│       └── storage.ts       # Local storage helpers
│
├── src-tauri/               # Tauri / Rust backend
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri app config (window, permissions)
│   ├── build.rs             # Tauri build script
│   │
│   ├── capabilities/
│   │   └── default.json     # App permissions/capabilities
│   │
│   ├── icons/               # App icons (all platforms)
│   │
│   └── src/
│       ├── main.rs          # Rust entry point
│       └── lib.rs           # Tauri commands & app setup
│
└── _docs/
    └── DESIGN.md            # This document
```

## Connection Flow

1. **User enters connection details**: URL + auth token
2. **App connects via WebSocket**: `ws://<url>/ws`
3. **App sends auth message**: First message with token
4. **Controller validates**: Returns success/error
5. **Chat enabled**: User can send/receive messages
6. **On disconnect**: Auto-reconnect if enabled

## Security Considerations

- Auth token stored in Tauri secure storage (OS keychain)
- No tokens in URLs or logs
- WebSocket connection validated server-side
- Optional: Support for wss:// (TLS) connections

## Technology Stack

- **Framework**: Tauri 2.x (Rust backend, web frontend)
- **Frontend**: React 19, TypeScript
- **Build**: Vite 7
- **Icons**: Lucide React
- **Storage**: @tauri-apps/plugin-store

## Future Considerations

- Multiple controller connections (tabs)
- Conversation history persistence
- Markdown preview improvements
- Code execution in responses
- Voice input/output
- Mobile companion (React Native)

---

## Backlog

### 🔴 High Priority (P0)

#### 1. Model Selection Issue
**Status**: Not Started  
**Description**: The controller is not respecting the model selected in VS Code. User has Claude Opus 4.5 Preview selected in VS Code, but a different model is responding through the controller.  
**Investigation Needed**:
- Review `CopilotBridge` in the controller extension
- Check how the controller invokes Copilot chat
- Ensure model preference is passed through the API
- May need to pass model info in WebSocket message or read from VS Code settings

#### 2. Markdown Rendering
**Status**: Not Started  
**Description**: Copilot responses contain markdown (bold, lists, code blocks) but display as raw text.  
**Implementation**:
- Install `react-markdown` for rendering
- Install `react-syntax-highlighter` for code blocks
- Update `Message.tsx` component
- Support GitHub-flavored markdown

#### 3. Code Block Syntax Highlighting
**Status**: Not Started  
**Description**: Code blocks in responses should have proper syntax highlighting.  
**Implementation**:
- Use `rehype-prism` or `react-syntax-highlighter`
- Support common languages (TypeScript, Python, JavaScript, Rust, etc.)
- Add copy button for code blocks

### 🟡 Medium Priority (P1)

#### 4. Secure Token Storage
**Status**: Not Started  
**Description**: Currently using localStorage; should use Tauri's secure storage (OS keychain).  
**Implementation**:
- Use `@tauri-apps/plugin-store` or `@tauri-apps/plugin-keychain`
- Migrate existing token storage
- Encrypt tokens at rest

#### 5. Auto-Reconnect Improvements
**Status**: Partial  
**Description**: Current auto-reconnect exists but needs polish.  
**Improvements Needed**:
- Exponential backoff
- Max retry limit
- Visual feedback during reconnection attempts
- Manual retry button

#### 6. Export Chat History
**Status**: Not Started  
**Description**: Allow users to export chat conversations.  
**Features**:
- Export to Markdown file
- Export to JSON (for re-import)
- Export to PDF (stretch)

#### 7. Chat History Persistence
**Status**: Not Started  
**Description**: Save and restore previous conversations.  
**Implementation**:
- Store messages in IndexedDB or Tauri file storage
- Chat list sidebar
- Search through history
- Clear individual chats

#### 8. Theme Support
**Status**: Partial  
**Description**: Settings has theme option but not fully implemented.  
**Implementation**:
- Proper dark/light theme CSS variables
- System theme detection
- Theme toggle in toolbar

### 🟢 Low Priority (P2)

#### 9. Connection Profiles
**Status**: Not Started  
**Description**: Save multiple connection configurations.  
**Features**:
- Name profiles (e.g., "Home", "Work", "Tunnel")
- Quick switch between profiles
- Store per-profile settings

#### 10. Keyboard Shortcuts
**Status**: Partial  
**Description**: Some shortcuts exist; need comprehensive coverage.  
**Needed**:
- Cmd/Ctrl+N: New chat
- Cmd/Ctrl+,: Open settings
- Cmd/Ctrl+K: Clear chat
- Escape: Cancel current request
- Up arrow: Edit last message

#### 11. Window State Persistence
**Status**: Not Started  
**Description**: Remember window position and size.  
**Implementation**:
- Save on close
- Restore on open
- Remember maximized state

#### 12. Error Handling Improvements
**Status**: Partial  
**Description**: Better error messages and recovery.  
**Improvements**:
- Specific error messages for common failures
- Retry buttons on errors
- Connection diagnostics

#### 13. Message Actions
**Status**: Not Started  
**Description**: Actions on individual messages.  
**Features**:
- Copy message
- Regenerate response
- Edit and resend
- Delete message

#### 14. Streaming Indicator
**Status**: Basic  
**Description**: Show typing indicator during streaming.  
**Improvements**:
- Animated dots or spinner
- Estimated time remaining
- Token count during streaming

### 🔵 Future Features (P3)

#### 15. Multiple Controller Connections
**Description**: Connect to multiple controllers in tabs.

#### 16. Conversation Branching
**Description**: Fork conversations at any point.

#### 17. Voice Input/Output
**Description**: Speech-to-text input, text-to-speech output.

#### 18. Mobile Companion App
**Description**: React Native app with same functionality.

#### 19. Plugin System
**Description**: Allow custom message processors/transformers.

#### 20. Offline Mode
**Description**: Queue messages when disconnected, send when reconnected.

---

## Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| WebSocket Connection | ✅ Complete | Connects to controller |
| Token Authentication | ✅ Complete | Auth message format fixed |
| Real-time Chat | ✅ Complete | Streaming responses work |
| Connection State | ✅ Complete | Connected/Disconnected/Connecting |
| Settings Dialog | ✅ Complete | Basic settings UI |
| Settings Persistence | ✅ Complete | Uses localStorage |
| MenuBar | ✅ Complete | File, Edit, View, Help menus |
| Toolbar | ✅ Complete | Connect, Settings, New Chat |
| StatusBar | ✅ Complete | Shows connection status |
| Message List | ✅ Complete | Displays conversation |
| Message Input | ✅ Complete | Multi-line input |
| Tailwind CSS 4 | ✅ Complete | Modern styling |

---

## Known Issues

1. **Model Mismatch**: Selected model in VS Code not used by controller
2. **Raw Markdown**: Markdown not rendered in messages
3. **Token Insecure**: Stored in localStorage, not keychain
4. **No History**: Chat cleared on refresh

---

## Technical Debt

- [ ] Add unit tests for components
- [ ] Add integration tests for WebSocket
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add error boundaries in React
- [ ] Implement proper logging
- [ ] Add performance monitoring
- [ ] Review accessibility (a11y)

