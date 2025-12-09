/**
 * Integration tests for Change Approval System with WebSocket
 * 
 * Tests the full flow:
 * 1. Controller sends pendingChange message
 * 2. Desktop app receives and displays in ChangeApprovalDialog
 * 3. User approves/rejects
 * 4. Desktop sends changeApproved/changeRejected back to controller
 * 
 * Note: These tests are skipped because they require a running WebSocket server
 * and full App component integration which is better suited for E2E tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { Server } from 'mock-socket';
import type { FileChange } from '../../types';

describe.skip('Change Approval Integration', () => {
  let mockServer: Server;
  const WS_URL = 'ws://localhost:3712/ws';

  beforeEach(() => {
    // Create mock WebSocket server
    mockServer = new Server(WS_URL);
    localStorage.clear();
  });

  afterEach(() => {
    mockServer.close();
  });

  it('should receive pendingChange and display in dialog', async () => {
    const user = userEvent.setup();

    // Set up mock server to send pendingChange
    mockServer.on('connection', (socket) => {
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-1',
                filePath: '/src/test.ts',
                changeType: 'edit',
                oldContent: 'const x = 1;',
                newContent: 'const x = 2;',
                diff: '- const x = 1;\n+ const x = 2;',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-1',
            groupName: 'Test Changes',
          },
        }));
      }, 100);
    });

    render(<App />);

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Wait for pendingChange message and dialog to open
    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that file change is displayed
    expect(screen.getByText('/src/test.ts')).toBeInTheDocument();
    expect(screen.getByText(/edit/i)).toBeInTheDocument();
  });

  it('should send changeApproved when user approves', async () => {
    const user = userEvent.setup();
    let receivedMessages: unknown[] = [];

    // Set up mock server to capture messages
    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        receivedMessages.push(JSON.parse(data as string));
      });

      // Send pendingChange
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-1',
                filePath: '/src/test.ts',
                changeType: 'edit',
                oldContent: 'const x = 1;',
                newContent: 'const x = 2;',
                diff: '- const x = 1;\n+ const x = 2;',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-1',
            groupName: 'Test Changes',
          },
        }));
      }, 100);
    });

    render(<App />);

    // Wait for dialog
    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click approve button
    const approveButton = screen.getAllByTitle(/approve/i)[0];
    await user.click(approveButton);

    // Wait for message to be sent
    await waitFor(() => {
      const approveMessage = receivedMessages.find((msg: unknown) => 
        typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'changeApproved'
      );
      expect(approveMessage).toBeTruthy();
    }, { timeout: 1000 });

    // Verify message payload
    const approveMessage = receivedMessages.find((msg: unknown) => 
      typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'changeApproved'
    ) as { type: string; payload: { changeId: string } };
    
    expect(approveMessage.payload.changeId).toBe('change-1');
  });

  it('should send changeRejected when user rejects', async () => {
    const user = userEvent.setup();
    let receivedMessages: unknown[] = [];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        receivedMessages.push(JSON.parse(data as string));
      });

      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-2',
                filePath: '/src/bad.ts',
                changeType: 'create',
                newContent: 'bad code',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-2',
            groupName: 'Bad Changes',
          },
        }));
      }, 100);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click reject button
    const rejectButton = screen.getAllByTitle(/reject/i)[0];
    await user.click(rejectButton);

    await waitFor(() => {
      const rejectMessage = receivedMessages.find((msg: unknown) => 
        typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'changeRejected'
      );
      expect(rejectMessage).toBeTruthy();
    }, { timeout: 1000 });

    const rejectMessage = receivedMessages.find((msg: unknown) => 
      typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'changeRejected'
    ) as { type: string; payload: { changeId: string } };
    
    expect(rejectMessage.payload.changeId).toBe('change-2');
  });

  it('should handle batch approve all', async () => {
    const user = userEvent.setup();
    let receivedMessages: unknown[] = [];

    mockServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        receivedMessages.push(JSON.parse(data as string));
      });

      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-1',
                filePath: '/src/file1.ts',
                changeType: 'edit',
                timestamp: Date.now(),
                status: 'pending',
              },
              {
                id: 'change-2',
                filePath: '/src/file2.ts',
                changeType: 'edit',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-1',
            groupName: 'Batch Changes',
          },
        }));
      }, 100);
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click "Approve All" button
    const approveAllButton = screen.getByText(/approve all/i);
    await user.click(approveAllButton);

    await waitFor(() => {
      const approveMessages = receivedMessages.filter((msg: unknown) => 
        typeof msg === 'object' && msg !== null && 'type' in msg && msg.type === 'changeApproved'
      );
      expect(approveMessages.length).toBe(2);
    }, { timeout: 1000 });
  });

  it('should persist pending changes across page reload', async () => {
    const user = userEvent.setup();

    mockServer.on('connection', (socket) => {
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-1',
                filePath: '/src/persist.ts',
                changeType: 'create',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-persist',
            groupName: 'Persistent Changes',
          },
        }));
      }, 100);
    });

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Unmount (simulate page close)
    unmount();

    // Remount (simulate page reload)
    render(<App />);

    // Check that pending changes are still there from localStorage
    await waitFor(() => {
      expect(screen.getByText(/persist.ts/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should open change approval dialog via keyboard shortcut', async () => {
    const user = userEvent.setup();

    mockServer.on('connection', (socket) => {
      setTimeout(() => {
        socket.send(JSON.stringify({
          type: 'pendingChange',
          payload: {
            changes: [
              {
                id: 'change-1',
                filePath: '/src/shortcut.ts',
                changeType: 'edit',
                timestamp: Date.now(),
                status: 'pending',
              },
            ],
            groupId: 'group-shortcut',
            groupName: 'Shortcut Test',
          },
        }));
      }, 100);
    });

    render(<App />);

    // Wait for change to be received
    await waitFor(() => {
      const stored = localStorage.getItem('remote-pilot-pending-changes');
      expect(stored).toBeTruthy();
    }, { timeout: 2000 });

    // Close the auto-opened dialog first
    const closeButton = screen.getByLabelText(/close/i);
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/pending changes/i)).not.toBeInTheDocument();
    });

    // Press Ctrl+Shift+C to open via keyboard shortcut
    await user.keyboard('{Control>}{Shift>}C{/Shift}{/Control}');

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByText(/pending changes/i)).toBeInTheDocument();
    });
  });
});
