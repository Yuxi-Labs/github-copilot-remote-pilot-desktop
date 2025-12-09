import { useState } from 'react';
import { X, Check, Undo2, Eye, FileEdit, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { PendingChange } from '../types';

interface PendingChangesPanelProps {
  changes: PendingChange[];
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onViewDiff: (changeId: string) => void;
}

export function PendingChangesPanel({
  changes,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  onViewDiff,
}: PendingChangesPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (changes.length === 0) {
    return null;
  }

  const pendingChanges = changes.filter(c => c.status === 'pending');

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-warning text-white shadow-lg hover:bg-warning/90 transition-colors"
          title="Show pending changes"
        >
          <FileEdit size={16} />
          <span className="font-medium">{pendingChanges.length} files changed</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[450px] bg-bg-secondary border border-warning shadow-2xl z-50 flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-warning/10 border-b border-warning">
        <div className="flex items-center gap-2">
          <FileEdit size={16} className="text-warning" />
          <span className="text-sm font-semibold text-warning">
            {pendingChanges.length} file{pendingChanges.length !== 1 ? 's' : ''} changed
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-bg-hover transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-bg-hover transition-colors"
            title="Minimize"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Batch Actions */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-bg-tertiary">
            <button
              onClick={onApproveAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-success text-white hover:bg-success/90 transition-colors"
            >
              <Check size={14} />
              <span>Keep All</span>
            </button>
            <button
              onClick={onRejectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-error text-white hover:bg-error/90 transition-colors"
            >
              <Undo2 size={14} />
              <span>Undo All</span>
            </button>
          </div>

          {/* Change List */}
          <div className="flex-1 overflow-y-auto">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="px-4 py-3 border-b border-border hover:bg-bg-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {change.type === 'edit' ? (
                        <FileEdit size={14} className="text-accent flex-shrink-0" />
                      ) : (
                        <FileText size={14} className="text-accent flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-text-primary truncate" title={change.path}>
                        {change.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="text-success">+{change.additions}</span>
                      <span className="text-error">-{change.deletions}</span>
                      <span>{new Date(change.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => onApprove(change.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-success text-white hover:bg-success/90 transition-colors"
                    title="Accept this change"
                  >
                    <Check size={12} />
                    <span>Keep</span>
                  </button>
                  <button
                    onClick={() => onReject(change.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-error text-white hover:bg-error/90 transition-colors"
                    title="Reject this change"
                  >
                    <Undo2 size={12} />
                    <span>Undo</span>
                  </button>
                  <button
                    onClick={() => onViewDiff(change.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border hover:bg-bg-hover transition-colors"
                    title="View diff"
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
