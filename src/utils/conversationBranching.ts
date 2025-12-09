/**
 * Conversation Branching Utilities
 * 
 * Allows forking conversations at any message to explore different paths
 */

import { Message } from '../types';

export interface Branch {
  id: string;
  name: string;
  parentBranchId: string | null;
  branchPointIndex: number; // Index in parent where this branch starts
  messages: Message[];
  createdAt: number;
}

export interface BranchTree {
  branches: Map<string, Branch>;
  activeBranchId: string;
}

const BRANCH_TREE_KEY = 'remote-pilot-branch-tree';

/**
 * Generate a unique branch ID
 */
export function generateBranchId(): string {
  return `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new branch from a specific message index
 */
export function createBranch(
  currentBranch: Branch,
  branchPointIndex: number,
  name?: string
): Branch {
  const branchId = generateBranchId();
  const messagesUpToBranchPoint = currentBranch.messages.slice(0, branchPointIndex + 1);
  
  return {
    id: branchId,
    name: name || `Branch ${new Date().toLocaleString()}`,
    parentBranchId: currentBranch.id,
    branchPointIndex,
    messages: messagesUpToBranchPoint,
    createdAt: Date.now(),
  };
}

/**
 * Save branch tree to storage
 */
export async function saveBranchTree(tree: BranchTree): Promise<void> {
  try {
    const serialized = {
      branches: Array.from(tree.branches.entries()),
      activeBranchId: tree.activeBranchId,
    };
    localStorage.setItem(BRANCH_TREE_KEY, JSON.stringify(serialized));
  } catch (err) {
    console.error('Failed to save branch tree:', err);
  }
}

/**
 * Load branch tree from storage
 */
export async function loadBranchTree(): Promise<BranchTree | null> {
  try {
    const stored = localStorage.getItem(BRANCH_TREE_KEY);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    return {
      branches: new Map(data.branches),
      activeBranchId: data.activeBranchId,
    };
  } catch (err) {
    console.error('Failed to load branch tree:', err);
    return null;
  }
}

/**
 * Create initial branch tree with main branch
 */
export function createInitialBranchTree(messages: Message[]): BranchTree {
  const mainBranch: Branch = {
    id: 'main',
    name: 'Main',
    parentBranchId: null,
    branchPointIndex: 0,
    messages: messages,
    createdAt: Date.now(),
  };
  
  return {
    branches: new Map([['main', mainBranch]]),
    activeBranchId: 'main',
  };
}

/**
 * Get all branches that originate from a specific message
 */
export function getBranchesAtMessage(
  tree: BranchTree,
  parentBranchId: string,
  messageIndex: number
): Branch[] {
  const branches: Branch[] = [];
  
  for (const branch of tree.branches.values()) {
    if (branch.parentBranchId === parentBranchId && branch.branchPointIndex === messageIndex) {
      branches.push(branch);
    }
  }
  
  return branches;
}

/**
 * Delete a branch and all its descendants
 */
export function deleteBranch(tree: BranchTree, branchId: string): BranchTree {
  // Prevent deleting the main branch
  if (branchId === 'main') {
    return tree;
  }
  
  const newBranches = new Map(tree.branches);
  
  // Find all descendant branches
  const toDelete = new Set<string>([branchId]);
  let changed = true;
  
  while (changed) {
    changed = false;
    for (const [id, branch] of newBranches.entries()) {
      if (branch.parentBranchId && toDelete.has(branch.parentBranchId) && !toDelete.has(id)) {
        toDelete.add(id);
        changed = true;
      }
    }
  }
  
  // Delete all marked branches
  for (const id of toDelete) {
    newBranches.delete(id);
  }
  
  // If active branch was deleted, switch to main
  const newActiveBranchId = toDelete.has(tree.activeBranchId) ? 'main' : tree.activeBranchId;
  
  return {
    branches: newBranches,
    activeBranchId: newActiveBranchId,
  };
}

/**
 * Rename a branch
 */
export function renameBranch(tree: BranchTree, branchId: string, newName: string): BranchTree {
  const newBranches = new Map(tree.branches);
  const branch = newBranches.get(branchId);
  
  if (branch) {
    newBranches.set(branchId, { ...branch, name: newName });
  }
  
  return {
    ...tree,
    branches: newBranches,
  };
}
