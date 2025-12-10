import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

// Simple context menu item type (matches how components use it)
export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

// Context menu state
interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

// Context menu context
interface ContextMenuContextValue {
  showContextMenu: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
  isOpen: boolean;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within ContextMenuProvider');
  }
  return context;
}

// Provider component
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
  });

  const showContextMenu = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate menu dimensions (approximate)
    const menuWidth = 200;
    const menuItemHeight = 28;
    const menuPadding = 8;
    const menuHeight = items.reduce((h, item) => h + (item.divider ? 9 : menuItemHeight), menuPadding * 2);
    
    // Adjust position to keep menu on screen
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    setState({
      isOpen: true,
      x: Math.max(5, x),
      y: Math.max(5, y),
      items,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Close on click outside or Escape
  useEffect(() => {
    if (!state.isOpen) return;
    
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside the menu
      if ((e.target as HTMLElement).closest('.context-menu')) {
        return;
      }
      hideContextMenu();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu();
    };

    // Use a small delay to prevent the click that opened the menu from closing it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleKeyDown);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, hideContextMenu]);

  // Prevent default context menu globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow default on input/textarea if not overridden
      const target = e.target as HTMLElement;
      if (target.closest('[data-context-menu]') || !target.matches('input, textarea')) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, isOpen: state.isOpen }}>
      {children}
      {state.isOpen && (
        <ContextMenuPopup
          x={state.x}
          y={state.y}
          items={state.items}
          onClose={hideContextMenu}
        />
      )}
    </ContextMenuContext.Provider>
  );
}

// Menu popup component
function ContextMenuPopup({ 
  x, 
  y, 
  items, 
  onClose 
}: { 
  x: number; 
  y: number; 
  items: ContextMenuItem[]; 
  onClose: () => void;
}) {
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  return (
    <div
      className="context-menu fixed z-[9999] min-w-[180px] py-1 bg-[#252526] border border-[#454545] shadow-lg"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="h-px bg-[#454545] my-1" />;
        }

        const hasSubmenu = item.submenu && item.submenu.length > 0;

        return (
          <div
            key={`item-${index}`}
            className="relative"
            onMouseEnter={() => hasSubmenu && setOpenSubmenu(index)}
            onMouseLeave={() => hasSubmenu && setOpenSubmenu(null)}
          >
            <button
              className={`w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-left transition-colors ${
                item.disabled 
                  ? 'text-[#6e6e6e] cursor-not-allowed' 
                  : 'text-[#cccccc] hover:bg-[#094771]'
              }`}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled && item.action) {
                  item.action();
                  onClose();
                }
              }}
            >
              <span className="flex-1">{item.label}</span>
              {item.shortcut && (
                <span className="text-[11px] text-[#6e6e6e] ml-4">{item.shortcut}</span>
              )}
              {hasSubmenu && <ChevronRight size={12} className="text-[#6e6e6e]" />}
            </button>

            {/* Submenu */}
            {hasSubmenu && openSubmenu === index && (
              <SubmenuPopup 
                items={item.submenu!} 
                onClose={onClose}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Submenu component
function SubmenuPopup({ 
  items, 
  onClose 
}: { 
  items: ContextMenuItem[]; 
  onClose: () => void;
}) {
  return (
    <div
      className="context-menu absolute left-full top-0 min-w-[160px] py-1 bg-[#252526] border border-[#454545] shadow-lg"
      style={{ marginLeft: -1 }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return <div key={`sub-divider-${index}`} className="h-px bg-[#454545] my-1" />;
        }
        
        return (
          <button
            key={`sub-item-${index}`}
            className={`w-full flex items-center gap-3 px-3 py-1.5 text-[13px] text-left transition-colors ${
              item.disabled 
                ? 'text-[#6e6e6e] cursor-not-allowed' 
                : 'text-[#cccccc] hover:bg-[#094771]'
            }`}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
          >
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[11px] text-[#6e6e6e] ml-4">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
