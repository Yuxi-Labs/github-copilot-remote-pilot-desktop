import { useState, useEffect, useCallback, useRef } from 'react';
import { wsClient } from '../services/websocket';
import { ConnectionStatus, ControllerMessage, Message, ModelInfo, ChatMode, FileSyncEvent, PendingChange } from '../types';
import { ChangeGroup } from '../types/changes';
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
  onFileSync?: (event: FileSyncEvent) => void;
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus;
  messages: Message[];
  currentStreamingId: string | null;
  connect: () => void;
  disconnect: () => void;
  cancelConnection: () => void;
  sendMessage: (content: string, model?: string, includeContext?: boolean, mode?: ChatMode, editOptions?: {
    targetFile?: string;
    selection?: { startLine: number; endLine: number; text: string };
  }) => void;
  cancelMessage: (id: string) => void;
  clearMessages: () => void;
  requestModels: () => void;
  approveChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  approveAllChangesInMessage: (messageId: string) => void;
  rejectAllChangesInMessage: (messageId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, token, autoReconnect = true, reconnectInterval = 5000, onError, onModelsReceived, onFileSync } = options;

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

  const cancelConnection = useCallback(() => {
    wsClient.cancelConnection();
    setConnectionStatus('disconnected');
    setCurrentStreamingId(null);
    // Clear models on cancel
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

      case 'toolCall':
        // Add or update tool call in the assistant message
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === message.payload.requestId) {
              const existingToolCalls = msg.toolCalls || [];
              const toolCallIndex = existingToolCalls.findIndex(tc => tc.id === message.payload.toolCall.id);
              
              const updatedToolCalls = toolCallIndex >= 0
                ? existingToolCalls.map((tc, idx) => idx === toolCallIndex ? message.payload.toolCall : tc)
                : [...existingToolCalls, message.payload.toolCall];
              
              return { ...msg, toolCalls: updatedToolCalls };
            }
            return msg;
          })
        );
        break;

      case 'pendingChange':
        // Handle pending file changes - attach directly to the message that triggered them
        if (message.payload.changeId && message.payload.path) {
          const pendingChange: PendingChange = {
            id: message.payload.changeId,
            type: message.payload.changeType || 'edit',
            path: message.payload.path,
            diff: message.payload.diff || '',
            additions: message.payload.additions || 0,
            deletions: message.payload.deletions || 0,
            timestamp: message.payload.timestamp || Date.now(),
            status: 'pending',
          };

          // Attach to the message that triggered this change
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === message.id) {
                const existingChanges = msg.pendingChanges || [];
                // Check if this change already exists
                const changeExists = existingChanges.some(c => c.id === pendingChange.id);
                if (changeExists) {
                  return {
                    ...msg,
                    pendingChanges: existingChanges.map(c => 
                      c.id === pendingChange.id ? pendingChange : c
                    ),
                  };
                }
                return {
                  ...msg,
                  pendingChanges: [...existingChanges, pendingChange],
                };
              }
              return msg;
            })
          );
          
          logger.log('Attached pending change to message:', message.id, pendingChange.path);
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
        // Handle both 'error' and 'message' fields for compatibility
        const errorText = message.payload.error || message.payload.message || 'Unknown error';
        const errorCode = message.payload.code || 'UNKNOWN';
        
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id
              ? {
                  ...msg,
                  content: msg.content || 'No response received',
                  isStreaming: false,
                  hasError: true,
                  errorMessage: errorText,
                  retryCount: (msg.retryCount || 0),
                }
              : msg
          )
        );
        setCurrentStreamingId(null);
        streamingContentRef.current.delete(message.id);
        onError?.({
          message: errorText,
          type: errorCode.startsWith('COPILOT_') || errorCode === 'NO_MODEL' ? 'copilot' : 'internal',
          code: errorCode,
          canRetry: true,
        });
        break;

      case 'status':
        logger.log('Status:', message.payload.message);
        break;

      case 'fileChanged':
      case 'fileCreated':
      case 'fileDeleted':
        // Handle file sync events from VS Code
        if (message.payload.path) {
          const syncEvent: FileSyncEvent = {
            path: message.payload.path,
            changeType: message.type === 'fileChanged' ? 'changed' 
              : message.type === 'fileCreated' ? 'created' 
              : 'deleted',
            timestamp: message.payload.timestamp || Date.now(),
            content: message.payload.content,
            language: message.payload.language,
            size: message.payload.size,
          };
          onFileSync?.(syncEvent);
          logger.log('File sync event:', syncEvent.changeType, syncEvent.path);
        }
        break;

      case 'models':
        if (message.payload.models) {
          logger.log('Models received:', message.payload.models);
          onModelsReceived?.(message.payload.models);
        }
        break;
    }
  }, [onError, onModelsReceived, onFileSync]);

  // Helper to update change status in messages
  const updateChangeStatus = useCallback((changeId: string, status: 'approved' | 'rejected') => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.pendingChanges?.some(c => c.id === changeId)) {
          return {
            ...msg,
            pendingChanges: msg.pendingChanges.map(c =>
              c.id === changeId ? { ...c, status } : c
            ),
          };
        }
        return msg;
      })
    );
  }, []);

  const approveChange = useCallback((changeId: string) => {
    // Update local state first
    updateChangeStatus(changeId, 'approved');
    
    // Send to server
    if (wsClient.isConnected()) {
      wsClient.send({
        id: generateUUID(),
        type: 'approveChange',
        payload: { changeId },
      });
      logger.log('Approved change:', changeId);
    }
  }, [updateChangeStatus]);

  const rejectChange = useCallback((changeId: string) => {
    // Update local state first
    updateChangeStatus(changeId, 'rejected');
    
    // Send to server
    if (wsClient.isConnected()) {
      wsClient.send({
        id: generateUUID(),
        type: 'rejectChange',
        payload: { changeId },
      });
      logger.log('Rejected change:', changeId);
    }
  }, [updateChangeStatus]);

  const approveAllChangesInMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      const message = prev.find(m => m.id === messageId);
      if (message?.pendingChanges) {
        message.pendingChanges.forEach(change => {
          if (change.status === 'pending' && wsClient.isConnected()) {
            wsClient.send({ 
              id: generateUUID(), 
              type: 'approveChange', 
              payload: { changeId: change.id } 
            });
          }
        });
      }
      return prev.map((msg) => {
        if (msg.id === messageId && msg.pendingChanges) {
          return {
            ...msg,
            pendingChanges: msg.pendingChanges.map(c =>
              c.status === 'pending' ? { ...c, status: 'approved' as const } : c
            ),
          };
        }
        return msg;
      });
    });
    logger.log('Approved all changes in message:', messageId);
  }, []);

  const rejectAllChangesInMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      const message = prev.find(m => m.id === messageId);
      if (message?.pendingChanges) {
        message.pendingChanges.forEach(change => {
          if (change.status === 'pending' && wsClient.isConnected()) {
            wsClient.send({ 
              id: generateUUID(), 
              type: 'rejectChange', 
              payload: { changeId: change.id } 
            });
          }
        });
      }
      return prev.map((msg) => {
        if (msg.id === messageId && msg.pendingChanges) {
          return {
            ...msg,
            pendingChanges: msg.pendingChanges.map(c =>
              c.status === 'pending' ? { ...c, status: 'rejected' as const } : c
            ),
          };
        }
        return msg;
      });
    });
    logger.log('Rejected all changes in message:', messageId);
  }, []);

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
    cancelConnection,
    sendMessage,
    cancelMessage,
    clearMessages,
    requestModels,
    approveChange,
    rejectChange,
    approveAllChangesInMessage,
    rejectAllChangesInMessage,
  };
}
