export interface FileChange {
  id: string;
  type: 'create' | 'edit' | 'delete';
  path: string;
  oldContent?: string;
  newContent?: string;
  diff?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChangeGroup {
  id: string;
  messageId: string;
  changes: FileChange[];
  timestamp: number;
  description?: string;
}
