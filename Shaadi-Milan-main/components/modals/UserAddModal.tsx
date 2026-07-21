// components/modals/UserAddModal.tsx

'use client';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button, Input } from '@/components/ui';

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userData: any) => void;
  isAdding: boolean;
}

export function UserAddModal({ isOpen, onClose, onAdd, isAdding }: UserAddModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'male',
    platform: 'android',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Similar structure to Edit Modal */}
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl transition-all">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <Dialog.Title className="text-lg font-semibold text-[var(--text)]">
                      Add New User
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        Full Name *
                      </label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Gender *
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                          Platform
                        </label>
                        <select
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text)] text-sm"
                        >
                          <option value="android">Android</option>
                          <option value="ios">iOS</option>
                          <option value="web">Web</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                    <Button type="button" variant="ghost" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={isAdding}>
                      {isAdding ? 'Adding...' : 'Add User'}
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