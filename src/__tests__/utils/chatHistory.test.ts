import { describe, it, expect, beforeEach } from 'vitest';
import { saveChatHistory, loadChatHistory, clearChatHistory } from '../../utils/chatHistory';

describe('chatHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveChatHistory', () => {
    it('should save chat messages to storage', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
        { id: '2', role: 'assistant' as const, content: 'Hi!', timestamp: Date.now() }
      ];

      saveChatHistory(messages);
      const loaded = loadChatHistory();

      expect(loaded).toHaveLength(2);
      expect(loaded[0].content).toBe('Hello');
      expect(loaded[1].content).toBe('Hi!');
    });

    it('should overwrite previous history', () => {
      const messages1 = [
        { id: '1', role: 'user' as const, content: 'First', timestamp: Date.now() }
      ];
      const messages2 = [
        { id: '2', role: 'user' as const, content: 'Second', timestamp: Date.now() }
      ];

      saveChatHistory(messages1);
      saveChatHistory(messages2);
      const loaded = loadChatHistory();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].content).toBe('Second');
    });
  });

  describe('loadChatHistory', () => {
    it('should return empty array when no history exists', () => {
      const loaded = loadChatHistory();
      expect(loaded).toEqual([]);
    });

    it('should load previously saved messages', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Test', timestamp: Date.now() }
      ];

      saveChatHistory(messages);
      const loaded = loadChatHistory();

      expect(loaded).toEqual(messages);
    });
  });

  describe('clearChatHistory', () => {
    it('should remove all chat history', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'Test', timestamp: Date.now() }
      ];

      saveChatHistory(messages);
      clearChatHistory();
      const loaded = loadChatHistory();

      expect(loaded).toEqual([]);
    });
  });
});
