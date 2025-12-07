import { describe, it, expect, beforeEach } from 'vitest';
import { getItem, setItem, removeItem, clear } from '../../utils/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setItem and getItem', () => {
    it('should store and retrieve string values', () => {
      setItem('testKey', 'testValue');
      expect(getItem('testKey')).toBe('testValue');
    });

    it('should store and retrieve objects', () => {
      const testObj = { name: 'test', value: 123 };
      setItem('testObj', testObj);
      expect(getItem('testObj')).toEqual(testObj);
    });

    it('should return null for non-existent keys', () => {
      expect(getItem('nonExistent')).toBeNull();
    });

    it('should return default value when key does not exist', () => {
      expect(getItem('nonExistent', 'default')).toBe('default');
    });
  });

  describe('removeItem', () => {
    it('should remove an item', () => {
      setItem('testKey', 'testValue');
      removeItem('testKey');
      expect(getItem('testKey')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all items', () => {
      setItem('key1', 'value1');
      setItem('key2', 'value2');
      clear();
      expect(getItem('key1')).toBeNull();
      expect(getItem('key2')).toBeNull();
    });
  });
});
