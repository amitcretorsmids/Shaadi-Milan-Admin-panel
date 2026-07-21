'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAgentsStats, useCreateAgent, usePaginatedAgents, useUpdateAgent, useDeleteAgent, useApproveAgent } from '@/hooks/use-queries';
import { firebaseApi } from '@/lib/api';
import { StatCard, Card, CardHeader, Button, Table, Tr, Td, Skeleton, Badge, Input, Select, Avatar } from '@/components/ui';
import { InfiniteData } from "@tanstack/react-query";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { OriginalAgent } from '@/types';
import { CreateAgentModal } from '@/components/agent/CreateAgentModal';


const STATES = ['Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Jharkhand', 'Karnataka'];
const DISTRICTS: Record<string, string[]> = {
  'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Kanpur', 'Agra', 'Prayagraj', 'Meerut'],
  'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
};

const INIT_FORM = { name: '', phone: '', email: '', state: 'Uttar Pradesh', district: 'Lucknow', status: 'Active' as const, joinedAt: new Date().toISOString().split('T')[0] };

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper function to get status from data
const getAgentStatus = (agent: OriginalAgent) => {
  if (agent.isApproved) return 'Active';
  if (agent.isRejected) return 'Rejected';
  return 'Pending';
};

export type AgentsResponse = {
  agents: OriginalAgent[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 animate-in fade-in zoom-in duration-200">
        <div className="bg-[var(--background)] rounded-xl shadow-2xl border border-[var(--border)]">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-dim)] hover:text-[var(--text)] transition-colors text-xl"
            >
              ✕
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

