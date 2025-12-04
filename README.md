# Remote Pilot for GitHub Copilot

A native desktop application that connects to the **Controller for GitHub Copilot** VS Code extension, enabling real-time chat with GitHub Copilot from outside VS Code.

![Remote Pilot Desktop](https://img.shields.io/badge/version-0.0.1-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## Overview

When you're away from your desktop but want to continue chatting with the same Copilot instance running in VS Code, Remote Pilot lets you connect from anywhere on your network (or via tunnel) and chat in real-time.

## Features

- **WebSocket Connection** — Real-time bidirectional communication
- **Streaming Responses** — See Copilot's responses as they're generated
- **Token Authentication** — Secure connection to your VS Code instance
- **Auto-Reconnect** — Automatically reconnects on network drops
- **Dark Theme** — Easy on the eyes
- **Export Chat** — Save conversations to file

## Prerequisites

1. **VS Code** with the [Controller for GitHub Copilot](https://github.com/Yuxi-Labs/github-copilot-controller) extension installed and running
2. **GitHub Copilot** subscription active in VS Code

## Installation

### From Releases

Download the latest release for your platform from [Releases](https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop/releases).

### Build from Source

```bash
# Clone the repository
git clone https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop.git
cd github-copilot-remote-pilot-desktop

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

1. **Start the Controller** in VS Code:
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `Copilot Controller: Start`
   - Note the auth token shown in the output

2. **Connect from Remote Pilot**:
   - Enter the WebSocket URL: `ws://YOUR_IP:3712/ws`
   - Enter the auth token from VS Code
   - Click **Connect**

3. **Start Chatting**:
   - Type your message
   - Press `Enter` to send (or `Shift+Enter` for new line)
   - See streaming responses from Copilot

## Connection Options

| Location | URL Format |
|----------|------------|
| Same machine | `ws://localhost:3712/ws` |
| Same network | `ws://192.168.x.x:3712/ws` |
| Remote (tunnel) | `wss://your-tunnel-url/ws` |

## Tech Stack

- **Framework**: [Tauri 2.x](https://tauri.app/) (Rust + WebView)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4.0
- **Build**: Vite 7

## Project Structure

```
├── src/                     # React frontend
│   ├── components/          # UI components
│   ├── hooks/               # React hooks
│   ├── services/            # WebSocket client
│   ├── types/               # TypeScript types
│   └── utils/               # Utilities
├── src-tauri/               # Tauri/Rust backend
└── _docs/                   # Documentation
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

**William Sawyerr** - [Yuxi Labs](https://github.com/Yuxi-Labs)

## Related Projects

- [Controller for GitHub Copilot](https://github.com/Yuxi-Labs/github-copilot-controller) - The VS Code extension this client connects to