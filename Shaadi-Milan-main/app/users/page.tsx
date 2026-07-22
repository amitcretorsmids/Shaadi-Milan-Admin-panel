'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useOriginalAgents,
  useUpdateOriginalUser,
  usePaginatedUsers,
  useUsersStats,
} from '@/hooks/use-queries';

import {
  StatCard,
  Card,
  CardHeader,
  Button,
  Table,
  Tr,
  Td,
  Skeleton,
  Input,
  Select,
  Avatar,
  Badge,
  EmptyState,
  PageHeader
} from '@/components/ui';

import { UserViewModal } from '@/components/modals/UserViewModal';
import { UserEditModal } from '@/components/modals/UserEditModal';
import type { OriginalUser } from '@/types';
import { Timestamp } from "firebase/firestore";

const GENDERS = ['All', 'male', 'female'] as const;
type GenderType = typeof GENDERS[number];

interface AgentOption {
  id: string;
  name: string;
}

// ─── Helper: safely extract a string from Firebase fields that may be objects ──
// Some Firebase fields are stored as { en: "value", hi: "value" } instead of plain strings
function getString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Try common language keys
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.hi === 'string') return obj.hi;
    // Return first string value found
    const firstStr = Object.values(obj).find(v => typeof v === 'string');
    if (firstStr) return firstStr as string;
  }
  return fallback;
}

export default function UsersPage() {
  const [gender, setGender] = useState<GenderType>('All');
  const [agentId, setAgentId] = useState<string>('All');
  const [search, setSearch] = useState('');

  const queryClient = useQueryClient();

  // ✅ Debounce search to avoid too many requests
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  // ✅ Prepare filters object - IMPORTANT: Convert 'All' to undefined
  const filters = useMemo(() => {
    const filterObj: {
      gender?: string;
      agentId?: string;
      search?: string;
    } = {};
    
    if (gender !== 'All') {
      filterObj.gender = gender;
    }
    
    if (agentId !== 'All') {
      filterObj.agentId = agentId;
    }
    
    if (debouncedSearch) {
      filterObj.search = debouncedSearch;
    }
    
    // console.log('Applying filters:', filterObj); // Debug log
    
    return filterObj;
  }, [gender, agentId, debouncedSearch]);

  // ✅ Reset pagination when filters change
  useEffect(() => {
    // Cancel any ongoing queries
    queryClient.cancelQueries({ queryKey: ['users'] });
    // Remove old cached data
    queryClient.removeQueries({ queryKey: ['users'] });
  }, [filters, queryClient]);

  // Pagination Hook - PASS THE FILTERS OBJECT
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: usersLoading,
    refetch,
    isRefetching
  } = usePaginatedUsers(filters); // ✅ Pass the filters object directly
