import { Settings, DEFAULT_SETTINGS } from '../types';
import { secureStore, secureRetrieve, secureDelete } from './secureStorage';

const SETTINGS_KEY = 'remote-pilot-settings';
const SECURE_AUTH_TOKEN_KEY = 'secure-auth-token';
const SECURE_CONNECTION_URL_KEY = 'secure-connection-url';

/**
 * Get item from localStorage
 */
export function getItem<T = any>(key: string, defaultValue: T | null = null): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    try {
      return JSON.parse(stored) as T;
    } catch {
      return stored as T;
    }
  } catch (e) {
    console.error('Failed to get item:', e);
    return defaultValue;
  }
}

/**
 * Set item in localStorage
 */
export function setItem(key: string, value: any): void {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (e) {
    console.error('Failed to set item:', e);
  }
}

/**
 * Remove item from localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove item:', e);
  }
}

/**
 * Clear all items from localStorage
 */
export function clear(): void {
  try {
    localStorage.clear();
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
}

/**
 * Load settings from localStorage
 * Sensitive fields (authToken, connectionUrl) are loaded from secure storage
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    let settings = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    
    // Load sensitive data from secure storage
    const authToken = await secureRetrieve(SECURE_AUTH_TOKEN_KEY);
    const connectionUrl = await secureRetrieve(SECURE_CONNECTION_URL_KEY);
    
    if (authToken) settings.authToken = authToken;
    if (connectionUrl) settings.connectionUrl = connectionUrl;
    
    return settings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 * Sensitive fields (authToken, connectionUrl) are saved to secure storage
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    // Store sensitive data in secure storage
    if (settings.authToken) {
      await secureStore(SECURE_AUTH_TOKEN_KEY, settings.authToken);
    }
    if (settings.connectionUrl) {
      await secureStore(SECURE_CONNECTION_URL_KEY, settings.connectionUrl);
    }
    
    // Store non-sensitive settings in localStorage (exclude sensitive fields)
    const { authToken, connectionUrl, ...nonSensitiveSettings } = settings;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nonSensitiveSettings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Clear all stored settings
 */
export async function clearSettings(): Promise<void> {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    await secureDelete(SECURE_AUTH_TOKEN_KEY);
    await secureDelete(SECURE_CONNECTION_URL_KEY);
  } catch (e) {
    console.error('Failed to clear settings:', e);
  }
}

/**
 * Migrate existing settings from localStorage to secure storage
 * Should be called once on app startup
 */
export async function migrateSettingsToSecureStorage(): Promise<void> {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return;
    
    const settings = JSON.parse(stored);
    
    // Migrate auth token if present
    if (settings.authToken) {
      await secureStore(SECURE_AUTH_TOKEN_KEY, settings.authToken);
      delete settings.authToken;
    }
    
    // Migrate connection URL if present
    if (settings.connectionUrl) {
      await secureStore(SECURE_CONNECTION_URL_KEY, settings.connectionUrl);
      delete settings.connectionUrl;
    }
    
    // Save updated settings without sensitive data
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    console.log('Settings migrated to secure storage');
  } catch (e) {
    console.error('Failed to migrate settings:', e);
  }
}

/**
 * Export chat history to file
 */
export function exportChat(
  messages: Array<{ role: string; content: string; timestamp: number }>,
  format: 'json' | 'markdown' | 'text' = 'markdown'
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'json') {
    content = JSON.stringify(messages, null, 2);
    filename = `chat-export-${timestamp}.json`;
    mimeType = 'application/json';
  } else if (format === 'markdown') {
    content = messages
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === 'user' ? '**You**' : '**Copilot**';
        return `### ${role} - ${time}\n\n${msg.content}\n`;
      })
      .join('\n---\n\n');
    filename = `chat-export-${timestamp}.md`;
    mimeType = 'text/markdown';
  } else {
    content = messages
      .map((msg) => {
        const time = new Date(msg.timestamp).toLocaleString();
        const role = msg.role === 'user' ? 'You' : 'Copilot';
        return `[${time}] ${role}: ${msg.content}`;
      })
      .join('\n\n');
    filename = `chat-export-${timestamp}.txt`;
    mimeType = 'text/plain';
  }

  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
