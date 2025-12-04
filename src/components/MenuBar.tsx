import { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  Download,
  Settings,
  LogOut,
  Copy,
  Clipboard,
  Trash2,
  PanelTop,
  PanelBottom,
  HelpCircle,
  Info,
} from 'lucide-react';

interface MenuBarProps {
  onNewChat: () => void;
  onExportChat: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClearChat: () => void;
  showToolbar: boolean;
  showStatusBar: boolean;
  onToggleToolbar: () => void;
  onToggleStatusBar: () => void;
  onShowAbout: () => void;
  onShowDocs: () => void;
}

interface MenuProps {
  label: string;
  children: React.ReactNode;
}

function Menu({ label, children }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        className="px-2.5 py-1 text-sm text-text-primary hover:bg-bg-hover"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-0.5 min-w-[200px] bg-bg-primary border border-border shadow-lg z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  checked?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, shortcut, checked, onClick }: MenuItemProps) {
  return (
    <button
      className="flex items-center gap-2.5 w-full px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover text-left"
      onClick={onClick}
    >
      <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-text-secondary">{shortcut}</span>}
      {checked !== undefined && (
        <span className="text-accent font-bold">{checked ? '✓' : ''}</span>
      )}
    </button>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-border mx-2 my-1" />;
}

export function MenuBar({
  onNewChat,
  onExportChat,
  onOpenSettings,
  onExit,
  onCopy,
  onPaste,
  onClearChat,
  showToolbar,
  showStatusBar,
  onToggleToolbar,
  onToggleStatusBar,
  onShowAbout,
  onShowDocs,
}: MenuBarProps) {
  return (
    <div
      className="flex items-center h-8 bg-bg-secondary border-b border-border px-2 select-none"
      data-tauri-drag-region
    >
      <div className="flex gap-0.5">
        <Menu label="File">
          <MenuItem icon={<MessageSquarePlus size={14} />} label="New Chat" shortcut="Ctrl+N" onClick={onNewChat} />
          <MenuItem icon={<Download size={14} />} label="Export Chat" shortcut="Ctrl+E" onClick={onExportChat} />
          <MenuSeparator />
          <MenuItem icon={<Settings size={14} />} label="Settings" shortcut="Ctrl+," onClick={onOpenSettings} />
          <MenuSeparator />
          <MenuItem icon={<LogOut size={14} />} label="Exit" shortcut="Alt+F4" onClick={onExit} />
        </Menu>

        <Menu label="Edit">
          <MenuItem icon={<Copy size={14} />} label="Copy" shortcut="Ctrl+C" onClick={onCopy} />
          <MenuItem icon={<Clipboard size={14} />} label="Paste" shortcut="Ctrl+V" onClick={onPaste} />
          <MenuSeparator />
          <MenuItem icon={<Trash2 size={14} />} label="Clear Chat" onClick={onClearChat} />
        </Menu>

        <Menu label="View">
          <MenuItem icon={<PanelTop size={14} />} label="Toolbar" checked={showToolbar} onClick={onToggleToolbar} />
          <MenuItem icon={<PanelBottom size={14} />} label="Status Bar" checked={showStatusBar} onClick={onToggleStatusBar} />
        </Menu>

        <Menu label="Help">
          <MenuItem icon={<HelpCircle size={14} />} label="Documentation" shortcut="F1" onClick={onShowDocs} />
          <MenuSeparator />
          <MenuItem icon={<Info size={14} />} label="About" onClick={onShowAbout} />
        </Menu>
      </div>

      {/* Drag region for window movement */}
      <div className="flex-1" data-tauri-drag-region />
    </div>
  );
}
