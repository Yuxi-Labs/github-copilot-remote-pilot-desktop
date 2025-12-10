import { Star, Clock, Trash2, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { getFavorites, getRecent, toggleFavorite, deleteConnection, type ConnectionFavorite } from '../utils/connectionFavorites';
import { useContextMenu, ContextMenuItem } from './ContextMenu';

interface FavoritesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnection: (url: string, token: string) => void;
}

export function FavoritesSidebar({ isOpen, onClose, onSelectConnection }: FavoritesSidebarProps) {
  const [favorites, setFavorites] = useState<ConnectionFavorite[]>([]);
  const [recent, setRecent] = useState<ConnectionFavorite[]>([]);
  const { showContextMenu } = useContextMenu();

  useEffect(() => {
    if (isOpen) {
      setFavorites(getFavorites());
      setRecent(getRecent());
    }
  }, [isOpen]);

  const handleConnectionContextMenu = useCallback((e: React.MouseEvent, conn: ConnectionFavorite) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [
      {
        label: 'Connect',
        shortcut: 'Enter',
        action: () => onSelectConnection(conn.url, conn.token),
      },
      { divider: true },
      {
        label: 'Copy URL',
        action: () => navigator.clipboard.writeText(conn.url),
      },
      {
        label: 'Copy Token',
        action: () => navigator.clipboard.writeText(conn.token),
      },
      { divider: true },
      {
        label: conn.isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
        action: () => {
          toggleFavorite(conn.id);
          setFavorites(getFavorites());
          setRecent(getRecent());
        },
      },
      { divider: true },
      {
        label: 'Delete Connection',
        action: () => {
          deleteConnection(conn.id);
          setFavorites(getFavorites());
          setRecent(getRecent());
        },
      },
    ];
    showContextMenu(e, items);
  }, [onSelectConnection, showContextMenu]);

  if (!isOpen) return null;

  const formatLastUsed = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleToggleFavorite = (conn: ConnectionFavorite) => {
    toggleFavorite(conn.id);
    setFavorites(getFavorites());
    setRecent(getRecent());
  };

  const handleDelete = (conn: ConnectionFavorite) => {
    deleteConnection(conn.id);
    setFavorites(getFavorites());
    setRecent(getRecent());
  };

  const renderConnection = (conn: ConnectionFavorite) => (
    <div
      key={`${conn.url}-${conn.token}`}
      className="flex items-center gap-2 p-2 hover:bg-bg-tertiary group"
      onContextMenu={(e) => handleConnectionContextMenu(e, conn)}
      data-context-menu
    >
      <button
        onClick={() => onSelectConnection(conn.url, conn.token)}
        className="flex-1 text-left text-sm"
        title={`Connect to ${conn.name}`}
      >
        <div className="font-medium text-text-primary">{conn.name}</div>
        <div className="text-xs text-text-secondary truncate">{conn.url}</div>
        {conn.lastUsed && (
          <div className="text-xs text-text-tertiary">{formatLastUsed(conn.lastUsed)}</div>
        )}
      </button>
      <button
        onClick={() => handleToggleFavorite(conn)}
        className="p-1 hover:bg-bg-quaternary"
        title={conn.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star className={`w-4 h-4 ${conn.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-text-tertiary'}`} />
      </button>
      <button
        onClick={() => handleDelete(conn)}
        className="p-1 hover:bg-bg-quaternary opacity-0 group-hover:opacity-100"
        title="Delete connection"
      >
        <Trash2 className="w-4 h-4 text-text-tertiary hover:text-error" />
      </button>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 bg-bg-secondary border-l border-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Connections</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-bg-tertiary"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Favorites */}
          {favorites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-semibold text-text-secondary uppercase">Favorites</h3>
              </div>
              <div className="space-y-1">
                {favorites.map(renderConnection)}
              </div>
            </div>
          )}

          {/* Recent */}
          {recent.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-secondary uppercase">Recent</h3>
              </div>
              <div className="space-y-1">
                {recent.map(renderConnection)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {favorites.length === 0 && recent.length === 0 && (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-50" />
              <p className="text-text-secondary text-sm">No connections yet</p>
              <p className="text-text-tertiary text-xs mt-1">
                Connect to a server to add it here
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
