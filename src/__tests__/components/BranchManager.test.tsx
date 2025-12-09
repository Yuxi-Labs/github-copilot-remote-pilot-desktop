import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BranchManager } from '../../components/BranchManager';
import { BranchTree } from '../../utils/conversationBranching';

describe('BranchManager', () => {
  const mockBranchTree: BranchTree = {
    branches: new Map([
      ['main', { id: 'main', name: 'Main', parentId: null, parentMessageIndex: -1, messages: [], createdAt: Date.now() }],
      ['branch1', { id: 'branch1', name: 'Feature Branch', parentId: 'main', parentMessageIndex: 2, messages: [], createdAt: Date.now() }],
    ]),
    activeBranchId: 'main',
  };

  it('renders branch manager when open', () => {
    render(
      <BranchManager
        isOpen={true}
        branchTree={mockBranchTree}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onRenameBranch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Conversation Branches')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <BranchManager
        isOpen={false}
        branchTree={mockBranchTree}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onRenameBranch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays all branches', () => {
    render(
      <BranchManager
        isOpen={true}
        branchTree={mockBranchTree}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onRenameBranch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getAllByText('Main')).toHaveLength(2); // Once in list, once in active branch display
    expect(screen.getByText('Feature Branch')).toBeInTheDocument();
  });

  it('calls onSwitchBranch when branch clicked', () => {
    const onSwitchBranch = vi.fn();
    render(
      <BranchManager
        isOpen={true}
        branchTree={mockBranchTree}
        onSwitchBranch={onSwitchBranch}
        onDeleteBranch={vi.fn()}
        onRenameBranch={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const branchButton = screen.getByText('Feature Branch');
    fireEvent.click(branchButton);

    expect(onSwitchBranch).toHaveBeenCalledWith('branch1');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <BranchManager
        isOpen={true}
        branchTree={mockBranchTree}
        onSwitchBranch={vi.fn()}
        onDeleteBranch={vi.fn()}
        onRenameBranch={vi.fn()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});
