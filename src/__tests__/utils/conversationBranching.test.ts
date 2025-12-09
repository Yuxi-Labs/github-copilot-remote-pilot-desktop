import { describe, it, expect, beforeEach } from 'vitest';
import {
  Branch,
  BranchTree,
  createBranch,
  saveBranchTree,
  loadBranchTree,
  createInitialBranchTree,
  deleteBranch,
  renameBranch,
  getBranchesAtMessage,
} from '../../utils/conversationBranching';
import { Message } from '../../types';

describe('conversationBranching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockMessages: Message[] = [
    { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
    { id: '2', role: 'assistant', content: 'Hi', timestamp: Date.now() },
    { id: '3', role: 'user', content: 'How are you?', timestamp: Date.now() },
  ];

  describe('createInitialBranchTree', () => {
    it('creates a branch tree with main branch', () => {
      const tree = createInitialBranchTree(mockMessages);

      expect(tree.activeBranchId).toBe('main');
      expect(tree.branches.size).toBe(1);
      expect(tree.branches.get('main')?.messages).toEqual(mockMessages);
    });
  });

  describe('createBranch', () => {
    it('creates a new branch from existing branch at message index', () => {
      const mainBranch: Branch = {
        id: 'main',
        name: 'Main',
        parentId: null,
        parentMessageIndex: -1,
        messages: mockMessages,
        createdAt: Date.now(),
      };

      const newBranch = createBranch(mainBranch, 1);

      expect(newBranch.parentBranchId).toBe('main');
      expect(newBranch.branchPointIndex).toBe(1);
      expect(newBranch.messages).toHaveLength(2);
      expect(newBranch.messages[0].id).toBe('1');
      expect(newBranch.messages[1].id).toBe('2');
    });

    it('generates unique branch name', () => {
      const mainBranch: Branch = {
        id: 'main',
        name: 'Main',
        parentBranchId: null,
        branchPointIndex: 0,
        messages: mockMessages,
        createdAt: Date.now(),
      };

      const branch1 = createBranch(mainBranch, 1);
      const branch2 = createBranch(mainBranch, 1);

      expect(branch1.name).toMatch(/Branch \d+/);
      expect(branch2.name).toMatch(/Branch \d+/);
      expect(branch1.id).not.toBe(branch2.id);
    });
  });

  describe('saveBranchTree and loadBranchTree', () => {
    it('saves and loads branch tree', async () => {
      const tree = createInitialBranchTree([]);
      await saveBranchTree(tree);

      const loaded = await loadBranchTree();
      expect(loaded).toBeTruthy();
      expect(loaded?.activeBranchId).toBe('main');
      expect(loaded?.branches.size).toBe(1);
    });

    it('returns null when no tree saved', async () => {
      const loaded = await loadBranchTree();
      expect(loaded).toBeNull();
    });
  });

  describe('deleteBranch', () => {
    it('deletes a branch and switches to parent', () => {
      const tree = createInitialBranchTree(mockMessages);
      const mainBranch = tree.branches.get('main')!;
      const newBranch = createBranch(mainBranch, 1);
      
      tree.branches.set(newBranch.id, newBranch);
      tree.activeBranchId = newBranch.id;

      const updated = deleteBranch(tree, newBranch.id);

      expect(updated.branches.has(newBranch.id)).toBe(false);
      expect(updated.activeBranchId).toBe('main');
    });

    it('does not delete main branch', () => {
      const tree = createInitialBranchTree(mockMessages);
      const updated = deleteBranch(tree, 'main');

      expect(updated.branches.has('main')).toBe(true);
    });
  });

  describe('renameBranch', () => {
    it('renames a branch', () => {
      const tree = createInitialBranchTree(mockMessages);
      const updated = renameBranch(tree, 'main', 'New Main');

      expect(updated.branches.get('main')?.name).toBe('New Main');
    });

    it('returns original tree if branch not found', () => {
      const tree = createInitialBranchTree(mockMessages);
      const updated = renameBranch(tree, 'nonexistent', 'New Name');

      expect(updated).toEqual(tree);
    });
  });

  describe('getBranchesAtMessage', () => {
    it('returns branches that diverge at message index', () => {
      const tree = createInitialBranchTree(mockMessages);
      const mainBranch = tree.branches.get('main')!;
      const branch1 = createBranch(mainBranch, 1);
      const branch2 = createBranch(mainBranch, 1);
      
      tree.branches.set(branch1.id, branch1);
      tree.branches.set(branch2.id, branch2);

      const branches = getBranchesAtMessage(tree, 'main', 1);

      expect(branches).toHaveLength(2);
      expect(branches.map(b => b.id)).toContain(branch1.id);
      expect(branches.map(b => b.id)).toContain(branch2.id);
    });

    it('returns empty array when no branches at index', () => {
      const tree = createInitialBranchTree(mockMessages);
      const branches = getBranchesAtMessage(tree, 'main', 5);

      expect(branches).toEqual([]);
    });
  });
});
