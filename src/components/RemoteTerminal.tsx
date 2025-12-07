import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Terminal as TerminalIcon, Trash2, Plus, RotateCcw } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { wsClient } from '../services/websocket';
import { ControllerMessage } from '../types';
import { useSettings } from '../hooks/useSettings';
import { logger } from '../utils/logger';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TerminalSession {
  id: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  connected: boolean;
  isMounted: boolean;
  shellType?: string;
  messageHandler?: (msg: ControllerMessage) => void;
}

export function RemoteTerminal({ isOpen, onClose }: TerminalProps) {
  const { settings } = useSettings();
  const [sessions, setSessions] = useState<Map<string, TerminalSession>>(new Map());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionCounterRef = useRef(0);
  const sessionsRef = useRef<Map<string, TerminalSession>>(new Map());

  // Create a new terminal session with interactive shell
  const createSession = useCallback(() => {
    const sessionId = `term-${++sessionCounterRef.current}`;
    const shellToUse = settings.defaultShell;
    
    const terminal = new Terminal({
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
      logger.log('[RemoteTerminal] User input captured:', { sessionId, dataLen: data.length, data: data.substring(0, 20) });
      // Send all input directly to the remote shell
      wsClient.sendTerminalInput(sessionId, data);
    });

    // Handle message from controller
    const messageHandler = (msg: ControllerMessage) => {
      // Match by message ID or terminalId in payload (controller uses id: terminalId for routing)
      const isForThisTerminal = msg.id === sessionId || msg.payload?.terminalId === sessionId;
      
      logger.log('[RemoteTerminal] Message received:', {
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
          logger.log(`[RemoteTerminal] Shell type detected: ${msg.payload.shellType}`);
        }
        
        logger.log('[RemoteTerminal] Writing output to terminal:', {
          outputPreview: output.substring(0, 100),
          isMounted: session?.isMounted,
          terminalElement: terminal.element
        });
        
        if (session?.isMounted) {
          try {
            terminal.write(output);
            logger.log('[RemoteTerminal] Write successful');
          } catch (e) {
            console.error('[RemoteTerminal] Write error:', e);
          }
        } else {
          console.warn('[RemoteTerminal] Terminal not mounted yet, output will be lost:', output.substring(0, 50));
        }
      } else if (msg.type === 'terminalExit' && isForThisTerminal) {
        logger.log('[RemoteTerminal] Terminal exit received');
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
        logger.log('[RemoteTerminal] Message ignored - not for this terminal');
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
    logger.log('[RemoteTerminal] Spawning terminal with id:', sessionId, 'shell:', shellToUse);
    wsClient.spawnTerminal(sessionId, undefined, shellToUse, 120, 30);

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

  // Mount terminal to DOM when container is ready
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const activeSession = activeSessionId ? sessionsRef.current.get(activeSessionId) : null;
    
    if (activeSession && containerRef.current && !activeSession.isMounted) {
      logger.log('[RemoteTerminal] Mounting terminal to DOM:', activeSession.id);
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
      logger.log('[RemoteTerminal] Terminal mounted successfully, element:', activeSession.terminal.element);

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

  // Create first session when opened
  useEffect(() => {
    if (isOpen && sessions.size === 0) {
      createSession();
    }
  }, [isOpen, sessions.size, createSession]);

  // Cleanup sessions on unmount
  useEffect(() => {
    return () => {
      // Use ref to access current sessions at cleanup time
      sessionsRef.current.forEach(session => {
        // Remove message handler
        if (session.messageHandler) {
          wsClient.removeMessageHandler(session.messageHandler);
        }
        // Kill the remote terminal
        wsClient.killTerminal(session.id);
        // Dispose local terminal
        session.terminal.dispose();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on unmount

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
      // Kill remote terminal
      wsClient.killTerminal(sessionId);
      // Dispose local terminal
      session.terminal.dispose();
      
      setSessions(prev => {
        const newSessions = new Map(prev);
        newSessions.delete(sessionId);
        sessionsRef.current = newSessions;
        return newSessions;
      });

      // Switch to another session if available
      if (activeSessionId === sessionId) {
        const remaining = Array.from(sessions.keys()).filter(id => id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  if (!isOpen) return null;

  const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border w-[85vw] h-[75vh] max-w-[1100px] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary">
          <div className="flex items-center gap-2">
            <TerminalIcon size={16} className="text-accent" />
            <span className="text-sm font-medium text-text-primary">Remote Terminal</span>
            {activeSession && (
              <span className={`text-xs px-1.5 py-0.5 ${
                activeSession.connected 
                  ? 'text-success bg-success/10' 
                  : 'text-warning bg-warning/10 animate-pulse'
              }`}>
                {activeSession.connected ? 'Connected' : 'Connecting...'}
              </span>
            )}
          </div>
          
          {/* Tab bar */}
          <div className="flex items-center gap-1">
            {Array.from(sessions.entries()).map(([id, session]) => (
              <button
                key={id}
                onClick={() => setActiveSessionId(id)}
                className={`flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                  id === activeSessionId 
                    ? 'bg-accent text-white' 
                    : 'bg-bg-hover text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{id}</span>
                {!session.connected && <span className="w-1.5 h-1.5 bg-warning animate-pulse" />}
                <X
                  size={12}
                  className="hover:text-error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSession(id);
                  }}
                />
              </button>
            ))}
            <button
              onClick={() => createSession()}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="New terminal"
            >
              <Plus size={14} className="text-text-secondary hover:text-text-primary" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="Clear terminal"
            >
              <Trash2 size={16} className="text-text-secondary hover:text-text-primary" />
            </button>
            <button
              onClick={() => {
                const activeSession = activeSessionId ? sessions.get(activeSessionId) : null;
                if (activeSession) {
                  activeSession.fitAddon.fit();
                  const dims = activeSession.fitAddon.proposeDimensions();
                  if (dims) {
                    wsClient.resizeTerminal(activeSession.id, dims.cols, dims.rows);
                  }
                }
              }}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="Fit terminal"
            >
              <RotateCcw size={16} className="text-text-secondary hover:text-text-primary" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-bg-hover transition-colors"
              title="Close terminal"
            >
              <X size={18} className="text-text-secondary hover:text-text-primary" />
            </button>
          </div>
        </div>

        {/* Terminal container */}
        <div 
          ref={containerRef}
          className="flex-1 bg-[#1e1e1e] p-2"
          style={{ minHeight: 0 }}
        />
      </div>
    </div>
  );
}
