import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, DEFAULT_SETTINGS } from '../types';
import { loadSettings, saveSettings, migrateSettingsToSecureStorage } from '../utils/storage';

interface UseSettingsReturn {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const migrationDone = useRef(false);

  // Load settings on mount and migrate to secure storage
  useEffect(() => {
    const initSettings = async () => {
      // One-time migration from localStorage to secure storage
      if (!migrationDone.current) {
        await migrateSettingsToSecureStorage();
        migrationDone.current = true;
      }
      
      const stored = await loadSettings();
      setSettings(stored);
    };
    
    initSettings();
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      // Fire-and-forget save (async)
      saveSettings(updated).catch(e => console.error('Failed to save settings:', e));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    // Fire-and-forget save (async)
    saveSettings(DEFAULT_SETTINGS).catch(e => console.error('Failed to reset settings:', e));
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
