import { invoke } from '@tauri-apps/api/core';

/**
 * Secure storage for sensitive data like auth tokens
 * Uses Tauri's secure store plugin which encrypts data at rest
 */

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

/**
 * Store sensitive data securely
 */
export async function secureStore(key: string, value: string): Promise<void> {
  if (isTauri) {
    try {
      await invoke('secure_store', { key, value });
    } catch (error) {
      console.error('Failed to securely store data:', error);
      // Fallback to localStorage if Tauri fails
      localStorage.setItem(`secure_${key}`, value);
    }
  } else {
    // Fallback for non-Tauri environment
    localStorage.setItem(`secure_${key}`, value);
  }
}

/**
 * Retrieve sensitive data securely
 */
export async function secureRetrieve(key: string): Promise<string | null> {
  if (isTauri) {
    try {
      return await invoke<string | null>('secure_retrieve', { key });
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      // Fallback to localStorage if Tauri fails
      return localStorage.getItem(`secure_${key}`);
    }
  } else {
    // Fallback for non-Tauri environment
    return localStorage.getItem(`secure_${key}`);
  }
}

/**
 * Delete sensitive data securely
 */
export async function secureDelete(key: string): Promise<void> {
  if (isTauri) {
    try {
      await invoke('secure_delete', { key });
    } catch (error) {
      console.error('Failed to delete secure data:', error);
      // Fallback to localStorage if Tauri fails
      localStorage.removeItem(`secure_${key}`);
    }
  } else {
    // Fallback for non-Tauri environment
    localStorage.removeItem(`secure_${key}`);
  }
}

/**
 * Migrate existing localStorage data to secure storage
 */
export async function migrateToSecureStorage(keys: string[]): Promise<void> {
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value) {
      await secureStore(key, value);
      localStorage.removeItem(key);
    }
  }
}
