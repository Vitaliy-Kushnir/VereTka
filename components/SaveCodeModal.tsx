import React, { useState } from 'react';
import { XIcon } from './icons';
import { InputWrapper, Label, Checkbox } from './FormControls';

interface SaveCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, extension: '.py' | '.txt', includeLineNumbers: boolean) => void;
  currentProjectName: string;
}

const SaveCodeModal: React.FC<SaveCodeModalProps> = ({ isOpen, onClose, onSave, currentProjectName }) => {
    const [name, setName] = useState(currentProjectName);
    const [extension, setExtension] = useState<'.py' | '.txt'>('.py');
    const [includeLineNumbers, setIncludeLineNumbers] = useState(false);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), extension, extension === '.txt' ? includeLineNumbers : false);
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
                    <p className="text-sm text-[var(--text-secondary)]">Задайте назву та оберіть необхідне розширення (тип) файлу.</p>
                    <InputWrapper>
                        <Label htmlFor="codeFileName" title="Введіть назву для вашого файлу.">Назва файлу:</Label>
                        <div className="flex items-center w-full">
                            <input 
                                id="codeFileName"
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-l px-2 py-1 h-[38px] w-full border border-r-0 border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                                autoFocus
                            />
                            <select
                                value={extension}
                                onChange={e => setExtension(e.target.value as '.py' | '.txt')}
                                className="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] h-[38px] px-3 py-1 rounded-r border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none appearance-none cursor-pointer"
                                title="Вибрати розширення файлу"
                            >
                                <option value=".py">.py</option>
                                <option value=".txt">.txt</option>
                            </select>
                        </div>
                    </InputWrapper>
                    {extension === '.txt' && (
                        <div className="pl-[104px]"> {/* Align with input fields (w-24 label + 0.5rem gap) */}
                            <Checkbox
                                id="includeLineNumbers"
                                checked={includeLineNumbers}
                                onChange={setIncludeLineNumbers}
                                label="Зберігати із номерами рядків"
                                title="Додати номери рядків на початок кожного рядка у текстовому файлі"
                            />
                        </div>
                    )}
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