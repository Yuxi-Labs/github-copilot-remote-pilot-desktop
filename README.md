# Remote Pilot for GitHub Copilot

Production-ready Tauri desktop application for controlling GitHub Copilot remotely.

## Features

- ✅ WebSocket connection to controller
- ✅ Real-time chat with GitHub Copilot
- ✅ Multiple interaction modes (agent, edit, plan)
- ✅ **Change Approval System** - Review and approve file changes before applying
- ✅ Conversation branching - Fork discussions to explore alternatives
- ✅ Chat history persistence (IndexedDB)
- ✅ Secure credential storage (OS keychain)
- ✅ Theme support (light/dark/system)
- ✅ Comprehensive test coverage (125+ tests)

## Installation

Download the latest release for your platform from [Releases](https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop/releases).

Or build from source:

```bash
git clone https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop.git
cd github-copilot-remote-pilot-desktop
npm install
npm run tauri build
```

## Quick Start

### Development
```bash
npm run dev          # Start dev server
npm test            # Run all tests
npm run test:e2e    # E2E tests with Playwright
```

### Usage

1. Install and start [Controller for GitHub Copilot](https://github.com/Yuxi-Labs/vscode-github-copilot-controller) in VS Code
2. In VS Code, run `Copilot Controller: Copy Connection Info`
3. Open Remote Pilot and enter the connection details
4. Start chatting with GitHub Copilot

## Requirements

- VS Code with Controller for GitHub Copilot extension
- Active GitHub Copilot subscription

## License

[MIT](LICENSE)