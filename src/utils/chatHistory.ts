import { Message } from '../types';

const CHAT_HISTORY_KEY = 'copilot-chat-history';
const MAX_HISTORY_SIZE = 1000; // Max messages to keep

export interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(messages: Message[]): void {
  try {
    // Keep only last MAX_HISTORY_SIZE messages
    const messagesToSave = messages.slice(-MAX_HISTORY_SIZE);
    
    const history: ChatHistory = {
      messages: messagesToSave,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): Message[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) {
      return [];
    }
    
    const history: ChatHistory = JSON.parse(stored);
    return history.messages || [];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Clear chat history from localStorage
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Get chat history metadata (size, last updated)
 */
export function getChatHistoryMetadata(): { messageCount: number; lastUpdated: number | null } {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) {
      return { messageCount: 0, lastUpdated: null };
    }
    
    const history: ChatHistory = JSON.parse(stored);
    return {
      messageCount: history.messages?.length || 0,
      lastUpdated: history.lastUpdated || null,
    };
  } catch (error) {
    console.error('Failed to get chat history metadata:', error);
    return { messageCount: 0, lastUpdated: null };
  }
}
