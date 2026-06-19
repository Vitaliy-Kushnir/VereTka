import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon } from './icons';
import { InputWrapper, Label } from './FormControls';

interface SaveTemplateModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ onClose, onSave }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(t('template.new'));

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

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
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('template.saveAsTemplate')}</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('action.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    <InputWrapper>
                        <Label htmlFor="templateName">{t('template.name')}</Label>
                        <input 
                            id="templateName"
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            autoFocus
                        />
                    </InputWrapper>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        {t('action.cancel')}
                    </button>
                     <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed"
                    >
                        {t('action.save')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SaveTemplateModal;
