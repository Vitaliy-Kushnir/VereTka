import React, {useContext} from 'react';
import { useLanguage } from './LanguageContext';
import { useState } from 'react';
import { XIcon } from './icons';

interface CheatCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string) => void;
  showNotification: (message: string, type?: 'info' | 'error') => void;
}

const VALID_CODES = ['001', '002', '000'];

const CheatCodeModal: React.FC<CheatCodeModalProps> = ({ isOpen, onClose, onActivate, showNotification }) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState('');

    const handleActivate = () => {
        const trimmedValue = inputValue.trim();
        const match = trimmedValue.match(/^#(\d{3})$/);

        if (match) {
            const codeNumber = match[1];
            if (VALID_CODES.includes(codeNumber)) {
                onActivate(codeNumber);
                if (codeNumber === '000') {
                    showNotification(t('cheat.reset'), 'info');
                } else {
                    showNotification(t('cheat.activated', { code: trimmedValue }), 'info');
                }
                onClose();
            } else {
                showNotification(t('cheat.invalid', { code: trimmedValue }), 'error');
            }
        } else {
            showNotification(t('cheat.formatError'), 'error');
        }
        setInputValue('');
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-sm flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('cheat.title')}</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('action.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-center text-[var(--text-tertiary)]">{t('cheat.desc')}</p>
                    <input 
                        type="text" 
                        value={inputValue} 
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
                        className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center text-lg font-mono rounded px-2 py-2 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                        autoFocus
                    />
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        {t('action.cancel')}
                    </button>
                     <button
                        onClick={handleActivate}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        {t('cheat.activate')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CheatCodeModal;