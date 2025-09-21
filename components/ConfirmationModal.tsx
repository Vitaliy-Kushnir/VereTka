import React from 'react';
import { XIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Продовжити",
  cancelText = "Скасувати",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-md flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Закрити">
            <XIcon />
          </button>
        </header>

        <div className="p-6">
          <p className="text-[var(--text-secondary)]">{message}</p>
        </div>

        <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg font-semibold bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] transition-colors"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;
