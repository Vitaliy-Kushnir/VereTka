import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon, KeyIcon, ListIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from './icons';

interface CheatCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string) => void;
  showNotification: (message: string, type?: 'info' | 'error') => void;
  activeCheats?: Set<string>;
}

const CHEAT_CODES_LIST = ['000', '001', '002', '003', '004'];

const CheatCodeModal: React.FC<CheatCodeModalProps> = ({ isOpen, onClose, onActivate, showNotification, activeCheats }) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState('');
    const [showList, setShowList] = useState(false);

    const handleActivateCode = (codeNum: string) => {
        if (CHEAT_CODES_LIST.includes(codeNum)) {
            onActivate(codeNum);
            const formattedCode = `#${codeNum}`;
            if (codeNum === '000') {
                showNotification(t('cheat.reset'), 'info');
            } else {
                showNotification(t('cheat.activated', { code: formattedCode }), 'info');
            }
            onClose();
        }
    };

    const handleActivate = () => {
        const trimmedValue = inputValue.trim();
        const match = trimmedValue.match(/^#?(\d{3})$/);

        if (match) {
            const codeNumber = match[1];
            if (CHEAT_CODES_LIST.includes(codeNumber)) {
                handleActivateCode(codeNumber);
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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-[var(--border-primary)] transition-all"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center gap-2">
                        <KeyIcon size={20} className="text-[var(--accent-primary)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('cheat.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('action.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="p-5 space-y-4">
                    <p className="text-xs text-center text-[var(--text-tertiary)]">{t('cheat.desc')}</p>
                    
                    <div className="relative">
                        <input 
                            type="text" 
                            value={inputValue} 
                            placeholder="#000"
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleActivate(); }}
                            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] text-center text-xl tracking-widest font-mono rounded-lg px-3 py-2.5 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={() => setShowList(prev => !prev)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-secondary)] transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <ListIcon size={16} className="text-[var(--accent-primary)]" />
                                {showList ? t('cheat.hideList') : t('cheat.showList')}
                            </span>
                            {showList ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                        </button>

                        {showList && (
                            <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto p-2 bg-[var(--bg-app)]/60 rounded-lg border border-[var(--border-secondary)] text-xs">
                                {CHEAT_CODES_LIST.map((code) => {
                                    const codeKey = `cheat.code.${code}`;
                                    const description = t(codeKey as any) || code;
                                    const isActive = code !== '000' && activeCheats?.has(code);

                                    return (
                                        <div
                                            key={code}
                                            onClick={() => {
                                                setInputValue(`#${code}`);
                                            }}
                                            className="group flex items-center justify-between p-2 rounded-md hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors border border-transparent hover:border-[var(--border-secondary)]"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <code className="font-mono font-bold text-[var(--accent-primary)] bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-secondary)]">
                                                    #{code}
                                                </code>
                                                <span className="text-[var(--text-primary)] truncate">
                                                    {description}
                                                </span>
                                            </div>

                                            {isActive ? (
                                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex-shrink-0">
                                                    <CheckIcon size={12} />
                                                    {t('cheat.active')}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleActivateCode(code);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] transition-opacity flex-shrink-0"
                                                >
                                                    {t('cheat.activate')}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 border-t border-[var(--border-primary)] flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                        {t('action.cancel')}
                    </button>
                     <button
                        onClick={handleActivate}
                        className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        {t('cheat.activate')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default CheatCodeModal;