// View Agent Modal
const ViewAgentModal = ({ agent, isOpen, onClose }: { agent: OriginalAgent | null; isOpen: boolean; onClose: () => void }) => {
  if (!agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agent Details">
      <div className="space-y-5">
        {/* Profile Section */}
        <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
          {agent.profileImageUrl ? (
            <img src={agent.profileImageUrl} alt={agent.agentName} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00c9a7] to-[#a78bfa] flex items-center justify-center text-3xl text-white">
              {agent.agentName?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-[var(--text)]">{agent.agentName}</h3>
            <p className="text-sm text-[var(--text-dim)]">Agent ID: <span className="font-mono text-[#ffc84a]">{agent.agentId}</span></p>
            <Badge variant={agent.isApproved ? 'success' : agent.isRejected ? 'danger' : 'warning'} >
              {getAgentStatus(agent)}
            </Badge>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={agent.agentName} />
          <InfoItem label="Mobile Number" value={agent.agentMobile} />
          <InfoItem label="Email Address" value={agent.agentEmail} />
          <InfoItem label="Platform" value={agent.platform === 'android' ? '📱 Android' : agent.platform === 'admin' ? '👑 Admin' : '🌐 Web'} />
          <InfoItem label="Registration Date" value={formatDate(agent.registrationDate)} />
          <InfoItem label="License Number" value={agent.agentLicenseNumber} />
          <InfoItem label="Aadhar Number" value={agent.agentAadhar} />
          <InfoItem label="City" value={agent.agentCity} />
          <InfoItem label="State" value={agent.agentState} />
          <InfoItem label="Pincode" value={agent.agentPincode} />
          <InfoItem label="Address" value={agent.agentAddress} colSpan={2} />
          <InfoItem label="Role" value={agent.role === 'admin' ? '👑 Administrator' : '🤝 Agent'} />
          <InfoItem label="UID" value={agent.uid} />
        </div>

        {/* Documents Section */}
        {(agent.aadharUrl || agent.primaryImageUrl) && (
          <div className="pt-4 border-t border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-3">Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agent.aadharUrl && (
                <a href={agent.aadharUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] hover:border-[#00c9a7] transition-colors">
                  <span className="text-xl">📄</span>
                  <span className="text-sm text-[var(--text)]">View Aadhar Card</span>
                </a>
              )}
              {agent.primaryImageUrl && (
                <a href={agent.primaryImageUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] hover:border-[#00c9a7] transition-colors">
                  <span className="text-xl">🖼️</span>
                  <span className="text-sm text-[var(--text)]">View Primary Document</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Edit Agent Modal
const EditAgentModal = ({ 
  agent, 
  isOpen, 
  onClose, 
  onSave,
  isUpdating 
}: { 
  agent: OriginalAgent | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (updatedData: Partial<OriginalAgent>) => void;
  isUpdating: boolean;
}) => {
  const [formData, setFormData] = useState<Partial<OriginalAgent>>({
    agentId: '',
    agentName: '',
    agentMobile: '',
    agentEmail: '',
    agentCity: '',
    agentState: '',
    agentPincode: '',
    agentAddress: '',
  });
  const [agentIdError, setAgentIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData({
        agentId: agent.agentId || '',
        agentName: agent.agentName || '',
        agentMobile: agent.agentMobile || '',
        agentEmail: agent.agentEmail || '',
        agentCity: agent.agentCity || '',
        agentState: agent.agentState || '',
        agentPincode: agent.agentPincode || '',
        agentAddress: agent.agentAddress || '',
      });
    }
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgentIdError('');

    const newId = formData.agentId?.trim();
    if (newId && newId !== agent?.agentId) {
      setIsCheckingId(true);
      try {
        const existing = await firebaseApi.getAgentByCustomId(newId);
        if (existing) {
          setAgentIdError('This Agent ID already exists. Please enter a unique Agent ID.');
          setIsCheckingId(false);
          return;
        }
      } catch {
        // if lookup fails, allow save to proceed
      } finally {
        setIsCheckingId(false);
      }
    }

    onSave(formData);
  };

  if (!agent) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Agent">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Agent ID</label>
            <Input
              value={formData.agentId}
              onChange={(e) => { setFormData({ ...formData, agentId: e.target.value }); setAgentIdError(''); }}
              placeholder="e.g. 7482780"
              className={agentIdError ? 'border-red-500' : ''}
            />
            {agentIdError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                ⚠️ {agentIdError}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Full Name</label>
            <Input
              value={formData.agentName}
              onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Mobile Number</label>
            <Input
              type="tel"
              value={formData.agentMobile}
              onChange={(e) => setFormData({ ...formData, agentMobile: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Email Address</label>
            <Input
              type="email"
              value={formData.agentEmail}
              onChange={(e) => setFormData({ ...formData, agentEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">City</label>
            <Input
              value={formData.agentCity}
              onChange={(e) => setFormData({ ...formData, agentCity: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">State</label>
            <Select
              value={formData.agentState}
              onChange={(e) => setFormData({ ...formData, agentState: e.target.value })}
              className="w-full"
            >
              {STATES.map(s => <option key={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Pincode</label>
            <Input
              value={formData.agentPincode}
              onChange={(e) => setFormData({ ...formData, agentPincode: e.target.value })}
              required
              pattern="[0-9]{6}"
              title="Please enter a valid 6-digit pincode"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1.5">Address</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text)] focus:outline-none focus:border-[#00c9a7] transition-colors"
              rows={3}
              value={formData.agentAddress}
              onChange={(e) => setFormData({ ...formData, agentAddress: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isUpdating || isCheckingId}>
            {isCheckingId ? 'Checking ID...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Action Dropdown Menu
const ActionMenu = ({
  agent,
  onView,
  onEdit,
  onApprove,
  onUnapprove,
  onDelete,
  isApproving,
}: {
  agent: OriginalAgent;
  onView: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onUnapprove: () => void;
  onDelete: () => void;
  isApproving: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const items = [
    { label: '👁 View', color: '#00c9a7', action: () => { onView(); setOpen(false); } },
    { label: '✏️ Edit', color: '#a78bfa', action: () => { onEdit(); setOpen(false); } },
    agent.isApproved
      ? { label: '⛔ Unapprove', color: '#ffc84a', action: () => { onUnapprove(); setOpen(false); } }
      : { label: '✅ Approve', color: '#00c9a7', action: () => { onApprove(); setOpen(false); } },
    { label: '🗑 Delete', color: '#ff8fa3', action: () => { onDelete(); setOpen(false); } },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-7 cursor-pointer h-7 flex items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:border-[rgba(0,201,167,0.4)] hover:bg-[rgba(0,201,167,0.05)] transition-colors text-base leading-none"
        title="Actions"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--background, #1a1a2e)', backdropFilter: 'none', opacity: 1 }}>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.label.includes('Approve') && isApproving}
              className=" cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text)] hover:bg-[rgba(255,255,255,0.07)] active:bg-[rgba(255,255,255,0.12)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: item.color }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Info Item Component
const InfoItem = ({ label, value, colSpan = 1 }: { label: string; value: string; colSpan?: number }) => (
  <div className={`${colSpan === 2 ? 'md:col-span-2' : ''}`}>
    <label className="block text-xs uppercase tracking-widest text-[var(--text-dim)] font-semibold mb-1">{label}</label>
    <p className="text-sm text-[var(--text)] break-words">{value || '—'}</p>
  </div>
);

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  agent,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  agent: OriginalAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => {
  if (!agent) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Agent">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgba(232,86,106,0.08)] border border-[rgba(232,86,106,0.25)]">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-[var(--text)]">
            Are you sure you want to delete <span className="font-semibold text-[#ff8fa3]">{agent.agentName}</span>? This will permanently remove them from Firestore and Firebase Auth. This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm rounded-lg bg-[#e8566a] text-white hover:bg-[#d04055] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default function AgentManagementPage() {
  const { data: stats, isLoading: isStatsLoading } = useAgentsStats();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { mutate: createAgent, isPending } = useCreateAgent();
  const { mutate: updateAgent, isPending: isUpdating } = useUpdateAgent();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteAgent();
  const { mutate: approveAgent, isPending: isApproving } = useApproveAgent();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [created, setCreated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState<OriginalAgent | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const itemsPerPage = 5;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = usePaginatedAgents({ search: searchTerm });

  const agents = useMemo(() => {
    const pages = (data as InfiniteData<AgentsResponse> | undefined)?.pages;
    return pages?.flatMap(page => page.agents) || [];
  }, [data]);

  // Filter agents based on search
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    const search = searchTerm.toLowerCase();
    return agents.filter(agent => 
      agent.agentName?.toLowerCase().includes(search) ||
      agent.agentMobile?.includes(search) ||
      agent.agentCity?.toLowerCase().includes(search) ||
      agent.agentState?.toLowerCase().includes(search) ||
      agent.agentId?.includes(search)
    );
  }, [agents, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAgents.length / itemsPerPage);
  const paginatedAgents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAgents.slice(startIndex, endIndex);
  }, [filteredAgents, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

const handleCreateAgent = (data: any) => {
  const saveData = {
    ...data,
    role: "agent",
    platform: "admin panel",
    registrationDate: new Date().toISOString(),
    isApproved: false,
    isRejected: false,
    uid: '',          // 🔥 same as doc id

  };

  // console.log("save data", saveData); // ✅ correct

  createAgent(saveData, {
    onSuccess: () => {
      setCreated("New Agent");
      setIsCreateModalOpen(false);
      refetch();
      setTimeout(() => setCreated(null), 4000);
    },
    onError: (err: any) => {
      console.error(err);
      alert("Failed to create agent");
    },
  });
};

  // const handleCreate = () => {
  //   if (!form.name || !form.phone) return;
  //   createAgent(form, {
  //     onSuccess: (agent) => {
  //       setCreated(agent.id);
  //       setForm(INIT_FORM);
  //       setShowForm(false);
  //       setTimeout(() => setCreated(null), 4000);
  //       refetch();
  //     },
  //   });
  // };

  const handleView = (agent: OriginalAgent) => {
    setSelectedAgent(agent);
    setIsViewModalOpen(true);
  };

  const handleEdit = (agent: OriginalAgent) => {
    setSelectedAgent(agent);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedData: Partial<OriginalAgent>) => {
    if (!selectedAgent) return;

    const oldAgentId = selectedAgent.agentId;
    const newAgentId = updatedData.agentId?.trim();

    updateAgent(
      { uid: selectedAgent.uid, data: updatedData },
      {
        onSuccess: async () => {
          // If agentId changed, cascade the update to all users referencing the old ID
          if (newAgentId && newAgentId !== oldAgentId) {
            try {
              await firebaseApi.updateUsersAgentId(oldAgentId, newAgentId);
            } catch (err) {
              console.error('Failed to update users agentId:', err);
            }
          }
          setUpdateSuccess('Agent updated successfully!');
          setIsEditModalOpen(false);
          setTimeout(() => setUpdateSuccess(null), 4000);
          refetch();
        },
        onError: (error: any) => {
          console.error('Error updating agent:', error);
          alert('Failed to update agent. Please try again.');
        },
      }
    );
  };

  const handleDelete = (agent: OriginalAgent) => {
    setSelectedAgent(agent);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedAgent) return;
    deleteAgent(selectedAgent.uid, {
      onSuccess: () => {
        setActionSuccess(`Agent "${selectedAgent.agentName}" deleted successfully.`);
        setIsDeleteModalOpen(false);
        setSelectedAgent(null);
        refetch();
        setTimeout(() => setActionSuccess(null), 4000);
      },
      onError: (err: any) => {
        console.error(err);
        alert('Failed to delete agent. Please try again.');
      },
    });
  };

  const handleApprove = (agent: OriginalAgent) => {
    approveAgent({ uid: agent.uid, isApproved: true }, {
      onSuccess: () => {
        setActionSuccess(`Agent "${agent.agentName}" approved successfully.`);
        refetch();
        setTimeout(() => setActionSuccess(null), 4000);
      },
      onError: (err: any) => {
        console.error(err);
        alert('Failed to approve agent.');
      },
    });
  };

  const handleUnapprove = (agent: OriginalAgent) => {
    approveAgent({ uid: agent.uid, isApproved: false }, {
      onSuccess: () => {
        setActionSuccess(`Agent "${agent.agentName}" unapproved.`);
        refetch();
        setTimeout(() => setActionSuccess(null), 4000);
      },
      onError: (err: any) => {
        console.error(err);
        alert('Failed to unapprove agent.');
      },
    });
  };

  // Pagination controls component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--background-secondary)] gap-4">
        <div className="text-sm text-[var(--text-dim)]">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
        </div>
        <div className="flex gap-1 flex-wrap justify-center">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)] transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 py-1.5 text-sm text-[var(--text-dim)]">...</span>}
            </>
          )}
          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                currentPage === page
                  ? 'bg-[#00c9a7] border-[#00c9a7] text-white'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)]'
              }`}
            >
              {page}
            </button>
          ))}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 py-1.5 text-sm text-[var(--text-dim)]">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)] transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00c9a7] hover:border-[rgba(0,201,167,0.4)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-[var(--background)] min-h-screen">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard label="Total Agents" value={stats?.total ?? 0} icon="🤝" color="teal" />
            <StatCard label="Active" value={stats?.active ?? 0} icon="✅" color="gold" />
            <StatCard label="New This Month" value={stats?.newThisMonth ?? 0} icon="📅" color="purple" />
            <StatCard label="Pending" value={stats?.inactive ?? 0} icon="⏳" color="purple" />
          </>
        )}
      </div>

      {/* Success toasts */}
      {created && (
        <div className="bg-[rgba(0,201,167,0.1)] border border-[rgba(0,201,167,0.3)] rounded-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <span className="text-lg">🎉</span>
          <span className="text-sm text-[#00c9a7] font-medium">Agent registered successfully! ID: <span className="font-mono">{created}</span></span>
        </div>
      )}

      {updateSuccess && (
        <div className="bg-[rgba(0,201,167,0.1)] border border-[rgba(0,201,167,0.3)] rounded-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <span className="text-lg">✅</span>
          <span className="text-sm text-[#00c9a7] font-medium">{updateSuccess}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-[rgba(0,201,167,0.1)] border border-[rgba(0,201,167,0.3)] rounded-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2">
          <span className="text-lg">✅</span>
          <span className="text-sm text-[#00c9a7] font-medium">{actionSuccess}</span>
        </div>
      )}

    
      {/* Table */}
      <Card>
        <CardHeader
          title="Agent Registry"
          subtitle="All registered agents"
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name, phone, city..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full sm:w-64 pl-8"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">🔍</span>
              </div>
<div className="flex gap-2">
  <Button
    onClick={() => setIsCreateModalOpen(true)}
    className="bg-[#00c9a7] text-white"
  >
    + Create Agent
  </Button>

  <Button variant="ghost" size="sm">Export</Button>
</div>            </div>
          }
        />
        {isLoading ? (
          <div className="p-5 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : paginatedAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🤝</div>
            <p className="text-[var(--text-dim)]">No agents found</p>
            {searchTerm && (
              <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="mt-2">
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table headers={['Agent', 'ID', 'City', 'State', 'Registered', 'Platform', 'Status', 'Actions']}>
                {paginatedAgents.map((agent, idx) => (
                  <Tr key={agent.uid || idx}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        {agent.profileImageUrl ? (
                          <img src={agent.profileImageUrl} alt={agent.agentName} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <Avatar name={agent.agentName} size="sm" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-[var(--text)]">{agent.agentName}</div>
                          <div className="text-[11px] text-[var(--text-dim)]">{agent.agentMobile}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="font-mono text-[11px] text-[#ffc84a]">{agent.agentId}</Td>
                    <Td className="text-sm">{agent.agentCity}</Td>
                    <Td className="text-sm">{agent.agentState}</Td>
                    <Td className="text-sm">{formatDate(agent.registrationDate)}</Td>
                    <Td>
                      <Badge variant={agent.platform === 'android' ? 'success' : 'info'}>
                        {agent.platform === 'android' ? '📱 Android' : agent.role === 'admin' ? '👑 Admin' : '🌐 Web'}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge variant={agent.isApproved ? 'success' : agent.isRejected ? 'danger' : 'warning'}>
                        {getAgentStatus(agent)}
                      </Badge>
                    </Td>
                    <Td>
                      <ActionMenu
                        agent={agent}
                        onView={() => handleView(agent)}
                        onEdit={() => handleEdit(agent)}
                        onApprove={() => handleApprove(agent)}
                        onUnapprove={() => handleUnapprove(agent)}
                        onDelete={() => handleDelete(agent)}
                        isApproving={isApproving}
                      />
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>
            <PaginationControls />
          </>
        )}
      </Card>

      {/* Load more button for infinite scroll (optional) */}
      {hasNextPage && !searchTerm && (
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Load More Agents
          </Button>
        </div>
      )}

      {/* View Modal */}
      <ViewAgentModal 
        agent={selectedAgent} 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
      />

      {/* Edit Modal */}
      <EditAgentModal 
        agent={selectedAgent} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleSaveEdit}
        isUpdating={isUpdating}
      />
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateAgent}
        isCreating={isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        agent={selectedAgent}
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedAgent(null); }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}