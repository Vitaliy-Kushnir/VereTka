import React, { useState } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label } from './FormControls';

interface SaveCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentProjectName: string;
}

const SaveCodeModal: React.FC<SaveCodeModalProps> = ({ isOpen, onClose, onSave, currentProjectName }) => {
    const [name, setName] = useState(currentProjectName);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
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
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Зберегти код як...</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Закрити">
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    <InputWrapper>
                        <Label htmlFor="codeFileName">Назва файлу:</Label>
                        <div className="flex items-center w-full">
                            <input 
                                id="codeFileName"
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-l px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                                autoFocus
                            />
                            <span className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-3 py-1 rounded-r border border-l-0 border-[var(--border-secondary)]">.py</span>
                        </div>
                    </InputWrapper>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        Скасувати
                    </button>
                     <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed"
                    >
                        Зберегти
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SaveCodeModal;