const { data: stats, isLoading: statsLoading } = useUsersStats();
  // Flatten paginated data
  const users = useMemo(() => {
    return data?.pages.flatMap(page => page.users) || [];
  }, [data]);

  const { data: agents } = useOriginalAgents();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateOriginalUser();

  const agentOptions: AgentOption[] = useMemo(() => [
    { id: 'All', name: 'All Agents' },
    ...(agents?.map(a => ({ id: a.uid, name: a.agentName })) || [])
  ], [agents]);

  // Stats calculations
  // const stats = useMemo(() => ({
  //   maleCount: users.filter(u => u.gender === 'male').length,
  //   femaleCount: users.filter(u => u.gender === 'female').length,
  //   profileCreatedCount: users.filter(u => u.isProfileCreated).length,
  // }), [users]);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<OriginalUser | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewUser = useCallback((user: OriginalUser) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  }, []);

  const handleEditUser = useCallback((user: OriginalUser) => {
    console.log("selected user for edit:", user); // Debug log
    setSelectedUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateUser = useCallback(async (uid: string, data: Partial<OriginalUser>) => {
    updateUser(
      { uid, data },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
          refetch();
        },
      }
    );
  }, [updateUser, refetch]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (!users.length) return;

    const headers = ['UID', 'Full Name', 'Gender', 'Phone', 'Email', 'Profile Created', 'Agent ID', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...users.map(u => [
        u.uid,
        `"${u.fullName}"`,
        u.gender,
        u.phone,
        u.email || '',
        u.isProfileCreated ? 'Yes' : 'No',
        u.agentId || '',
       u.createdAt
  ? u.createdAt instanceof Timestamp
    ? new Date(u.createdAt.seconds * 1000).toLocaleDateString()
    : new Date(u.createdAt).toLocaleDateString()
  : ''
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [users]);

  const handleClearFilters = useCallback(() => {
    setGender('All');
    setAgentId('All');
    setSearch('');
    setDebouncedSearch('');
  }, []);

  const isLoading = usersLoading || isRefetching;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Users Management"
        subtitle="Manage and monitor all registered users"
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="primary" onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
        }
      />

    {/* Stats Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
  {statsLoading ? (
    Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-32 rounded-2xl" />
    ))
  ) : (
    <>
      <StatCard 
        label="Total Users" 
        value={(stats?.total ?? 0).toLocaleString()} 
        icon="👥" 
        color="gold"
      />
      <StatCard 
        label="Male" 
        value={stats?.male ?? 0} 
        icon="👨" 
        color="blue"
      />
      <StatCard 
        label="Female" 
        value={stats?.female ?? 0} 
        icon="👩" 
        color="pink"
      />
      <StatCard 
        label="Profile Created" 
        value={stats?.profileCreated ?? 0} 
        icon="✅" 
        color="teal"
      />
    </>
  )}
</div>

      {/* Filters Card */}
      <Card>
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="🔍 Search by name, email or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full"
              />
              {search && search !== debouncedSearch && (
                <span className="text-xs text-[var(--text-muted)] mt-1 inline-flex items-center gap-1">
                  <span className="animate-pulse">⏳</span> Searching...
                </span>
              )}
            </div>

            {/* Gender Filter */}
            <div className="flex gap-1 bg-[var(--bg-surface)] rounded-lg p-0.5">
              {GENDERS.map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                    gender === g
                      ? 'bg-[rgba(124,92,252,0.3)] text-[var(--text)] border border-[rgba(124,92,252,0.4)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {g === 'All' ? 'All Genders' : g === 'male' ? '👨 Male' : '👩 Female'}
                </button>
              ))}
            </div>

            {/* Agent Filter */}
            <Select
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
              className="min-w-[150px]"
            >
              {agentOptions.map((opt, idx) => (
                <option key={opt.id || `agent-opt-${idx}`} value={opt.id}>{opt.name || 'Unnamed Agent'}</option>
              ))}
            </Select>

            {/* Active Filters Indicator */}
            {(gender !== 'All' || agentId !== 'All' || search) && (
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  Active Filters: 
                  {gender !== 'All' && ` ${gender}`}
                  {agentId !== 'All' && ` • Specific Agent`}
                  {search && ` • "${search}"`}
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleClearFilters}
                >
                  ✕ Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader 
          title={`Users List (${users.length})`}
          subtitle={Object.keys(filters).length > 0 ? "Filtered results" : "Showing all registered users"}
        />

        {isLoading && users.length === 0 ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState 
            icon="🔍" 
            message="No users found. Try adjusting your filters." 
          />
        ) : (
          <>
            <Table headers={['User', 'UID', 'Phone', 'Email', 'Status', 'Actions']}>
              {users.map((u, index) => (
                <Tr key={u.uid} className={index % 2 === 0 ? 'bg-[rgba(255,255,255,0.02)]' : ''}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={getString(u.fullName)} 
                        size="md"
                        gender={getString(u.gender)}
                      />
                      <div>
                        <div className="font-medium text-[var(--text)]">{getString(u.fullName) || '—'}</div>
                        <Badge variant={getString(u.gender) === 'male' ? 'male' : getString(u.gender) === 'female' ? 'female' : 'neutral'}>
                          {getString(u.gender) || 'Not specified'}
                        </Badge>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <code className="text-[11px] bg-[var(--bg-surface)] px-2 py-1 rounded">
                      {(getString(u.uid) || u.uid || '').slice(0, 8)}...
                    </code>
                  </Td>
                  <Td className="font-mono text-xs">{getString(u.phone) || '—'}</Td>
                  <Td>
                    <span className="text-xs text-[var(--text-muted)]">
                      {getString(u.email) || '—'}
                    </span>
                  </Td>
                  <Td>
                    {u.isProfileCreated ? (
                      <Badge variant="success">✅ Profile Created</Badge>
                    ) : (
                      <Badge variant="warning">⚠️ Incomplete</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewUser(u)}
                      >
                        👁️ View
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleEditUser(u)}
                      >
                        ✏️ Edit
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center p-6 border-t border-[var(--border)]">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="primary"
                  loading={isFetchingNextPage}
                >
                  {isFetchingNextPage
                    ? 'Loading more users...'
                    : `📄 Load More (${users.length} loaded)`}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Modals */}
      <UserViewModal 
        user={selectedUser} 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
      />
      <UserEditModal 
        user={selectedUser} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleUpdateUser} 
        isSaving={isUpdating} 
      />
    </div>
  );
}