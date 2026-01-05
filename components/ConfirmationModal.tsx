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
  variant?: 'primary' | 'destructive';
  alternativeAction?: {
    text: string;
    onClick: () => void;
    title?: string;
  };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Продовжити",
  cancelText = "Скасувати",
  variant = 'destructive',
  alternativeAction,
}) => {
  if (!isOpen) return null;

  const confirmButtonClass = variant === 'primary' 
    ? "bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]"
    : "bg-[var(--destructive-bg)] hover:bg-[var(--destructive-bg-hover)]";

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
          {alternativeAction && (
            <button
                onClick={alternativeAction.onClick}
                title={alternativeAction.title}
                className="px-6 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors"
            >
                {alternativeAction.text}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-6 py-2 rounded-lg font-semibold text-[var(--accent-text)] transition-colors ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmationModal;