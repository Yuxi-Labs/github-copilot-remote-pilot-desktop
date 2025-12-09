import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangeApprovalDialog } from '../../components/ChangeApprovalDialog';
import { ChangeGroup } from '../../types/changes';

describe('ChangeApprovalDialog', () => {
  const mockGroups: ChangeGroup[] = [
    {
      id: 'group1',
      messageId: 'msg1',
      timestamp: Date.now(),
      changes: [
        {
          id: 'change1',
          type: 'edit',
          path: '/src/test.ts',
          oldContent: 'old content',
          newContent: 'new content',
          timestamp: Date.now(),
          status: 'pending',
        },
        {
          id: 'change2',
          type: 'create',
          path: '/src/new.ts',
          newContent: 'file content',
          timestamp: Date.now(),
          status: 'pending',
        },
      ],
    },
  ];

  it('renders dialog with pending changes', () => {
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Pending Changes')).toBeInTheDocument();
    expect(screen.getAllByText('2 pending')).toHaveLength(2); // Once in header, once in group
  });

  it('calls onApprove when approve button clicked', () => {
    const onApprove = vi.fn();
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={onApprove}
        onReject={vi.fn()}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    expect(onApprove).toHaveBeenCalledWith('group1', 'change1');
  });

  it('calls onReject when reject button clicked', () => {
    const onReject = vi.fn();
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={vi.fn()}
        onReject={onReject}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    expect(onReject).toHaveBeenCalledWith('group1', 'change1');
  });

  it('calls onApproveAll when approve all button clicked', () => {
    const onApproveAll = vi.fn();
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onApproveAll={onApproveAll}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const approveAllButton = screen.getByText('Approve All');
    fireEvent.click(approveAllButton);

    expect(onApproveAll).toHaveBeenCalledWith('group1');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders empty state when no groups', () => {
    const { container } = render(
      <ChangeApprovalDialog
        groups={[]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays correct file icons for different change types', () => {
    render(
      <ChangeApprovalDialog
        groups={mockGroups}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onApproveAll={vi.fn()}
        onRejectAll={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('/src/test.ts')).toBeInTheDocument();
    expect(screen.getByText('/src/new.ts')).toBeInTheDocument();
    expect(screen.getByText('(edit)')).toBeInTheDocument();
    expect(screen.getByText('(create)')).toBeInTheDocument();
  });
});
