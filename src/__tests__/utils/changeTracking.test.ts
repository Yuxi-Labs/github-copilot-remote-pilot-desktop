import { describe, it, expect, beforeEach } from 'vitest';
import {
  createFileChange,
  createChangeGroup,
  savePendingChanges,
  loadPendingChanges,
  approveChange,
  rejectChange,
  approveAllChanges,
  rejectAllChanges,
  removeChangeGroup,
  getPendingChangesCount,
} from '../../utils/changeTracking';

describe('changeTracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('createFileChange', () => {
    it('creates a file change with pending status', () => {
      const change = createFileChange('edit', '/test.ts', 'old', 'new');

      expect(change.type).toBe('edit');
      expect(change.path).toBe('/test.ts');
      expect(change.oldContent).toBe('old');
      expect(change.newContent).toBe('new');
      expect(change.status).toBe('pending');
      expect(change.id).toBeTruthy();
      expect(change.timestamp).toBeGreaterThan(0);
    });
  });

  describe('createChangeGroup', () => {
    it('creates a change group with given changes', () => {
      const change1 = createFileChange('edit', '/test1.ts');
      const change2 = createFileChange('create', '/test2.ts');
      const group = createChangeGroup('msg1', [change1, change2], 'Test changes');

      expect(group.messageId).toBe('msg1');
      expect(group.changes).toHaveLength(2);
      expect(group.description).toBe('Test changes');
      expect(group.id).toBeTruthy();
    });
  });

  describe('savePendingChanges and loadPendingChanges', () => {
    it('saves and loads pending changes', () => {
      const change = createFileChange('edit', '/test.ts');
      const group = createChangeGroup('msg1', [change]);

      savePendingChanges([group]);
      const loaded = loadPendingChanges();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(group.id);
      expect(loaded[0].changes).toHaveLength(1);
    });

    it('returns empty array when no changes saved', () => {
      const loaded = loadPendingChanges();
      expect(loaded).toEqual([]);
    });
  });

  describe('approveChange', () => {
    it('marks a change as approved', () => {
      const change = createFileChange('edit', '/test.ts');
      const group = createChangeGroup('msg1', [change]);
      savePendingChanges([group]);

      approveChange(group.id, change.id);
      const loaded = loadPendingChanges();

      expect(loaded[0].changes[0].status).toBe('approved');
    });
  });

  describe('rejectChange', () => {
    it('marks a change as rejected', () => {
      const change = createFileChange('edit', '/test.ts');
      const group = createChangeGroup('msg1', [change]);
      savePendingChanges([group]);

      rejectChange(group.id, change.id);
      const loaded = loadPendingChanges();

      expect(loaded[0].changes[0].status).toBe('rejected');
    });
  });

  describe('approveAllChanges', () => {
    it('marks all changes in a group as approved', () => {
      const change1 = createFileChange('edit', '/test1.ts');
      const change2 = createFileChange('create', '/test2.ts');
      const group = createChangeGroup('msg1', [change1, change2]);
      savePendingChanges([group]);

      approveAllChanges(group.id);
      const loaded = loadPendingChanges();

      expect(loaded[0].changes[0].status).toBe('approved');
      expect(loaded[0].changes[1].status).toBe('approved');
    });
  });

  describe('rejectAllChanges', () => {
    it('marks all changes in a group as rejected', () => {
      const change1 = createFileChange('edit', '/test1.ts');
      const change2 = createFileChange('create', '/test2.ts');
      const group = createChangeGroup('msg1', [change1, change2]);
      savePendingChanges([group]);

      rejectAllChanges(group.id);
      const loaded = loadPendingChanges();

      expect(loaded[0].changes[0].status).toBe('rejected');
      expect(loaded[0].changes[1].status).toBe('rejected');
    });
  });

  describe('removeChangeGroup', () => {
    it('removes a change group', () => {
      const change = createFileChange('edit', '/test.ts');
      const group1 = createChangeGroup('msg1', [change]);
      const group2 = createChangeGroup('msg2', [change]);
      savePendingChanges([group1, group2]);

      removeChangeGroup(group1.id);
      const loaded = loadPendingChanges();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(group2.id);
    });
  });

  describe('getPendingChangesCount', () => {
    it('counts only pending changes', () => {
      const change1 = createFileChange('edit', '/test1.ts');
      const change2 = createFileChange('create', '/test2.ts');
      const change3 = createFileChange('delete', '/test3.ts');
      const group = createChangeGroup('msg1', [change1, change2, change3]);
      savePendingChanges([group]);

      approveChange(group.id, change1.id);
      const count = getPendingChangesCount();

      expect(count).toBe(2);
    });

    it('returns 0 when no pending changes', () => {
      const count = getPendingChangesCount();
      expect(count).toBe(0);
    });
  });
});
