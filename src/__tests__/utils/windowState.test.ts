import { describe, it, expect, beforeEach } from 'vitest';
import { saveWindowState, loadWindowState } from '../../utils/windowState';

describe('windowState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveWindowState', () => {
    it('should save window dimensions and position', () => {
      const state = {
        width: 1024,
        height: 768,
        x: 100,
        y: 50,
        isMaximized: false
      };

      saveWindowState(state);
      const loaded = loadWindowState();

      expect(loaded).toEqual(state);
    });

    it('should save maximized state', () => {
      const state = {
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        isMaximized: true
      };

      saveWindowState(state);
      const loaded = loadWindowState();

      expect(loaded?.isMaximized).toBe(true);
    });
  });

  describe('loadWindowState', () => {
    it('should return null when no state exists', () => {
      const state = loadWindowState();
      expect(state).toBeNull();
    });

    it('should load previously saved state', () => {
      const state = {
        width: 800,
        height: 600,
        x: 200,
        y: 100,
        isMaximized: false
      };

      saveWindowState(state);
      const loaded = loadWindowState();

      expect(loaded).toEqual(state);
    });
  });
});
