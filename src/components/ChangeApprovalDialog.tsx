import { useState } from 'react';
import { FileChange, ChangeGroup } from '../types/changes';
import { Check, X, FileEdit, FileText, FilePlus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

interface ChangeApprovalDialogProps {
  groups: ChangeGroup[];
  onApprove: (groupId: string, changeId: string) => void;
  onReject: (groupId: string, changeId: string) => void;
  onApproveAll: (groupId: string) => void;
  onRejectAll: (groupId: string) => void;
  onClose: () => void;
}

export function ChangeApprovalDialog({
  groups,
  onApprove,
  onReject,
  onApproveAll,
  onRejectAll,
  onClose,
}: ChangeApprovalDialogProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleChange = (changeId: string) => {
    const newExpanded = new Set(expandedChanges);
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId);
    } else {
      newExpanded.add(changeId);
    }
    setExpandedChanges(newExpanded);
  };

  const getChangeIcon = (type: FileChange['type']) => {
    switch (type) {
      case 'create': return <FilePlus size={16} className="text-green-500" />;
      case 'edit': return <FileEdit size={16} className="text-blue-500" />;
      case 'delete': return <Trash2 size={16} className="text-red-500" />;
    }
  };

  const pendingCount = groups.reduce((count, group) => {
    return count + group.changes.filter(c => c.status === 'pending').length;
  }, 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="text-accent" size={20} />
            <h2 className="text-lg font-semibold text-text-primary">
              Pending Changes
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-accent/20 text-accent rounded">
                  {pendingCount} pending
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded"
            aria-label="Close"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Change Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {groups.map((group) => {
            const pendingInGroup = group.changes.filter(c => c.status === 'pending').length;
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id} className="border border-border rounded-lg overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center justify-between p-3 bg-bg-secondary">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-medium text-text-primary">
                      {group.description || `Change Group ${group.id.slice(0, 8)}`}
                    </span>
                    {pendingInGroup > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded">
                        {pendingInGroup} pending
                      </span>
                    )}
                  </button>
                  {pendingInGroup > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onApproveAll(group.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded"
                      >
                        <Check size={12} />
                        Approve All
                      </button>
                      <button
                        onClick={() => onRejectAll(group.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded"
                      >
                        <X size={12} />
                        Reject All
                      </button>
                    </div>
                  )}
                </div>

                {/* Changes List */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {group.changes.map((change) => {
                      const isChangeExpanded = expandedChanges.has(change.id);
                      
                      return (
                        <div key={change.id} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => toggleChange(change.id)}
                              className="flex items-center gap-2 flex-1 text-left"
                            >
                              {getChangeIcon(change.type)}
                              <span className="text-sm font-mono text-text-primary">{change.path}</span>
                              <span className="text-xs text-text-secondary capitalize">({change.type})</span>
                              {isChangeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {change.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onApprove(group.id, change.id)}
                                  className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => onReject(group.id, change.id)}
                                  className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            )}
                            {change.status === 'approved' && (
                              <span className="text-xs text-green-500">✓ Approved</span>
                            )}
                            {change.status === 'rejected' && (
                              <span className="text-xs text-red-500">✗ Rejected</span>
                            )}
                          </div>

                          {/* Diff Preview */}
                          {isChangeExpanded && (
                            <div className="mt-2 p-2 bg-bg-secondary rounded text-xs font-mono overflow-x-auto">
                              {change.type === 'create' && change.newContent && (
                                <pre className="text-green-400">+ {change.newContent.slice(0, 200)}...</pre>
                              )}
                              {change.type === 'edit' && (
                                <div>
                                  {change.oldContent && (
                                    <pre className="text-red-400">- {change.oldContent.slice(0, 100)}...</pre>
                                  )}
                                  {change.newContent && (
                                    <pre className="text-green-400">+ {change.newContent.slice(0, 100)}...</pre>
                                  )}
                                </div>
                              )}
                              {change.type === 'delete' && change.oldContent && (
                                <pre className="text-red-400">- {change.oldContent.slice(0, 200)}...</pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
