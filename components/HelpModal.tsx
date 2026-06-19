
import React, { useRef, useState, useEffect } from 'react';
import { XIcon } from './icons';
import { useLanguage } from './LanguageContext';
import { HelpContentUK } from './help/HelpContentUK';
import { HelpContentEN } from './help/HelpContentEN';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper hook for debouncing input to improve performance
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const { language } = useLanguage();
    if (!isOpen) return null;

    const contentRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    const BASE_FONT_SIZE = 0.875; // 14px
    const MIN_FONT_SIZE = BASE_FONT_SIZE * 0.75;
    const MAX_FONT_SIZE = BASE_FONT_SIZE * 2.0;
    const FONT_STEP = BASE_FONT_SIZE * 0.05;

    const [fontSize, setFontSize] = useState(BASE_FONT_SIZE);

    const sections = language === 'en' ? [
        { id: 'intro', title: '1. Introduction' },
        { id: 'interface', title: '2. Interface Overview' },
        { id: 'projects', title: '3. Projects' },
        { id: 'templates', title: '4. Templates' },
        { id: 'shapes', title: '5. Objects' },
        { id: 'code-export', title: '6. Code & Export' },
        { id: 'feedback', title: '7. Feedback' },
        { id: 'hotkeys', title: '8. Hotkeys' },
    ] : [
        { id: 'intro', title: t('help.intro') },
        { id: 'interface', title: t('help.interface') },
        { id: 'projects', title: t('help.projects') },
        { id: 'templates', title: t('help.templates') },
        { id: 'shapes', title: t('help.shapes') },
        { id: 'code-export', title: t('help.codeExport') },
        { id: 'feedback', title: t('help.feedback') },
        { id: 'hotkeys', title: t('help.hotkeys') },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const targetElement = contentRef.current?.querySelector(`#${targetId}`);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Effect to update match count and reset index when search term changes
    useEffect(() => {
        if (!contentRef.current) return;
        
        if (!debouncedSearchTerm.trim()) {
            setMatchCount(0);
            setCurrentMatchIndex(-1);
            return;
        }

        const allMarks = contentRef.current.querySelectorAll<HTMLElement>('mark');
        setMatchCount(allMarks.length);
        setCurrentMatchIndex(allMarks.length > 0 ? 0 : -1);

    }, [debouncedSearchTerm]);


    // Effect to apply active highlight and scroll.
    // It runs when the index or the search term changes.
    useEffect(() => {
        if (!contentRef.current || currentMatchIndex === -1) return;

        // Query for the currently rendered marks to ensure we have fresh nodes
        const allMarks = Array.from(contentRef.current.querySelectorAll<HTMLElement>('mark'));

        if (allMarks.length === 0) return;

        allMarks.forEach((match: HTMLElement, index) => {
            if (index === currentMatchIndex) {
                match.classList.add('bg-orange-500', 'text-white');
                match.classList.remove('bg-yellow-400/80', 'text-black');
                match.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            } else {
                match.classList.remove('bg-orange-500', 'text-white');
                match.classList.add('bg-yellow-400/80', 'text-black');
            }
        });

    }, [currentMatchIndex, debouncedSearchTerm]);

    const handleNextMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev + 1) % matchCount);
    };

    const handlePrevMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount);
    };

    const applyHighlight = (node: React.ReactNode, term: string): React.ReactNode => {
        if (typeof node === 'string') {
            if (!term.trim()) {
                return node;
            }
            const parts = node.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
            return parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-400/80 text-black px-0.5 rounded-sm">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        }
        
        if (React.isValidElement(node)) {
            const el = node as React.ReactElement<{ children?: React.ReactNode }>;
            if (el.props.children) {
                return React.cloneElement(el, {
                    ...el.props,
                    children: React.Children.map(el.props.children, child => applyHighlight(child, term))
                });
            }
        }
        
        if (Array.isArray(node)) {
            return node.map((child, index) => <React.Fragment key={index}>{applyHighlight(child, term)}</React.Fragment>);
        }

        return node;
    };

    const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
        <h2 id={id} className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--border-secondary)] scroll-mt-4">{applyHighlight(children, debouncedSearchTerm)}</h2>
    );

    const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h3 className="text-md font-semibold text-[var(--text-primary)] mt-4 mb-2">{applyHighlight(children, debouncedSearchTerm)}</h3>
    );

    const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <p className="mb-2 leading-relaxed">{applyHighlight(children, debouncedSearchTerm)}</p>
    );

    const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <code className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-md font-mono" style={{ fontSize: '0.9em' }}>{children}</code>
    );

    const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <li className="mb-2 pl-2">{applyHighlight(children, debouncedSearchTerm)}</li>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0 gap-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] whitespace-nowrap">{t('help.title')}</h2>
                     <div className="flex-grow max-w-sm relative">
                        <input
                          type="text"
                          placeholder={t('help.search')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none pr-28"
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 h-full flex items-center gap-1 bg-[var(--bg-secondary)] pl-2">
                             {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    title={t('help.clearSearch')}
                                    aria-label={t('help.clearSearch')}
                                >
                                    <XIcon size={16} />
                                </button>
                            )}
                            {debouncedSearchTerm.trim() && (
                                <>
                                    {searchTerm && <div className="w-px h-4 bg-[var(--border-secondary)]"></div>}
                                    <div className="flex items-center text-xs text-[var(--text-tertiary)]">
                                        {matchCount > 0 ? (
                                            <>
                                                <span className="font-mono">{currentMatchIndex + 1}/{matchCount}</span>
                                                <button onClick={handlePrevMatch} className="p-1 hover:text-[var(--text-primary)]" title={t('help.prevResult')} aria-label={t('help.prevResult')}>▲</button>
                                                <button onClick={handleNextMatch} className="p-1 hover:text-[var(--text-primary)]" title={t('help.nextResult')} aria-label={t('help.nextResult')}>▼</button>
                                            </>
                                        ) : (
                                            <span className="px-1">{t('help.notFound')}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" title={t('settings.appearance.interface')}>
                        <span 
                            className="text-xs cursor-pointer hover:text-[var(--text-primary)]" 
                            title={t('help.zoomOut')}
                            onClick={() => setFontSize(prev => Math.max(MIN_FONT_SIZE, prev - FONT_STEP))}
                        >А</span>
                        <input
                            id="zoom-slider"
                            type="range"
                            min={MIN_FONT_SIZE}
                            max={MAX_FONT_SIZE}
                            step="0.01"
                            value={fontSize}
                            onChange={e => setFontSize(parseFloat(e.target.value))}
                            className="w-20 h-1 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)]"
                            title={t('settings.appearance.interface')}
                        />
                        <span 
                            className="text-lg cursor-pointer hover:text-[var(--text-primary)]" 
                            title={t('help.zoomIn')}
                            onClick={() => setFontSize(prev => Math.min(MAX_FONT_SIZE, prev + FONT_STEP))}
                        >А</span>
                        <button 
                            onClick={() => setFontSize(BASE_FONT_SIZE)}
                            className="w-12 text-center text-xs font-mono hover:text-[var(--text-primary)] transition-colors"
                            title={t('help.resetZoom')}
                        >
                            {Math.round((fontSize / BASE_FONT_SIZE) * 100)}%
                        </button>
                    </div>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label={t('help.close')}>
                        <XIcon />
                    </button>
                </header>

                <div className="flex flex-grow min-h-0">
                    {/* Navigation Sidebar */}
                    <nav className="w-64 flex-shrink-0 border-r border-[var(--border-secondary)] p-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {sections.map(section => (
                                <li key={section.id}>
                                    <a 
                                        href={`#${section.id}`} 
                                        onClick={(e) => handleNavClick(e, section.id)}
                                        className="block p-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <div 
                        ref={contentRef} 
                        className="flex-grow p-6 text-[var(--text-secondary)] overflow-y-auto scroll-smooth allow-selection"
                        style={{ fontSize: `${fontSize}rem` }}
                    >
                        { language === 'en' ? <HelpContentEN SectionTitle={SectionTitle} SubTitle={SubTitle} Para={Para} Key={Key} ListItem={ListItem} /> : <HelpContentUK SectionTitle={SectionTitle} SubTitle={SubTitle} Para={Para} Key={Key} ListItem={ListItem} /> }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;
