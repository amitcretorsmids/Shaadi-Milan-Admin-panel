// components/ui/modal.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  disableBackdropClose?: boolean;
  /** Extra content rendered between the title and the close button */
  headerExtra?: React.ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw] h-[90vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  disableBackdropClose = false,
  headerExtra,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!disableBackdropClose && !panelRef.current?.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${SIZE_CLASSES[size]}
          bg-[var(--bg-card)]
          border border-[var(--border)]
          rounded-2xl
          shadow-2xl
          flex flex-col
          max-h-[85vh]
          animate-in zoom-in-95 duration-200
        `}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00c9a7] via-[#7c5cfc] to-[#a78bfa] rounded-t-2xl" />

        {/* Header */}
        {title && (
          <div className="flex items-center px-6 py-4 border-b border-[var(--border)] shrink-0 gap-3">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-[#00c9a7] to-[#7c5cfc] bg-clip-text text-transparent flex-shrink-0">
              {title}
            </h2>
            {/* Extra slot — grows to fill space, right-aligned */}
            {headerExtra && (
              <div className="flex-1 flex justify-end">
                {headerExtra}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="
                w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                text-[var(--text-muted)]
                hover:bg-[var(--bg-glass)]
                hover:text-[var(--text-primary)]
                transition-all duration-150
              "
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}