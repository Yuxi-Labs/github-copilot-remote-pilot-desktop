import { useState } from 'react';
import { X, GitBranch, Trash2, Edit2, Check } from 'lucide-react';
import { Branch, BranchTree } from '../utils/conversationBranching';

interface BranchManagerProps {
  isOpen: boolean;
  branchTree: BranchTree;
  onSwitchBranch: (branchId: string) => void;
  onDeleteBranch: (branchId: string) => void;
  onRenameBranch: (branchId: string, newName: string) => void;
  onClose: () => void;
}

export function BranchManager({
  isOpen,
  branchTree,
  onSwitchBranch,
  onDeleteBranch,
  onRenameBranch,
  onClose,
}: BranchManagerProps) {
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditName(branch.name);
  };

  const saveEdit = () => {
    if (editingBranchId && editName.trim()) {
      onRenameBranch(editingBranchId, editName.trim());
    }
    setEditingBranchId(null);
    setEditName('');
  };

  const cancelEdit = () => {
    setEditingBranchId(null);
    setEditName('');
  };

  // Build tree structure for visualization
  const mainBranch = branchTree.branches.get('main');
  const otherBranches = Array.from(branchTree.branches.values()).filter(b => b.id !== 'main');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-primary border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GitBranch className="text-accent" size={20} />
            <h2 className="text-lg font-semibold text-text-primary">Conversation Branches</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded"
            aria-label="Close"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Branch List */}
        <div className="flex-1 overflow-y-auto p-4">
          {mainBranch && (
            <BranchItem
              branch={mainBranch}
              isActive={branchTree.activeBranchId === 'main'}
              isEditing={editingBranchId === 'main'}
              editName={editName}
              onEdit={startEdit}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onSetEditName={setEditName}
              onSwitch={onSwitchBranch}
              onDelete={null} // Can't delete main branch
              indent={0}
            />
          )}

          {otherBranches.length === 0 && (
            <div className="text-text-secondary text-sm text-center py-8">
              No branches yet. Click the branch icon on any message to create one.
            </div>
          )}

          {otherBranches.map((branch) => {
            const parent = branch.parentBranchId ? branchTree.branches.get(branch.parentBranchId) : null;
            const indent = parent ? 1 : 0; // Simple indentation for now

            return (
              <BranchItem
                key={branch.id}
                branch={branch}
                isActive={branchTree.activeBranchId === branch.id}
                isEditing={editingBranchId === branch.id}
                editName={editName}
                onEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onSetEditName={setEditName}
                onSwitch={onSwitchBranch}
                onDelete={onDeleteBranch}
                indent={indent}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-sm text-text-secondary">
          <p>Active branch: <span className="text-accent font-semibold">{branchTree.branches.get(branchTree.activeBranchId)?.name}</span></p>
        </div>
      </div>
    </div>
  );
}

interface BranchItemProps {
  branch: Branch;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  onEdit: (branch: Branch) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetEditName: (name: string) => void;
  onSwitch: (branchId: string) => void;
  onDelete: ((branchId: string) => void) | null;
  indent: number;
}

function BranchItem({
  branch,
  isActive,
  isEditing,
  editName,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onSetEditName,
  onSwitch,
  onDelete,
  indent,
}: BranchItemProps) {
  return (
    <div
      className={`mb-2 p-3 rounded border ${
        isActive ? 'border-accent bg-accent/10' : 'border-border hover:bg-bg-hover'
      }`}
      style={{ marginLeft: `${indent * 20}px` }}
    >
      <div className="flex items-center gap-2">
        <GitBranch size={16} className={isActive ? 'text-accent' : 'text-text-secondary'} />
        
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => onSetEditName(e.target.value)}
              className="flex-1 px-2 py-1 bg-bg-secondary border border-border rounded text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <button
              onClick={onSaveEdit}
              className="p-1 hover:bg-bg-hover rounded"
              title="Save"
            >
              <Check size={16} className="text-green-500" />
            </button>
            <button
              onClick={onCancelEdit}
              className="p-1 hover:bg-bg-hover rounded"
              title="Cancel"
            >
              <X size={16} className="text-text-secondary" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onSwitch(branch.id)}
              className="flex-1 text-left text-sm font-medium text-text-primary"
            >
              {branch.name}
            </button>
            
            <button
              onClick={() => onEdit(branch)}
              className="p-1 hover:bg-bg-hover rounded"
              title="Rename"
            >
              <Edit2 size={14} className="text-text-secondary" />
            </button>
            
            {onDelete && (
              <button
                onClick={() => onDelete(branch.id)}
                className="p-1 hover:bg-bg-hover rounded"
                title="Delete branch"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </>
        )}
      </div>
      
      <div className="mt-1 text-xs text-text-secondary">
        {branch.messages.length} messages • Created {new Date(branch.createdAt).toLocaleString()}
      </div>
    </div>
  );
}
