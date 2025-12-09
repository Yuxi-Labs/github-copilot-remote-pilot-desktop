import { FileChange, ChangeGroup } from '../types/changes';
import { generateUUID } from './uuid';

const STORAGE_KEY = 'pending_changes';

export function createFileChange(
  type: FileChange['type'],
  path: string,
  oldContent?: string,
  newContent?: string
): FileChange {
  return {
    id: generateUUID(),
    type,
    path,
    oldContent,
    newContent,
    timestamp: Date.now(),
    status: 'pending',
  };
}

export function createChangeGroup(messageId: string, changes: FileChange[], description?: string): ChangeGroup {
  return {
    id: generateUUID(),
    messageId,
    changes,
    timestamp: Date.now(),
    description,
  };
}

export function savePendingChanges(groups: ChangeGroup[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function loadPendingChanges(): ChangeGroup[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function approveChange(groupId: string, changeId: string): void {
  const groups = loadPendingChanges();
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  const change = group.changes.find(c => c.id === changeId);
  if (change) {
    change.status = 'approved';
    savePendingChanges(groups);
  }
}

export function rejectChange(groupId: string, changeId: string): void {
  const groups = loadPendingChanges();
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  const change = group.changes.find(c => c.id === changeId);
  if (change) {
    change.status = 'rejected';
    savePendingChanges(groups);
  }
}

export function approveAllChanges(groupId: string): void {
  const groups = loadPendingChanges();
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  group.changes.forEach(change => {
    change.status = 'approved';
  });
  savePendingChanges(groups);
}

export function rejectAllChanges(groupId: string): void {
  const groups = loadPendingChanges();
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  
  group.changes.forEach(change => {
    change.status = 'rejected';
  });
  savePendingChanges(groups);
}

export function removeChangeGroup(groupId: string): void {
  const groups = loadPendingChanges();
  const filtered = groups.filter(g => g.id !== groupId);
  savePendingChanges(filtered);
}

export function getPendingChangesCount(): number {
  const groups = loadPendingChanges();
  return groups.reduce((count, group) => {
    return count + group.changes.filter(c => c.status === 'pending').length;
  }, 0);
}
