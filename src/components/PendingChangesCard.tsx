import { useState } from 'react';
import { FileEdit, FilePlus, ChevronDown, ChevronRight, Check, X, Eye } from 'lucide-react';
import { PendingChange } from '../types';

interface PendingChangesCardProps {
  changes: PendingChange[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
}

// Inline diff viewer component
function InlineDiffViewer({ diff, maxHeight }: { diff: string; maxHeight?: string }) {
  const lines = diff.split('\n');
  
  const getLineStyle = (line: string) => {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      return 'bg-success/10 text-success';
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
      return 'bg-error/10 text-error';
    }
    if (line.startsWith('@@')) {
      return 'bg-info/10 text-info';
    }
    return 'text-text-secondary';
  };

  return (
    <div 
      className="font-mono text-xs bg-bg-tertiary border border-border overflow-auto"
      style={{ maxHeight: maxHeight || '200px' }}
    >
      {lines.map((line, i) => (
        <div key={i} className={`px-2 py-0.5 ${getLineStyle(line)}`}>
          <span className="select-all whitespace-pre">{line || ' '}</span>
        </div>
      ))}
    </div>
  );
}

export function PendingChangesCard({ 
  changes, 
  onApprove, 
  onReject, 
  onApproveAll, 
  onRejectAll 
}: PendingChangesCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const pendingChanges = changes.filter(c => c.status === 'pending');

  const totalAdditions = changes.reduce((sum, c) => sum + (c.additions || 0), 0);
  const totalDeletions = changes.reduce((sum, c) => sum + (c.deletions || 0), 0);

  const toggleFileExpanded = (changeId: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(changeId)) {
        next.delete(changeId);
      } else {
        next.add(changeId);
      }
      return next;
    });
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const getFileIcon = (type: string) => {
    return type === 'write' ? (
      <FilePlus size={14} className="text-success" />
    ) : (
      <FileEdit size={14} className="text-warning" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="text-xs px-1.5 py-0.5 bg-success/20 text-success">Kept</span>;
      case 'rejected':
        return <span className="text-xs px-1.5 py-0.5 bg-error/20 text-error">Undone</span>;
      default:
        return null;
    }
  };

  if (changes.length === 0) return null;

  const allResolved = pendingChanges.length === 0;

  return (
    <div className="mt-3 border border-border bg-bg-secondary overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-bg-tertiary cursor-pointer hover:bg-bg-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-sm font-medium">
            {changes.length} file{changes.length !== 1 ? 's' : ''} changed
          </span>
          <span className="text-xs text-success">+{totalAdditions}</span>
          <span className="text-xs text-error">-{totalDeletions}</span>
        </div>

        {!allResolved && (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={onApproveAll}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-success/10 hover:bg-success/20 text-success border border-success/30 transition-colors"
            >
              Keep
            </button>
            <button
              onClick={onRejectAll}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-bg-secondary hover:bg-bg-hover text-text-secondary border border-border transition-colors"
            >
              Undo
            </button>
          </div>
        )}
      </div>

      {/* File list */}
      {expanded && (
        <div className="divide-y divide-border">
          {changes.map(change => (
            <div key={change.id} className="bg-bg-primary">
              {/* File header */}
              <div className="flex items-center justify-between px-3 py-2 hover:bg-bg-hover transition-colors">
                <div 
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={() => toggleFileExpanded(change.id)}
                >
                  {expandedFiles.has(change.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {getFileIcon(change.type)}
                  <span className="text-sm font-mono text-text-primary truncate">
                    {getFileName(change.path)}
                  </span>
                  <span className="text-xs text-text-secondary truncate hidden sm:inline">
                    {change.path}
                  </span>
                  <span className="text-xs text-success ml-auto">+{change.additions || 0}</span>
                  <span className="text-xs text-error">-{change.deletions || 0}</span>
                </div>

                <div className="flex items-center gap-2 ml-2">
                  {getStatusBadge(change.status)}
                  {change.status === 'pending' && (
                    <>
                      <button
                        onClick={() => toggleFileExpanded(change.id)}
                        className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                        title="View diff"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onApprove(change.id)}
                        className="p-1 text-success hover:bg-success/10 transition-colors"
                        title="Keep this change"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => onReject(change.id)}
                        className="p-1 text-error hover:bg-error/10 transition-colors"
                        title="Undo this change"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Diff viewer */}
              {expandedFiles.has(change.id) && change.diff && (
                <div className="px-3 pb-3">
                  <InlineDiffViewer diff={change.diff} maxHeight="300px" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
