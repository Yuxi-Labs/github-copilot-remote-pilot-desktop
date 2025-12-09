import { beforeAll, afterEach, expect, test, vi } from 'vitest';
import { randomFillSync } from 'node:crypto';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { invoke } from '@tauri-apps/api/core';

// Extend Window interface for Tauri internals
declare global {
  interface Window {
    __TAURI_INTERNALS__: {
      invoke: (cmd: string, args: Record<string, unknown>, options?: unknown) => Promise<unknown>;
    };
  }
}

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      // @ts-ignore
      getRandomValues: (buffer: Buffer) => {
        return randomFillSync(buffer);
      },
    },
  });
});

afterEach(() => {
  clearMocks();
});

test('greet command returns greeting message', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'greet' && args) {
      const name = (args as Record<string, string>).name;
      return `Hello, ${name}! You've been greeted from Rust!`;
    }
  });

  const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke');
  const result = await invoke('greet', { name: 'Tauri' });

  expect(result).toBe('Hello, Tauri! You\'ve been greeted from Rust!');
  expect(spy).toHaveBeenCalledWith('greet', { name: 'Tauri' }, undefined);
});

test('greet command handles empty name', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'greet' && args) {
      const name = (args as Record<string, string>).name;
      return `Hello, ${name}! You've been greeted from Rust!`;
    }
  });

  const result = await invoke('greet', { name: '' });
  expect(result).toBe('Hello, ! You\'ve been greeted from Rust!');
});

test('greet command handles special characters', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'greet' && args) {
      const name = (args as Record<string, string>).name;
      return `Hello, ${name}! You've been greeted from Rust!`;
    }
  });

  const result = await invoke('greet', { name: 'Alice & Bob' });
  expect(result).toBe('Hello, Alice & Bob! You\'ve been greeted from Rust!');
});

test('greet command handles unicode', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'greet' && args) {
      const name = (args as Record<string, string>).name;
      return `Hello, ${name}! You've been greeted from Rust!`;
    }
  });

  const result = await invoke('greet', { name: '你好' });
  expect(result).toBe('Hello, 你好! You\'ve been greeted from Rust!');
});

test('is_speech_available command returns boolean', async () => {
  mockIPC((cmd) => {
    if (cmd === 'is_speech_available') {
      // Mock returns true for testing purposes
      return true;
    }
  });

  const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke');
  const result = await invoke('is_speech_available');

  expect(typeof result).toBe('boolean');
  expect(spy).toHaveBeenCalledWith('is_speech_available', {}, undefined);
});

test('is_speech_available returns consistent value', async () => {
  mockIPC((cmd) => {
    if (cmd === 'is_speech_available') {
      return true;
    }
  });

  const result1 = await invoke('is_speech_available');
  const result2 = await invoke('is_speech_available');

  expect(result1).toBe(result2);
});

test('start_speech_recognition command can be invoked', async () => {
  mockIPC((cmd) => {
    if (cmd === 'start_speech_recognition') {
      // Mock speech recognition result
      return 'Hello world';
    }
  });

  const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke');
  const result = await invoke('start_speech_recognition');

  expect(result).toBe('Hello world');
  expect(spy).toHaveBeenCalledWith('start_speech_recognition', {}, undefined);
});

test('start_speech_recognition handles already listening error', async () => {
  mockIPC((cmd) => {
    if (cmd === 'start_speech_recognition') {
      throw new Error('Already listening');
    }
  });

  await expect(invoke('start_speech_recognition')).rejects.toThrow('Already listening');
});

test('stop_speech_recognition command can be invoked', async () => {
  mockIPC((cmd) => {
    if (cmd === 'stop_speech_recognition') {
      return undefined;
    }
  });

  const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke');
  await invoke('stop_speech_recognition');

  expect(spy).toHaveBeenCalledWith('stop_speech_recognition', {}, undefined);
});
