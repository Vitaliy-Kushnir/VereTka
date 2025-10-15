import React from 'react';
import { XIcon } from './icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, version }) => {
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
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Про редактор "ВереTkа"</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Закрити">
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4 text-sm text-[var(--text-secondary)]">
                    <p>
                        <strong className="text-[var(--text-primary)]">ВереTkа</strong> — це простий векторний редактор, призначений для швидкого створення графічних примітивів та генерації відповідного Python коду для бібліотеки Tkinter.
                    </p>
                    <p>
                        Він використовує локальний генератор коду для миттєвого та надійного результату, а також може використовувати Google Gemini API для експериментальних можливостей.
                    </p>
                    
                    <hr className="border-[var(--border-secondary)]" />
                    
                    <div>
                        <p>
                            <strong className="text-[var(--text-primary)]">Ідея та розробка:</strong> Віталій Кушнір
                        </p>
                        <p>
                           <strong className="text-[var(--text-primary)]">Підтримка:</strong> AI-асистент на базі Google Gemini.
                        </p>
                         <p className="mt-2">
                           Створено за допомогою <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]">AI Studio Google</a>.
                        </p>
                    </div>

                     <p className="text-xs text-center text-[var(--text-tertiary)] pt-4">
                        Версія {version}
                    </p>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Закрити
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AboutModal;