export interface ConnectionFavorite {
  id: string;
  name: string;
  url: string;
  token: string;
  lastUsed: number;
  isFavorite: boolean;
}

const FAVORITES_KEY = 'copilot-connection-favorites';
const MAX_RECENT = 10;

/**
 * Save a connection to favorites/recent
 */
export function saveConnection(name: string, url: string, token: string, isFavorite = false): ConnectionFavorite {
  const favorites = loadFavorites();
  
  // Check if connection already exists (by URL)
  const existing = favorites.find(f => f.url === url);
  
  if (existing) {
    // Update existing
    existing.name = name;
    existing.token = token;
    existing.lastUsed = Date.now();
    existing.isFavorite = isFavorite || existing.isFavorite;
  } else {
    // Add new
    const newFavorite: ConnectionFavorite = {
      id: generateId(),
      name,
      url,
      token,
      lastUsed: Date.now(),
      isFavorite,
    };
    favorites.push(newFavorite);
  }
  
  // Sort: favorites first, then by last used
  favorites.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.lastUsed - a.lastUsed;
  });
  
  // Keep only MAX_RECENT non-favorite items
  const favs = favorites.filter(f => f.isFavorite);
  const recent = favorites.filter(f => !f.isFavorite).slice(0, MAX_RECENT);
  const trimmed = [...favs, ...recent];
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(trimmed));
  return existing || trimmed[trimmed.length - 1];
}

/**
 * Load all favorites and recent connections
 */
export function loadFavorites(): ConnectionFavorite[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

/**
 * Get favorites only
 */
export function getFavorites(): ConnectionFavorite[] {
  return loadFavorites().filter(f => f.isFavorite);
}

/**
 * Add a favorite connection (alias for saveConnection with isFavorite=true)
 */
export function addFavorite(favorite: Omit<ConnectionFavorite, 'lastUsed' | 'isFavorite'>): ConnectionFavorite {
  return saveConnection(favorite.name, favorite.url, favorite.token, true);
}

/**
 * Remove a favorite connection (alias for deleteConnection)
 */
export function removeFavorite(id: string): void {
  deleteConnection(id);
}

/**
 * Update a favorite connection
 */
export function updateFavorite(id: string, updates: Partial<Pick<ConnectionFavorite, 'name' | 'url' | 'token'>>): void {
  const favorites = loadFavorites();
  const item = favorites.find(f => f.id === id);
  if (item) {
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.url !== undefined) item.url = updates.url;
    if (updates.token !== undefined) item.token = updates.token;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

/**
 * Get recent connections (non-favorites)
 */
export function getRecent(): ConnectionFavorite[] {
  return loadFavorites().filter(f => !f.isFavorite);
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(id: string): void {
  const favorites = loadFavorites();
  const item = favorites.find(f => f.id === id);
  if (item) {
    item.isFavorite = !item.isFavorite;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

/**
 * Delete a connection
 */
export function deleteConnection(id: string): void {
  const favorites = loadFavorites().filter(f => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/**
 * Get last used connection
 */
export function getLastUsed(): ConnectionFavorite | null {
  const favorites = loadFavorites();
  if (favorites.length === 0) return null;
  
  return favorites.reduce((latest, current) => {
    return current.lastUsed > latest.lastUsed ? current : latest;
  });
}

/**
 * Update last used timestamp
 */
export function updateLastUsed(url: string): void {
  const favorites = loadFavorites();
  const item = favorites.find(f => f.url === url);
  if (item) {
    item.lastUsed = Date.now();
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
