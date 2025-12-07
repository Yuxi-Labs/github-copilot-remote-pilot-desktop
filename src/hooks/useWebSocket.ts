import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../services/websocket';
import { ConnectionStatus, ControllerMessage, Message, ModelInfo, ChatMode } from '../types';
import { generateUUID } from '../utils/uuid';
import { saveChatHistory, loadChatHistory } from '../utils/chatHistory';
import { ErrorDetails } from '../components/ErrorNotification';
import { logger } from '../utils/logger';

interface UseWebSocketOptions {
  url: string;
  token: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onError?: (error: ErrorDetails | string) => void;
  onModelsReceived?: (models: ModelInfo[]) => void;
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  messages: Message[];
  currentStreamingId: string | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string, model?: string, includeContext?: boolean, mode?: ChatMode, editOptions?: {
    targetFile?: string;
    selection?: { startLine: number; endLine: number; text: string };
  }) => void;
  cancelMessage: (id: string) => void;
  clearMessages: () => void;
  requestModels: () => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, token, autoReconnect = true, reconnectInterval = 5000, onError, onModelsReceived } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load chat history on mount
    return loadChatHistory();
  });
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);

  // Use ref to track streaming content to avoid stale closure issues
  const streamingContentRef = useRef<Map<string, string>>(new Map());

  // Auto-save chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const connect = useCallback(() => {
    if (!url || !token) {
      onError?.({
        message: 'URL and token are required',
        type: 'validation',
        suggestion: 'Please configure your connection settings before connecting.',
      });
      return;
    }

    setConnectionStatus('connecting');
    wsClient.setAutoReconnect(autoReconnect);

    wsClient.connect(url, token, {
      onOpen: () => {
        setConnectionStatus('connected');
      },
      onClose: () => {
        setConnectionStatus('disconnected');
        setCurrentStreamingId(null);
        // Clear models on disconnect
        onModelsReceived?.([]);
      },
      onError: () => {
        setConnectionStatus('error');
        onError?.({
          message: 'Failed to connect to controller',
          type: 'network',
          suggestion: 'Check that the Controller for GitHub Copilot extension is running in VS Code and the URL is correct.',
          canRetry: true,
        });
      },
      onAuthSuccess: () => {
        logger.log('Authenticated successfully, requesting models...');
        // Request available models after authentication
        wsClient.requestModels();
      },
      onAuthError: (error) => {
        setConnectionStatus('error');
        onError?.({
          message: error,
          type: 'auth',
          suggestion: 'Generate a new auth token from VS Code (Ctrl+Shift+P → "Controller: Generate Auth Token")',
          canRetry: true,
        });
      },
      onMessage: (message: ControllerMessage) => {
        handleControllerMessage(message);
      },
    });
  }, [url, token, autoReconnect, reconnectInterval, onError]);

  const disconnect = useCallback(() => {
    wsClient.disconnect();
    setConnectionStatus('disconnected');
    setCurrentStreamingId(null);
    // Clear models on disconnect
    onModelsReceived?.([]);
  }, [onModelsReceived]);

  const sendMessage = useCallback((
    content: string, 
    model?: string, 
    includeContext?: boolean,
    mode?: ChatMode,
    editOptions?: {
      targetFile?: string;
      selection?: { startLine: number; endLine: number; text: string };
    }
  ) => {
    if (!wsClient.isConnected()) {
      onError?.({
        message: 'Cannot send message: not connected',
        type: 'network',
        suggestion: 'Connect to the controller before sending messages.',
        canRetry: true,
      });
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to controller and get the message ID
    const responseId = wsClient.sendChat(content, model, includeContext, mode, editOptions);

    // Create placeholder for assistant response
    const assistantMessage: Message = {
      id: responseId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setCurrentStreamingId(responseId);
    streamingContentRef.current.set(responseId, '');
  }, [onError]);

  const cancelMessage = useCallback((id: string) => {
    wsClient.sendCancel(id);
    setCurrentStreamingId(null);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, isStreaming: false } : msg
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStreamingId(null);
    streamingContentRef.current.clear();
    // Clear from localStorage as well
    saveChatHistory([]);
  }, []);

  const requestModels = useCallback(() => {
    wsClient.requestModels();
  }, []);

  const handleControllerMessage = useCallback((message: ControllerMessage) => {
    switch (message.type) {
      case 'chunk':
        if (message.payload.content) {
          const currentContent = streamingContentRef.current.get(message.id) || '';
          const newContent = currentContent + message.payload.content;
          streamingContentRef.current.set(message.id, newContent);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === message.id
                ? { ...msg, content: newContent }
                : msg
            )
          );
        }
        break;

      case 'done':
        const finalContent = message.payload.fullContent ||
          streamingContentRef.current.get(message.id) || '';

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id
              ? { ...msg, content: finalContent, isStreaming: false }
              : msg
          )
        );
        setCurrentStreamingId(null);
        streamingContentRef.current.delete(message.id);
        break;

      case 'error':
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  content: msg.content || 'No response received',
                  isStreaming: false,
                  hasError: true,
                  errorMessage: message.payload.error || 'Unknown error',
                  retryCount: (msg.retryCount || 0),
                }
              : msg
          )
        );
        setCurrentStreamingId(null);
        streamingContentRef.current.delete(message.id);
        onError?.({
          message: message.payload.error || 'Unknown error',
          type: message.payload.code?.startsWith('COPILOT_') ? 'copilot' : 'internal',
          code: message.payload.code,
          canRetry: true,
        });
        break;

      case 'status':
        logger.log('Status:', message.payload.message);
        break;

      case 'models':
        if (message.payload.models) {
          logger.log('Models received:', message.payload.models);
          onModelsReceived?.(message.payload.models);
        }
        break;
    }
  }, [onError, onModelsReceived]);

  // Sync connection status with wsClient state on mount
  // Don't disconnect on unmount - the singleton connection should persist
  useEffect(() => {
    if (wsClient.isConnected()) {
      setConnectionStatus('connected');
    }
  }, []);

  return {
    connectionStatus,
    messages,
    currentStreamingId,
    connect,
    disconnect,
    sendMessage,
    cancelMessage,
    clearMessages,
    requestModels,
  };
}
