const WINDOW_STATE_KEY = 'remote-pilot-window-state';

export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
}

/**
 * Save window state to localStorage
 */
export function saveWindowState(state: WindowState): void {
  try {
    localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save window state:', e);
  }
}

/**
 * Load window state from localStorage
 */
export function loadWindowState(): WindowState | null {
  try {
    const stored = localStorage.getItem(WINDOW_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load window state:', e);
  }
  return null;
}

/**
 * Clear stored window state
 */
export function clearWindowState(): void {
  try {
    localStorage.removeItem(WINDOW_STATE_KEY);
  } catch (e) {
    console.error('Failed to clear window state:', e);
  }
}
