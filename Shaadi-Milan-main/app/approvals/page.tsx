'use client';
import { usePendingApprovals, useProcessApproval } from '@/hooks/use-queries';
import { Card, CardHeader, Button, Table, Tr, Td, Skeleton, Badge, Avatar, EmptyState } from '@/components/ui';

const PROCESSED_HISTORY = [
  { id: 'ARV-F-0998', name: 'Sita Devi', gender: 'Female', issue: 'Photo mismatch', date: '2025-01-07', decision: 'Approved' },
  { id: 'ARV-M-0995', name: 'Raj Kumar', gender: 'Male', issue: 'Invalid phone', date: '2025-01-06', decision: 'Rejected' },
  { id: 'ARV-F-0991', name: 'Geeta Sharma', gender: 'Female', issue: 'DOB invalid', date: '2025-01-05', decision: 'Approved' },
  { id: 'ARV-M-0988', name: 'Ravi Yadav', gender: 'Male', issue: 'Duplicate entry', date: '2025-01-04', decision: 'Rejected' },
];

export default function ApprovalsPage() {
  const { data: approvals, isLoading } = usePendingApprovals();
  const { mutate: process, isPending } = useProcessApproval();

  return (
    <div className="space-y-6">
      {/* Header badge */}
      <div className="flex items-center gap-3">
        <div className="bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.3)] rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-lg">⏳</span>
          <span className="text-sm font-semibold text-[#ffc84a]">{approvals?.length ?? 0} registrations pending review</span>
        </div>
      </div>

      {/* Pending approval cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : approvals?.length === 0 ? (
        <Card className="p-4">
          <EmptyState icon="✅" message="All registrations have been reviewed. No pending items." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(approvals || []).map((a) => (
            <div key={a.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border-light)] transition-all">
              {/* Profile row */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={a.name} size="md" gender={a.gender} />
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[var(--text)]">{a.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">Age {a.age} · {a.district}, {a.state}</div>
                  <div className="text-[10px] font-mono text-[var(--text-dim)] mt-0.5">{a.id}</div>
                </div>
                <Badge variant={a.gender === 'Male' ? 'male' : 'female'}>{a.gender}</Badge>
              </div>

              {/* Issue */}
              <div className="bg-[rgba(232,86,106,0.08)] border border-[rgba(232,86,106,0.2)] rounded-xl px-4 py-2.5 mb-3">
                <span className="text-[11px] text-[#ff8fa3]">⚠ Issue: {a.issue}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] mb-4">
                <span>Submitted: {a.submittedAt}</span>
                <span>Agent: {a.agentId}</span>
                <span>Docs: {a.documents.join(', ')}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-[11px] font-semibold border border-[var(--border-light)] text-[var(--text-muted)] hover:bg-[var(--bg-glass)] transition-colors">
                  📄 View Docs
                </button>
                <button
                  disabled={isPending}
                  onClick={() => process({ id: a.id, action: 'Approved' })}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold border border-[rgba(0,201,167,0.3)] bg-[rgba(0,201,167,0.1)] text-[#00c9a7] hover:bg-[rgba(0,201,167,0.2)] transition-colors disabled:opacity-50">
                  ✓ Approve
                </button>
                <button
                  disabled={isPending}
                  onClick={() => process({ id: a.id, action: 'Rejected' })}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold border border-[rgba(232,86,106,0.3)] bg-[rgba(232,86,106,0.1)] text-[#ff8fa3] hover:bg-[rgba(232,86,106,0.2)] transition-colors disabled:opacity-50">
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      <Card>
        <CardHeader
          title="Recently Processed"
          subtitle="Last 30 days approval history"
          action={<Button variant="ghost" size="sm">View All</Button>}
        />
        <Table headers={['ID', 'Name', 'Gender', 'Issue', 'Date', 'Decision']}>
          {PROCESSED_HISTORY.map((r, i) => (
            <Tr key={i}>
              <Td className="font-mono text-[10px] text-[var(--text-dim)]">{r.id}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar name={r.name} size="sm" gender={r.gender} />
                  <span className="font-medium text-[var(--text)] text-xs">{r.name}</span>
                </div>
              </Td>
              <Td><Badge variant={r.gender === 'Male' ? 'male' : 'female'}>{r.gender}</Badge></Td>
              <Td>{r.issue}</Td>
              <Td>{r.date}</Td>
              <Td><Badge variant={r.decision === 'Approved' ? 'success' : 'danger'}>{r.decision}</Badge></Td>
            </Tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
