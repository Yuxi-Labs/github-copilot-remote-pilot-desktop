import { useState, useRef, useEffect } from 'react';
import {
  Plug,
  Unplug,
  FilePlus,
  FolderPlus,
  Save,
  SaveAll,
  LogOut,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Terminal,
  Minimize2,
  Maximize2,
  Settings,
  Link,
  HelpCircle,
  Bug,
  Lightbulb,
  Info,
  ChevronRight,
} from 'lucide-react';

interface MenuBarProps {
  // File menu
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onSaveAll?: () => void;
  onExit: () => void;
  // Edit menu
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy: () => void;
  onPaste: () => void;
  // View menu
  terminalOpen: boolean;
  terminalMaximized: boolean;
  onToggleTerminal: () => void;
  onMinimizeTerminal: () => void;
  onMaximizeTerminal: () => void;
  onOpenSettings: () => void;
  // Tools menu
  onOpenConnections: () => void;
  // Help menu
  onShowDocs: () => void;
  onReportIssue: () => void;
  onRequestFeature: () => void;
  onShowAbout: () => void;
}

interface MenuProps {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

function Menu({ label, children, isOpen, onToggle, onClose }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={menuRef} className="relative">
      <button
        className={`px-2.5 py-1 text-sm text-text-primary hover:bg-bg-hover ${isOpen ? 'bg-bg-hover' : ''}`}
        onClick={onToggle}
      >
        {label}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-0 min-w-[220px] bg-[#252526] border border-[#454545] shadow-lg z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}

function MenuItem({ icon, label, shortcut, disabled, onClick }: MenuItemProps) {
  return (
    <button
      className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] text-left ${
        disabled 
          ? 'text-[#6e6e6e] cursor-not-allowed' 
          : 'text-[#cccccc] hover:bg-[#094771]'
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span className="w-4 h-4 flex items-center justify-center">
        {icon || null}
      </span>
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-[11px] text-[#6e6e6e]">{shortcut}</span>}
    </button>
  );
}

interface SubMenuProps {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

function SubMenu({ icon, label, children }: SubMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] text-left text-[#cccccc] hover:bg-[#094771] cursor-pointer">
        <span className="w-4 h-4 flex items-center justify-center">
          {icon || null}
        </span>
        <span className="flex-1">{label}</span>
        <ChevronRight size={12} className="text-[#6e6e6e]" />
      </div>
      {isOpen && (
        <div className="absolute left-full top-0 min-w-[180px] bg-[#252526] border border-[#454545] shadow-lg py-1" style={{ marginLeft: -1 }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuSeparator() {
  return <div className="h-px bg-[#454545] my-1" />;
}

export function MenuBar({
  isConnected,
  onConnect,
  onDisconnect,
  onNewFile,
  onNewFolder,
  onSave,
  onSaveAs,
  onSaveAll,
  onExit,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  terminalOpen,
  terminalMaximized,
  onToggleTerminal,
  onMinimizeTerminal,
  onMaximizeTerminal,
  onOpenSettings,
  onOpenConnections,
  onShowDocs,
  onReportIssue,
  onRequestFeature,
  onShowAbout,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleMenuToggle = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuClose = () => {
    setOpenMenu(null);
  };

  const handleItemClick = (callback: (() => void) | undefined) => {
    if (callback) {
      callback();
    }
    handleMenuClose();
  };

  return (
    <div
      className="flex items-center h-8 bg-[#3c3c3c] border-b border-[#252526] px-2 select-none"
      data-tauri-drag-region
    >
      <div className="flex gap-0">
        {/* File Menu */}
        <Menu 
          label="File" 
          isOpen={openMenu === 'file'} 
          onToggle={() => handleMenuToggle('file')}
          onClose={handleMenuClose}
        >
          {isConnected ? (
            <MenuItem 
              icon={<Unplug size={14} />} 
              label="Disconnect" 
              onClick={() => handleItemClick(onDisconnect)} 
            />
          ) : (
            <MenuItem 
              icon={<Plug size={14} />} 
              label="Connect" 
              onClick={() => handleItemClick(onConnect)} 
            />
          )}
          <MenuSeparator />
          <MenuItem 
            icon={<FilePlus size={14} />} 
            label="New File" 
            shortcut="Ctrl+N"
            disabled={!onNewFile}
            onClick={() => handleItemClick(onNewFile)} 
          />
          <MenuItem 
            icon={<FolderPlus size={14} />} 
            label="New Folder" 
            disabled={!onNewFolder}
            onClick={() => handleItemClick(onNewFolder)} 
          />
          <MenuSeparator />
          <MenuItem 
            icon={<Save size={14} />} 
            label="Save" 
            shortcut="Ctrl+S"
            disabled={!onSave}
            onClick={() => handleItemClick(onSave)} 
          />
          <MenuItem 
            icon={<Save size={14} />} 
            label="Save As..." 
            shortcut="Ctrl+Shift+S"
            disabled={!onSaveAs}
            onClick={() => handleItemClick(onSaveAs)} 
          />
          <MenuItem 
            icon={<SaveAll size={14} />} 
            label="Save All" 
            disabled={!onSaveAll}
            onClick={() => handleItemClick(onSaveAll)} 
          />
          <MenuSeparator />
          <MenuItem 
            icon={<LogOut size={14} />} 
            label="Exit" 
            shortcut="Alt+F4"
            onClick={() => handleItemClick(onExit)} 
          />
        </Menu>

        {/* Edit Menu */}
        <Menu 
          label="Edit" 
          isOpen={openMenu === 'edit'} 
          onToggle={() => handleMenuToggle('edit')}
          onClose={handleMenuClose}
        >
          <MenuItem 
            icon={<Undo2 size={14} />} 
            label="Undo" 
            shortcut="Ctrl+Z"
            disabled={!onUndo}
            onClick={() => handleItemClick(onUndo)} 
          />
          <MenuItem 
            icon={<Redo2 size={14} />} 
            label="Redo" 
            shortcut="Ctrl+Y"
            disabled={!onRedo}
            onClick={() => handleItemClick(onRedo)} 
          />
          <MenuSeparator />
          <MenuItem 
            icon={<Scissors size={14} />} 
            label="Cut" 
            shortcut="Ctrl+X"
            onClick={() => handleItemClick(onCut)} 
          />
          <MenuItem 
            icon={<Copy size={14} />} 
            label="Copy" 
            shortcut="Ctrl+C"
            onClick={() => handleItemClick(onCopy)} 
          />
          <MenuItem 
            icon={<Clipboard size={14} />} 
            label="Paste" 
            shortcut="Ctrl+V"
            onClick={() => handleItemClick(onPaste)} 
          />
        </Menu>

        {/* View Menu */}
        <Menu 
          label="View" 
          isOpen={openMenu === 'view'} 
          onToggle={() => handleMenuToggle('view')}
          onClose={handleMenuClose}
        >
          <SubMenu icon={<Terminal size={14} />} label="Terminal">
            <MenuItem 
              icon={<Terminal size={14} />} 
              label={terminalOpen ? "Hide Terminal" : "Show Terminal"} 
              shortcut="Ctrl+`"
              onClick={() => handleItemClick(onToggleTerminal)} 
            />
            <MenuSeparator />
            <MenuItem 
              icon={<Minimize2 size={14} />} 
              label="Minimize" 
              disabled={!terminalOpen || !terminalMaximized}
              onClick={() => handleItemClick(onMinimizeTerminal)} 
            />
            <MenuItem 
              icon={<Maximize2 size={14} />} 
              label="Maximize" 
              disabled={!terminalOpen || terminalMaximized}
              onClick={() => handleItemClick(onMaximizeTerminal)} 
            />
          </SubMenu>
          <MenuSeparator />
          <MenuItem 
            icon={<Settings size={14} />} 
            label="Settings" 
            shortcut="Ctrl+,"
            onClick={() => handleItemClick(onOpenSettings)} 
          />
        </Menu>

        {/* Tools Menu */}
        <Menu 
          label="Tools" 
          isOpen={openMenu === 'tools'} 
          onToggle={() => handleMenuToggle('tools')}
          onClose={handleMenuClose}
        >
          <MenuItem 
            icon={<Link size={14} />} 
            label="Connections" 
            onClick={() => handleItemClick(onOpenConnections)} 
          />
        </Menu>

        {/* Help Menu */}
        <Menu 
          label="Help" 
          isOpen={openMenu === 'help'} 
          onToggle={() => handleMenuToggle('help')}
          onClose={handleMenuClose}
        >
          <MenuItem 
            icon={<HelpCircle size={14} />} 
            label="Documentation" 
            shortcut="F1"
            onClick={() => handleItemClick(onShowDocs)} 
          />
          <MenuSeparator />
          <MenuItem 
            icon={<Bug size={14} />} 
            label="Report an Issue" 
            onClick={() => handleItemClick(onReportIssue)} 
          />
          <MenuItem 
            icon={<Lightbulb size={14} />} 
            label="Request a Feature" 
            onClick={() => handleItemClick(onRequestFeature)} 
          />
          <MenuSeparator />
          <MenuItem 
            icon={<Info size={14} />} 
            label="About" 
            onClick={() => handleItemClick(onShowAbout)} 
          />
        </Menu>
      </div>

      {/* Drag region for window movement */}
      <div className="flex-1" data-tauri-drag-region />
    </div>
  );
}
