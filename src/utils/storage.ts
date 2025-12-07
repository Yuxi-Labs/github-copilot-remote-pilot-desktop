import { Settings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'remote-pilot-settings';

/**
 * Load settings from localStorage
 */
export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

/**
 * Clear all stored settings
 */
export function clearSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (e) {
    console.error('Failed to clear settings:', e);
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
