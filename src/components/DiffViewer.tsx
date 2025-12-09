import { X, Check, Undo2 } from 'lucide-react';
import { PendingChange } from '../types';

interface DiffViewerProps {
  change: PendingChange | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
}

export function DiffViewer({ change, isOpen, onClose, onApprove, onReject }: DiffViewerProps) {
  if (!isOpen || !change) {
    return null;
  }

  // Parse unified diff into lines
  const diffLines = change.diff.split('\n');
  
  // Find hunk headers and content
  const parsedLines: Array<{ type: 'header' | 'context' | 'add' | 'delete' | 'meta'; content: string }> = [];
  
  for (const line of diffLines) {
    if (line.startsWith('---') || line.startsWith('+++')) {
      parsedLines.push({ type: 'meta', content: line });
    } else if (line.startsWith('@@')) {
      parsedLines.push({ type: 'header', content: line });
    } else if (line.startsWith('+')) {
      parsedLines.push({ type: 'add', content: line.substring(1) });
    } else if (line.startsWith('-')) {
      parsedLines.push({ type: 'delete', content: line.substring(1) });
    } else if (line.startsWith(' ')) {
      parsedLines.push({ type: 'context', content: line.substring(1) });
    } else {
      parsedLines.push({ type: 'context', content: line });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border w-[90vw] h-[85vh] max-w-[1200px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">{change.path}</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
              <span className="text-success">+{change.additions} lines added</span>
              <span className="text-error">-{change.deletions} lines deleted</span>
              <span>{new Date(change.timestamp).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onApprove(change.id);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-success text-white hover:bg-success/90 transition-colors"
            >
              <Check size={16} />
              <span>Keep</span>
            </button>
            <button
              onClick={() => {
                onReject(change.id);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Undo2 size={16} />
              <span>Undo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto bg-bg-tertiary font-mono text-sm">
          <table className="w-full border-collapse">
            <tbody>
              {parsedLines.map((line, index) => {
                let bgColor = '';
                let textColor = 'text-text-primary';
                let lineNumberBg = 'bg-bg-secondary';

                if (line.type === 'add') {
                  bgColor = 'bg-success/10';
                  textColor = 'text-success';
                } else if (line.type === 'delete') {
                  bgColor = 'bg-error/10';
                  textColor = 'text-error';
                } else if (line.type === 'header') {
                  bgColor = 'bg-accent/10';
                  textColor = 'text-accent';
                  lineNumberBg = 'bg-accent/10';
                } else if (line.type === 'meta') {
                  bgColor = 'bg-bg-secondary';
                  textColor = 'text-text-secondary';
                  lineNumberBg = 'bg-bg-secondary';
                }

                const linePrefix = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' ';

                return (
                  <tr key={index} className={bgColor}>
                    <td className={`px-3 py-0.5 text-right text-text-secondary border-r border-border select-none ${lineNumberBg}`} style={{ width: '60px' }}>
                      {line.type !== 'meta' && line.type !== 'header' && <span>{index + 1}</span>}
                    </td>
                    <td className={`px-2 py-0.5 ${textColor} whitespace-pre`}>
                      <span className="select-none opacity-50">{linePrefix}</span>
                      <span>{line.content}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 border-t border-border bg-bg-secondary text-xs text-text-secondary">
          <div className="flex items-center gap-4">
            <span>Type: <span className="text-text-primary font-medium">{change.type === 'edit' ? 'Edit' : 'Write'}</span></span>
            <span>Status: <span className="text-warning font-medium">Pending Approval</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
