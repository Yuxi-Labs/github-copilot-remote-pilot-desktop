import { useEffect } from 'react';
import { saveWindowState, loadWindowState, type WindowState } from '../utils/windowState';

// Check if running in Tauri
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

/**
 * Hook to persist and restore window size/position
 */
export function useWindowState() {
  useEffect(() => {
    // Only run in Tauri environment
    if (!isTauri()) {
      return;
    }

    // Dynamically import Tauri APIs only when in Tauri environment
    import('@tauri-apps/api/window').then(({ getCurrentWindow, LogicalSize, LogicalPosition }) => {
      const appWindow = getCurrentWindow();

      // Restore saved window state on mount
      const restoreWindowState = async () => {
        const savedState = loadWindowState();
        if (savedState) {
          try {
            await appWindow.setSize(new LogicalSize(savedState.width, savedState.height));
            await appWindow.setPosition(new LogicalPosition(savedState.x, savedState.y));
            if (savedState.isMaximized) {
              await appWindow.maximize();
            }
          } catch (err) {
            console.error('Failed to restore window state:', err);
          }
        }
      };

      restoreWindowState();

      // Save window state on changes
      const saveCurrentState = async () => {
        try {
          const size = await appWindow.innerSize();
          const position = await appWindow.outerPosition();
          const isMaximized = await appWindow.isMaximized();

          const state: WindowState = {
            width: size.width,
            height: size.height,
            x: position.x,
            y: position.y,
            isMaximized,
          };

          saveWindowState(state);
        } catch (err) {
          console.error('Failed to save window state:', err);
        }
      };

      // Listen for window resize/move events
      const unlistenResize = appWindow.onResized(() => saveCurrentState());
      const unlistenMove = appWindow.onMoved(() => saveCurrentState());

      // Return cleanup function
      return async () => {
        (await unlistenResize)();
        (await unlistenMove)();
      };
    }).catch((err) => {
      console.error('Failed to initialize window state:', err);
    });
  }, []);
}
