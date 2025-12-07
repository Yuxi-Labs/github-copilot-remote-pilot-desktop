import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../hooks/useSettings';

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default settings', () => {
    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(
      expect.objectContaining({
        theme: expect.any(String),
        fontSize: expect.any(Number),
        autoReconnect: expect.any(Boolean)
      })
    );
  });

  it('should update settings', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ theme: 'light' });
    });

    expect(result.current.settings.theme).toBe('light');
  });

  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ fontSize: 16 });
    });

    const { result: result2 } = renderHook(() => useSettings());
    expect(result2.current.settings.fontSize).toBe(16);
  });

  it('should reset settings to defaults', () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.updateSettings({ fontSize: 20 });
    });

    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings.fontSize).toBe(14); // default
  });
});
