import React, { useState, useEffect } from 'react';
import { XIcon, EyeIcon, EyeOffIcon } from './icons';
import { useLanguage } from './LanguageContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string | null) => void;
  currentApiKey: string | null;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const { t } = useLanguage();
    const [key, setKey] = useState(currentApiKey || '');
    const [isKeyVisible, setIsKeyVisible] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setKey(currentApiKey || '');
            setShowInstructions(false);
        }
    }, [isOpen, currentApiKey]);

    const handleSave = () => {
        onSave(key.trim() === '' ? null : key.trim());
        onClose();
    };

    const handleDelete = () => {
        setKey('');
        onSave(null);
        onClose();
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
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('apikey.title')}</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('apikey.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {!showInstructions ? (
                        <>
                            <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                                <p className="text-xs text-[var(--text-tertiary)]" dangerouslySetInnerHTML={{ __html: t('apikey.warning1') }}>
                                </p>
                            </div>
                            <div className="relative">
                                <input 
                                    type={isKeyVisible ? 'text' : 'password'}
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    placeholder={t('apikey.placeholder')}
                                    className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-3 py-2 border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none pr-10"
                                />
                                <button
                                    onClick={() => setIsKeyVisible(p => !p)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    title={isKeyVisible ? t('apikey.hide') : t('apikey.show')}
                                >
                                    {isKeyVisible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                </button>
                            </div>
                            <div className="text-center">
                                <button
                                    onClick={() => setShowInstructions(true)}
                                    className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline"
                                >
                                    {t('apikey.whereToGet')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>
                             <button
                                onClick={() => setShowInstructions(false)}
                                className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] underline mb-4"
                            >
                                {t('apikey.backToInput')}
                            </button>
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{t('apikey.howToGetTitle')}</h3>
                            <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                                <p>{t('apikey.howToGet1')}</p>
                                <ol className="list-decimal list-inside space-y-2 pl-2">
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step1') }} />
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step2') }} />
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step3') }} />
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step4') }} />
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step5') }} />
                                    <span dangerouslySetInnerHTML={{ __html: t('apikey.step6') }} />
                                </ol>
                                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                                    <p className="text-xs text-[var(--text-tertiary)]" dangerouslySetInnerHTML={{ __html: t('apikey.warning2') }}>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-between items-center flex-shrink-0">
                    <div>
                        {currentApiKey && (
                             <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg font-semibold text-sm bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] transition-colors"
                            >
                                {t('apikey.delete')}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-lg font-semibold bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                        >
                            {t('action.cancel2')}
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                        >
                            {t('action.save')}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ApiKeyModal;