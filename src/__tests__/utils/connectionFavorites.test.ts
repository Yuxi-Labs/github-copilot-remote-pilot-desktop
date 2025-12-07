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
      expect(favorites[0]).toEqual(favorite);
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

      removeFavorite('1');
      const favorites = getFavorites();

      expect(favorites).toHaveLength(1);
      expect(favorites[0].id).toBe('2');
    });

    it('should do nothing if id does not exist', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      removeFavorite('999');
      const favorites = getFavorites();

      expect(favorites).toHaveLength(1);
    });
  });

  describe('updateFavorite', () => {
    it('should update an existing favorite', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      updateFavorite('1', { name: 'Updated Local', token: 'new-token' });
      const favorites = getFavorites();

      expect(favorites[0].name).toBe('Updated Local');
      expect(favorites[0].token).toBe('new-token');
      expect(favorites[0].url).toBe('ws://localhost:3712/ws');
    });

    it('should do nothing if id does not exist', () => {
      addFavorite({ id: '1', name: 'Local', url: 'ws://localhost:3712/ws', token: 'token1' });

      updateFavorite('999', { name: 'Should Not Update' });
      const favorites = getFavorites();

      expect(favorites[0].name).toBe('Local');
    });
  });
});
