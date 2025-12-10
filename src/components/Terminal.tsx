import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Terminal as TerminalIcon, Trash2, Plus, RotateCcw, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { wsClient } from '../services/websocket';
import { ControllerMessage } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useContextMenu, ContextMenuItem } from './ContextMenu';
import { logger } from '../utils/logger';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  onOpenSettings?: (tab?: 'connection' | 'terminal' | 'appearance') => void;
}

interface TerminalSession {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  connected: boolean;
  isMounted: boolean;
  shellType?: string;
  messageHandler?: (msg: ControllerMessage) => void;
}

export function Terminal({ isOpen, onClose, onToggleMaximize, isMaximized = false, onOpenSettings }: TerminalProps) {
  const { settings } = useSettings();
  const { showContextMenu } = useContextMenu();
  const [sessions, setSessions] = useState<Map<string, TerminalSession>>(new Map());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [availableShells, setAvailableShells] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionCounterRef = useRef(0);
  const sessionsRef = useRef<Map<string, TerminalSession>>(new Map());
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const actionsButtonRef = useRef<HTMLButtonElement | null>(null);

  // Create a new terminal session with interactive shell
  const createSession = useCallback((shellOverride?: string) => {
    const sessionId = `term-${++sessionCounterRef.current}`;
    const shellToUse = shellOverride || settings.defaultShell;
    
    const terminal = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Handle user input - send directly to remote shell
    terminal.onData((data) => {
      logger.log('[Terminal] User input captured:', { sessionId, dataLen: data.length, data: data.substring(0, 20) });
      // Send all input directly to the remote shell
      wsClient.sendTerminalInput(sessionId, data);
    });

    // Handle message from controller
    const messageHandler = (msg: ControllerMessage) => {
      // Match by message ID or terminalId in payload (controller uses id: terminalId for routing)
      const isForThisTerminal = msg.id === sessionId || msg.payload?.terminalId === sessionId;
      
      logger.log('[Terminal] Message received:', {
        type: msg.type,
        msgId: msg.id,
        payloadTerminalId: msg.payload?.terminalId,
        sessionId: sessionId,
        msgIdMatchesSession: msg.id === sessionId,
        payloadIdMatchesSession: msg.payload?.terminalId === sessionId,
        isForThisTerminal,
        outputLen: msg.payload?.output?.length
      });
      
      if (msg.type === 'terminalOutput' && isForThisTerminal) {
        const output = msg.payload.output || '';
        const session = sessionsRef.current.get(sessionId);
        
        // Capture shell type if provided
        if (msg.payload.shellType && session) {
          session.shellType = msg.payload.shellType;
          logger.log(`[Terminal] Shell type detected: ${msg.payload.shellType}`);
        }
        
        logger.log('[Terminal] Writing output to terminal:', {
          outputPreview: output.substring(0, 100),
          isMounted: session?.isMounted,
          terminalElement: terminal.element
        });
        
        if (session?.isMounted) {
          try {
            terminal.write(output);
            logger.log('[Terminal] Write successful');
          } catch (e) {
            console.error('[Terminal] Write error:', e);
          }
        } else {
          console.warn('[Terminal] Terminal not mounted yet, output will be lost:', output.substring(0, 50));
        }
      } else if (msg.type === 'terminalExit' && isForThisTerminal) {
        logger.log('[Terminal] Terminal exit received');
        terminal.writeln('\r\n\x1b[31m[Terminal session ended]\x1b[0m');
        setSessions(prev => {
          const s = prev.get(sessionId);
          if (s) {
            const ns = new Map(prev);
            ns.set(sessionId, { ...s, connected: false });
            return ns;
          }
          return prev;
        });
      } else if (!isForThisTerminal) {
        logger.log('[Terminal] Message ignored - not for this terminal');
      }
    };

    wsClient.addMessageHandler(messageHandler);

    const session: TerminalSession = {
      id: sessionId,
      terminal,
      fitAddon,
      connected: false,
      isMounted: false,
      messageHandler,
    };

    setSessions(prev => {
      const newSessions = new Map(prev).set(sessionId, session);
      sessionsRef.current = newSessions;
      return newSessions;
    });
    setActiveSessionId(sessionId);

    // Spawn interactive shell on the remote with explicit shell type
    logger.log('[Terminal] Spawning terminal with id:', sessionId, 'shell:', shellToUse);
    
    // Ensure we're connected before spawning
    if (wsClient.isConnected()) {
      wsClient.spawnTerminal(sessionId, undefined, shellToUse, 120, 30);
    } else {
      logger.warn('[Terminal] WebSocket not connected, waiting for connection...');
      // Wait for connection and retry once
      const checkConnection = setInterval(() => {
        if (wsClient.isConnected()) {
          clearInterval(checkConnection);
          logger.log('[Terminal] Connection established, spawning terminal');
          wsClient.spawnTerminal(sessionId, undefined, shellToUse, 120, 30);
        }
      }, 100);
      
      // Give up after 5 seconds
      setTimeout(() => {
        clearInterval(checkConnection);
        if (!wsClient.isConnected()) {
          terminal.writeln('\r\n\x1b[31m[Error: Not connected to controller]\x1b[0m');
          terminal.writeln('\x1b[33mPlease check your connection settings and ensure the controller is running.\x1b[0m');
        }
      }, 5000);
    }

    // Mark as connected after a short delay (shell should respond with prompt)
    setTimeout(() => {
      setSessions(prev => {
        const s = prev.get(sessionId);
        if (s) {
          const ns = new Map(prev);
          ns.set(sessionId, { ...s, connected: true });
          return ns;
        }
        return prev;
      });
    }, 500);

    return sessionId;
  }, [settings.defaultShell]);

  // Track open state transitions to avoid respawning while closing
  const wasOpenRef = useRef(false);

  // Mount terminal to DOM when container is ready
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const activeSession = activeSessionId ? sessionsRef.current.get(activeSessionId) : null;
    
    if (activeSession && containerRef.current && !activeSession.isMounted) {
      logger.log('[Terminal] Mounting terminal to DOM:', activeSession.id);
      // Clear container first
      containerRef.current.innerHTML = '';
      activeSession.terminal.open(containerRef.current);
      
      // Mark as mounted
      activeSession.isMounted = true;
      setSessions(prev => {
        const updated = new Map(prev);
        sessionsRef.current = updated;
        return updated;
      });
      
      activeSession.fitAddon.fit();
      activeSession.terminal.focus();
      logger.log('[Terminal] Terminal mounted successfully, element:', activeSession.terminal.element);

      // Send resize to remote
      const dims = activeSession.fitAddon.proposeDimensions();
      if (dims) {
        wsClient.resizeTerminal(activeSession.id, dims.cols, dims.rows);
      }
    }
  }, [isOpen, activeSessionId]);

  // Handle resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;
      if (activeSession) {
        activeSession.fitAddon.fit();
        // Send resize to remote
        const dims = activeSession.fitAddon.proposeDimensions();
        if (dims) {
          wsClient.resizeTerminal(activeSession.id, dims.cols, dims.rows);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Fit after a small delay to ensure container is properly sized
    const timeout = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [isOpen, activeSessionId, sessions]);

  // Request available shells from local system via Tauri
  useEffect(() => {
    if (!isOpen) return;

    const detectShells = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const shells = await invoke<string[]>('get_available_shells');
        setAvailableShells(shells);
      } catch (err) {
        console.error('Failed to detect shells:', err);
        // Fallback to platform-appropriate defaults
        const platform = navigator.platform.toLowerCase();
        const isWindows = platform.includes('win');
        const isMac = platform.includes('mac');
        
        const defaultShells = isWindows
          ? ['pwsh', 'powershell', 'cmd']
          : isMac
          ? ['zsh', 'bash', 'sh']
          : ['bash', 'zsh', 'sh'];
        
        setAvailableShells(defaultShells);
      }
    };

    detectShells();
  }, [isOpen]);

  // Create first session only when panel transitions to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (sessions.size === 0) {
        createSession();
      }
      wasOpenRef.current = true;
    } else if (!isOpen) {
      wasOpenRef.current = false;
      setActionsOpen(false);
    }
  }, [isOpen, sessions.size, createSession]);

  // Close actions menu on outside click
  useEffect(() => {
    if (!actionsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionsMenuRef.current && actionsButtonRef.current) {
        const insideMenu = actionsMenuRef.current.contains(target);
        const insideButton = actionsButtonRef.current.contains(target);
        if (!insideMenu && !insideButton) {
          setActionsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actionsOpen]);

  // Cleanup sessions on unmount
  useEffect(() => {
    return () => {
      // Use ref to access current sessions at cleanup time
      sessionsRef.current.forEach(session => {
        // Remove message handler
        if (session.messageHandler) {
          wsClient.removeMessageHandler(session.messageHandler);
        }
        // Kill the terminal
        wsClient.killTerminal(session.id);
        // Dispose local terminal
        session.terminal.dispose();
      });
      sessionsRef.current = new Map();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount

  // Create initial session when terminal is first opened
  useEffect(() => {
    if (isOpen && sessions.size === 0 && wsClient.isConnected()) {
      logger.log('[Terminal] Creating initial session');
      createSession();
    }
  }, [isOpen, sessions.size, createSession]);

  const handleClear = () => {
    const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;
    if (activeSession) {
      activeSession.terminal.clear();
    }
  };

  const handleCloseSession = (sessionId: string) => {
    const session = sessions.get(sessionId);
    if (session) {
      // Remove message handler
      if (session.messageHandler) {
        wsClient.removeMessageHandler(session.messageHandler);
      }
      // Kill terminal
      wsClient.killTerminal(sessionId);
      // Dispose local terminal
      session.terminal.dispose();

      const newSessions = new Map(sessions);
      newSessions.delete(sessionId);
      sessionsRef.current = newSessions;
      setSessions(newSessions);

      // Switch to another session if available
      if (activeSessionId === sessionId) {
        const nextId = newSessions.size > 0 ? Array.from(newSessions.keys())[0] : null;
        setActiveSessionId(nextId);
      }

      // If no sessions remain, close the panel to match the expected behavior
      if (newSessions.size === 0) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;

  return (
    <div className="flex flex-col border-t border-border bg-bg-primary">
      {/* Header - match the shown design */}
      <div className="flex items-center justify-between bg-[#2d2d2d] h-10 select-none px-1">
        <div className="flex items-center h-full">
          {/* Left label with icon */}
          <div className="flex items-center gap-2 pl-2 pr-3 text-sm font-semibold text-text-primary">
            <TerminalIcon size={14} />
            <span>Terminal</span>
          </div>

          {/* Terminal tabs */}
          {Array.from(sessions.entries()).map(([id, session]) => (
            <button
              key={id}
              onClick={() => setActiveSessionId(id)}
              className={`relative flex items-center gap-1 pl-4 pr-2 h-full text-sm font-medium transition-colors cursor-pointer border-0 ${
                id === activeSessionId
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{session.shellType || 'pwsh'}</span>
              {!session.connected && <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />}
              <X
                size={14}
                className="ml-3 opacity-60 hover:opacity-100 hover:text-text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseSession(id);
                }}
                title="Close"
              />
              <span
                className={`absolute left-2 right-2 bottom-0 h-[2px] ${
                  id === activeSessionId ? 'bg-[#4b8bfa]' : 'bg-transparent'
                }`}
                aria-hidden
              />
            </button>
          ))}

          {/* Action buttons group */}
          <div className="flex items-center h-full px-0 gap-0.5 ml-0">
            <button
              onClick={() => createSession()}
              className="p-1 hover:bg-[#383838] transition-colors rounded"
              title="New Terminal"
            >
              <Plus size={16} className="text-text-secondary hover:text-text-primary" />
            </button>
            <div className="relative">
              <button
                ref={actionsButtonRef}
                onClick={() => setActionsOpen((open) => !open)}
                className="p-1 hover:bg-[#383838] transition-colors rounded"
                title="More Actions"
              >
                <ChevronDown size={16} className="text-text-secondary hover:text-text-primary" />
              </button>

              {actionsOpen && (
                <div
                  ref={actionsMenuRef}
                  className="absolute left-0 bottom-full mb-1 z-20 min-w-[200px] border border-[#454545] bg-[#252526] shadow-[0_0_8px_rgba(0,0,0,0.4)]"
                >
                {availableShells.length > 0 ? availableShells.map(shell => (
                  <button
                    key={shell}
                    onClick={() => {
                      setActionsOpen(false);
                      createSession(shell);
                    }}
                    className="flex w-full items-center px-3 py-2 text-sm text-text-primary hover:bg-[#333]"
                  >
                    <span>{shell}</span>
                  </button>
                )) : (
                  <div className="px-3 py-2 text-sm text-text-secondary">Loading shells...</div>
                )}
                <div className="h-px bg-border" />
                <button
                  onClick={() => {
                    setActionsOpen(false);
                    onOpenSettings?.('terminal');
                  }}
                  className="flex w-full items-center px-3 py-2 text-sm text-text-primary hover:bg-[#333]"
                >
                  <span>Settings</span>
                </button>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 px-2">
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 hover:bg-[#383838] transition-colors rounded"
              title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
            >
              {isMaximized
                ? <ChevronDown size={16} className="text-text-secondary hover:text-text-primary" />
                : <ChevronUp size={16} className="text-text-secondary hover:text-text-primary" />
              }
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#383838] transition-colors rounded"
            title="Close Panel"
          >
            <X size={16} className="text-text-secondary hover:text-text-primary" />
          </button>
        </div>
      </div>

      {/* Terminal container */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[#1e1e1e] overflow-hidden pl-2 pt-2"
        style={{ minHeight: 0 }}
        data-context-menu
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const terminal = activeSession?.terminal;
          const hasSelection = terminal?.hasSelection();
          
          const items: ContextMenuItem[] = [];
          
          if (hasSelection) {
            items.push({
              label: 'Copy',
              shortcut: 'Ctrl+C',
              action: () => {
                const selection = terminal?.getSelection();
                if (selection) {
                  navigator.clipboard.writeText(selection);
                }
              },
            });
          }
          
          items.push({
            label: 'Paste',
            shortcut: 'Ctrl+V',
            action: async () => {
              const text = await navigator.clipboard.readText();
              if (text && activeSessionId) {
                wsClient.sendTerminalInput(activeSessionId, text);
              }
            },
          });
          
          if (hasSelection) {
            items.push({ divider: true });
            items.push({
              label: 'Select All',
              shortcut: 'Ctrl+A',
              action: () => terminal?.selectAll(),
            });
          }
          
          items.push({ divider: true });
          items.push({
            label: 'Clear',
            action: () => terminal?.clear(),
          });
          
          showContextMenu(e, items);
        }}
      />
    </div>
  );
}
