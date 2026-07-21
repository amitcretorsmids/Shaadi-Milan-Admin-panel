// components/modals/UserEditModal.tsx

'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button, Input, Select,  Badge } from '@/components/ui';
import type { OriginalUser } from '@/types';

interface UserEditModalProps {
  user: OriginalUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (uid: string, data: Partial<OriginalUser>) => void;
  isSaving: boolean;
}

export function UserEditModal({ user, isOpen, onClose, onSave, isSaving }: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<OriginalUser>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        gender: user.gender,
        platform: user.platform,
        role: user.role,
        isProfileCreated: user.isProfileCreated,
        agentNotifiedOnRegister: user.agentNotifiedOnRegister,
        agentId: user.agentId,
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.uid, formData);
  };

  const handleChange = (field: keyof OriginalUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl transition-all">
                <form onSubmit={handleSubmit}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <Dialog.Title className="text-lg font-semibold text-[var(--text)]">
                      Edit User
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* User ID Display */}
                    <div className="mb-4 p-3 rounded-lg bg-[rgba(124,92,252,0.05)] border border-[rgba(124,92,252,0.1)]">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">User ID</p>
                      <p className="text-sm font-mono text-[var(--text)]">{user.uid}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Full Name *
                        </label>
                        <Input
                          value={formData.fullName || ''}
                          onChange={(e) => handleChange('fullName', e.target.value)}
                          required
                          className="w-full"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Gender *
                        </label>
                        <select
                          value={formData.gender || 'male'}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[#7c5cfc]"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      {/* Platform */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Platform
                        </label>
                        <select
                          value={formData.platform || 'android'}
                          onChange={(e) => handleChange('platform', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[#7c5cfc]"
                        >
                          <option value="android">Android</option>
                          <option value="ios">iOS</option>
                          <option value="web">Web</option>
                        </select>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Phone Number *
                        </label>
                        <Input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          required
                          className="w-full"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Role
                        </label>
                        <select
                          value={formData.role || 'user'}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[#7c5cfc]"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {/* Profile Status */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Profile Status
                        </label>
                        <select
                          value={formData.isProfileCreated ? 'created' : 'pending'}
                          onChange={(e) => handleChange('isProfileCreated', e.target.value === 'created')}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[#7c5cfc]"
                        >
                          <option value="created">Created</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>

                      {/* Agent Notification */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Agent Notified on Register
                        </label>
                        <select
                          value={formData.agentNotifiedOnRegister ? 'yes' : 'no'}
                          onChange={(e) => handleChange('agentNotifiedOnRegister', e.target.value === 'yes')}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm focus:outline-none focus:border-[#7c5cfc]"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </div>

                    {/* Agent ID (readonly) */}
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        Agent ID
                      </label>
                      <Input
                        value={formData.agentId || ''}
                        disabled
                        className="w-full bg-[var(--bg-surface)] opacity-70 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Agent ID cannot be changed</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}