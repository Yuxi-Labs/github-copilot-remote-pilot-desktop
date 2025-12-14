import { useState, useEffect, useRef } from 'react';
import { File, Folder, X } from 'lucide-react';

interface NewItemDialogProps {
  isOpen: boolean;
  type: 'file' | 'folder';
  basePath: string;
  onConfirm: (name: string, type: 'file' | 'folder') => void;
  onClose: () => void;
}

export function NewItemDialog({ isOpen, type, basePath, onConfirm, onClose }: NewItemDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError(null);
      // Focus input after dialog opens
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    // Basic validation for invalid characters
    if (/[<>:"|?*\\]/.test(trimmedName)) {
      setError('Name contains invalid characters');
      return;
    }

    onConfirm(trimmedName, type);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const Icon = type === 'file' ? File : Folder;
  const title = type === 'file' ? 'New File' : 'New Folder';
  const placeholder = type === 'file' ? 'filename.ts' : 'folder-name';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-bg-primary border border-border shadow-xl w-[400px]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-hover rounded transition-colors text-text-secondary hover:text-text-primary"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-3">
            <label className="block text-xs text-text-secondary mb-1">
              Location: {basePath || '/'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
            />
            {error && (
              <p className="mt-1 text-xs text-error">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
