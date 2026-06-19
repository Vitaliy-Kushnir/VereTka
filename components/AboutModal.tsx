import React, {useContext} from 'react';
import { useLanguage } from './LanguageContext';
import { XIcon } from './icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, version }) => {
    const { t } = useLanguage();
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
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('about.title')}</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('action.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="p-6 space-y-4 text-sm text-[var(--text-secondary)]">
                    <p>
                        <span dangerouslySetInnerHTML={{__html: t('about.p1')}}></span>
                    </p>
                    <p>
                        {t('about.p2')}
                    </p>
                    
                    <hr className="border-[var(--border-secondary)]" />
                    
                    <div>
                        <p>
                            <span dangerouslySetInnerHTML={{__html: t('about.author')}}></span>
                        </p>
                        <p>
                           <span dangerouslySetInnerHTML={{__html: t('about.support')}}></span>
                        </p>
                         <p className="mt-2">
                           <span dangerouslySetInnerHTML={{__html: t('about.tech')}}></span>
                        </p>
                    </div>

                     <p className="text-xs text-center text-[var(--text-tertiary)] pt-4">
                        {t('about.version')} {version}
                    </p>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end gap-3">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        {t('action.close')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AboutModal;