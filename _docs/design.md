# Remote Pilot for GitHub Copilot - Desktop Client

## Overview

A Tauri-based desktop application that connects to the **Controller for GitHub Copilot** VS Code extension, enabling real-time chat with GitHub Copilot from outside VS Code.

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
