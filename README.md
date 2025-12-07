# Remote Pilot for GitHub Copilot

A native desktop application that connects to the Controller for GitHub Copilot VS Code extension, enabling chat with GitHub Copilot from outside VS Code.

## Installation

Download the latest release for your platform from [Releases](https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop/releases).

Or build from source:

```bash
git clone https://github.com/Yuxi-Labs/github-copilot-remote-pilot-desktop.git
cd github-copilot-remote-pilot-desktop
npm install
npm run tauri build
```

## Usage

1. Install and start [Controller for GitHub Copilot](https://github.com/Yuxi-Labs/vscode-github-copilot-controller) in VS Code
2. In VS Code, run `Copilot Controller: Copy Connection Info`
3. Open Remote Pilot and enter the connection details
4. Start chatting with GitHub Copilot

## Requirements

- VS Code with Controller for GitHub Copilot extension
- Active GitHub Copilot subscription

## License

[MIT](LICENSE)