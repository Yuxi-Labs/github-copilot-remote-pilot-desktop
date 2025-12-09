import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  updateFavorite
} from '../../utils/connectionFavorites';

describe('connectionFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addFavorite', () => {
    it('should add a new favorite connection', () => {
      const favorite = {
        id: '1',
        name: 'Local',
        url: 'ws://localhost:3712/ws',
        token: 'test-token'
      };

      addFavorite(favorite);
      const favorites = getFavorites();

      expect(favorites).toHaveLength(1);
      expect(favorites[0].name).toBe(favorite.name);
      expect(favorites[0].url).toBe(favorite.url);
      expect(favorites[0].token).toBe(favorite.token);
      expect(favorites[0].isFavorite).toBe(true);
    });

    it('should add multiple favorites', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });
      addFavorite({ id: '2', name: 'Remote', url: 'ws://remote:3712/ws', token: 'token2' });

      const favorites = getFavorites();
      expect(favorites).toHaveLength(2);
    });
  });

  describe('getFavorites', () => {
    it('should return empty array when no favorites exist', () => {
      const favorites = getFavorites();
      expect(favorites).toEqual([]);
    });

    it('should return all saved favorites', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });
      addFavorite({ id: '2', name: 'Remote', url: 'ws://remote:3712/ws', token: 'token2' });

      const favorites = getFavorites();
      expect(favorites).toHaveLength(2);
      expect(favorites[0].name).toBe('Local');
      expect(favorites[1].name).toBe('Remote');
    });
  });

  describe('removeFavorite', () => {
    it('should remove a favorite by id', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });
      addFavorite({ id: '2', name: 'Remote', url: 'ws://remote:3712/ws', token: 'token2' });

      const favorites = getFavorites();
      expect(favorites).toHaveLength(2);
      const firstId = favorites[0].id;

      removeFavorite(firstId);
      const remaining = getFavorites();

      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Remote');
    });

    it('should do nothing if id does not exist', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      const favorites = getFavorites();
      const initialCount = favorites.length;

      removeFavorite('nonexistent-id-999');
      const afterRemove = getFavorites();

      expect(afterRemove).toHaveLength(initialCount);
    });
  });

  describe('updateFavorite', () => {
    it('should update an existing favorite', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      const favorites = getFavorites();
      const favId = favorites[0].id;

      updateFavorite(favId, { name: 'Updated Local', token: 'new-token' });
      const updated = getFavorites();

      expect(updated[0].name).toBe('Updated Local');
      expect(updated[0].token).toBe('new-token');
      expect(updated[0].url).toBe('ws://localhost:3712/ws');
    });

    it('should do nothing if id does not exist', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      updateFavorite('999', { name: 'Should Not Update' });
      const favorites = getFavorites();

      expect(favorites[0].name).toBe('Local');
    });
  });
});
