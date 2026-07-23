// components/modals/UserViewModal.tsx

'use client';
import { Dialog, Transition,Button } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Calendar, Phone, Mail, User, MapPin, Shield, Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import type { OriginalUser } from '@/types';

// ─── Helper: safely extract a string from Firebase fields that may be {en, hi} objects ───
function getString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.en === 'string') return obj.en;
    if (typeof obj.hi === 'string') return obj.hi;
    const firstStr = Object.values(obj).find(v => typeof v === 'string');
    if (firstStr) return firstStr as string;
  }
  return fallback;
}

interface UserViewModalProps {
  user: OriginalUser | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserViewModal({ user, isOpen, onClose }: UserViewModalProps) {
  if (!user) return null;

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date === 'object' && date.toDate) {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  const InfoRow = ({ label, value, icon: Icon }: any) => (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className=" flex-shrink-0 w-8 h-8 rounded-lg bg-[rgba(124,92,252,0.1)] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#7c5cfc]" />
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[var(--text)] mt-0.5 break-all">{value || 'N/A'}</p>
      </div>
    </div>
  );

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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                  <Dialog.Title className="text-lg font-semibold text-[var(--text)]">
                    User Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
                    <Avatar name={getString(user.fullName)} size="lg" gender={getString(user.gender)} />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[var(--text)]">{getString(user.fullName) || 'N/A'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getString(user.gender) === 'male' ? 'male' : 'female'}>
                          {getString(user.gender) === 'male' ? 'Male' : 'Female'}
                        </Badge>
                        <Badge variant={user.isProfileCreated ? 'success' : 'warning'}>
                          {user.isProfileCreated ? 'Profile Created' : 'Profile Pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--text-dim)] font-mono">{getString(user.uid) || user.uid}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">User ID</p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-0 divide-y divide-[var(--border)]">
                    <InfoRow label="Phone Number" value={getString(user.phone)} icon={Phone} />
                    <InfoRow label="Email Address" value={getString(user.email)} icon={Mail} />
                    <InfoRow label="Platform" value={getString(user.platform)?.toUpperCase() || 'N/A'} icon={Smartphone} />
                    <InfoRow label="Agent ID" value={getString(user.agentId)} icon={User} />
                    <InfoRow label="Role" value={getString(user.role) || 'user'} icon={Shield} />
                    <InfoRow label="Joined At" value={formatDate(user.createdAt)} icon={Calendar} />
                    
                    {user.agentNotifiedOnRegister && (
                      <InfoRow 
                        label="Agent Notification" 
                        value={`Notified on ${formatDate(user.agentNotifiedAt)}`} 
                        icon={CheckCircle} 
                      />
                    )}

                    {user.fcmToken && (
                      <InfoRow 
                        label="FCM Token" 
                        value={getString(user.fcmToken).substring(0, 30) + '...'} 
                        icon={Smartphone} 
                      />
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-[var(--border)] bg-[var(--bg-surface)]">
                  <Button className="cursor-pointer" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}