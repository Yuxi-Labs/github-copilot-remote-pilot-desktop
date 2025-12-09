# Secure Storage Implementation

## Overview
Sensitive data (auth tokens, connection URLs) are now stored securely using Tauri's encrypted store plugin instead of plain localStorage.

## Architecture

### Backend (Rust)
- **Plugin**: `tauri-plugin-store` v2
- **Commands**:
  - `secure_store(key, value)` - Store encrypted data
  - `secure_retrieve(key)` - Retrieve decrypted data
  - `secure_delete(key)` - Delete stored data
- **Storage Location**: Platform-specific encrypted store
  - Windows: `%APPDATA%\com.yuxilabs.remote-pilot\store.bin`
  - macOS: `~/Library/Application Support/com.yuxilabs.remote-pilot/store.bin`
  - Linux: `~/.config/com.yuxilabs.remote-pilot/store.bin`

### Frontend (TypeScript)
- **Wrapper**: `src/utils/secureStorage.ts`
  - Provides `secureStore()`, `secureRetrieve()`, `secureDelete()`
  - Auto-detects Tauri environment
  - Falls back to localStorage in browser (for development)

### Integration
- **Storage Layer**: `src/utils/storage.ts`
  - `loadSettings()` - Loads sensitive fields from secure storage
  - `saveSettings()` - Saves sensitive fields to secure storage
  - `migrateSettingsToSecureStorage()` - One-time migration from localStorage

- **Settings Hook**: `src/hooks/useSettings.ts`
  - Automatically runs migration on first load
  - Handles async secure storage operations

## Sensitive Data
The following settings are stored in secure storage:
- `authToken` - GitHub Copilot authentication token
- `connectionUrl` - WebSocket server URL

Non-sensitive settings remain in localStorage for performance.

## Migration
On first app launch after update:
1. Hook checks for existing settings in localStorage
2. Extracts `authToken` and `connectionUrl`
3. Stores them in secure storage
4. Removes them from localStorage
5. Saves updated settings without sensitive data

## Security Benefits
- **Encryption**: Data encrypted at rest using OS keychain
- **Platform Integration**: Uses native security features
  - Windows: DPAPI
  - macOS: Keychain
  - Linux: Secret Service
- **Isolation**: Data isolated from other apps and browser
- **No Plain Text**: Auth tokens never stored in plain text

## Development
In browser dev mode (not Tauri):
- Secure storage falls back to localStorage
- Console warning logged
- Migration still works but uses localStorage

## Testing
To verify secure storage:
1. Open DevTools Console
2. Check for "Using secure storage" or "Secure storage not available" log
3. For Tauri build: Check encrypted store file exists
4. Verify auth token not in localStorage

## Future Enhancements
- Consider encrypting additional settings (API keys, certificates)
- Add secure storage health checks
- Implement backup/restore with encryption
