import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Tauri API
const mockTauri = {
  invoke: vi.fn(),
  event: {
    listen: vi.fn(),
    emit: vi.fn()
  },
  window: {
    appWindow: {
      show: vi.fn(),
      hide: vi.fn(),
      close: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      unmaximize: vi.fn()
    }
  }
};

global.__TAURI__ = mockTauri as any;
