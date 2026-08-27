import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { 
    X, 
    Search, 
    List, 
    Type, 
    ArrowUp, 
    ChevronLeft, 
    ChevronRight, 
    ChevronDown, 
    ChevronUp,
    BookOpen,
    Sparkles,
    Check
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { HelpContentUK } from './help/HelpContentUK';
import { HelpContentEN } from './help/HelpContentEN';
import { HelpContentIT } from './help/HelpContentIT';
import { HelpContentES } from './help/HelpContentES';
import { HelpContentDE } from './help/HelpContentDE';
import { HelpContentFR } from './help/HelpContentFR';

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
    const { t, language } = useLanguage();

    const contentRef = useRef<HTMLDivElement>(null);
    const chipsContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);
    
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // Font size controls
    const BASE_FONT_SIZE = 0.92; // ~14.7px base
    const MIN_FONT_SIZE = 0.72; // ~78%
    const MAX_FONT_SIZE = 1.60; // ~174%
    const FONT_STEP = 0.08;

    const [fontSize, setFontSize] = useState(BASE_FONT_SIZE);
    const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
    const [isTOCSheetOpen, setIsTOCSheetOpen] = useState(false);
    const [isSearchExpandedMobile, setIsSearchExpandedMobile] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState('intro');

    const sections = useMemo(() => [
        { id: 'intro', num: '1', title: t('help.intro') || '1. Вступ' },
        { id: 'interface', num: '2', title: t('help.interface') || '2. Огляд інтерфейсу' },
        { id: 'projects', num: '3', title: t('help.projects') || '3. Робота з проєктами' },
        { id: 'templates', num: '4', title: t('help.templates') || '4. Робота з шаблонами' },
        { id: 'shapes', num: '5', title: t('help.shapes') || '5. Робота з об’єктами' },
        { id: 'touch-mobile', num: '6', title: t('help.touchMobile') || '6. Сенсорні екрани, лупа та джойстик' },
        { id: 'code-export', num: '7', title: t('help.codeExport') || '7. Код та експорт' },
        { id: 'cloud-storage', num: '8', title: t('help.cloudStorage') || '8. Хмарне сховище і галерея' },
        { id: 'feedback', num: '9', title: t('help.feedback') || '9. Зворотний зв’язок' },
        { id: 'hotkeys', num: '10', title: t('help.hotkeys') || '10. Гарячі клавіші' },
    ], [t]);

    const activeSectionIndex = useMemo(() => {
        const idx = sections.findIndex(s => s.id === activeSectionId);
        return idx >= 0 ? idx : 0;
    }, [sections, activeSectionId]);

    // Handle smooth scrolling to section
    const scrollToSection = useCallback((targetId: string) => {
        if (!contentRef.current) return;
        const targetElement = contentRef.current.querySelector(`#${targetId}`);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            setActiveSectionId(targetId);
            setIsTOCSheetOpen(false);
        }
    }, []);

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        scrollToSection(targetId);
    };

    // Scroll spy to update active section while reading
    const handleContentScroll = useCallback(() => {
        if (!contentRef.current) return;
        const scrollTop = contentRef.current.scrollTop;
        setShowScrollTop(scrollTop > 220);

        // Find which section header is currently nearest the top of content container
        const sectionHeadings = sections.map(s => {
            const el = contentRef.current?.querySelector(`#${s.id}`);
            if (!el) return { id: s.id, top: Infinity };
            const rect = el.getBoundingClientRect();
            const containerRect = contentRef.current!.getBoundingClientRect();
            return { id: s.id, top: rect.top - containerRect.top };
        });

        const active = sectionHeadings.reduce((closest, curr) => {
            if (curr.top <= 120 && curr.top > closest.top) {
                return curr;
            }
            return closest;
        }, { id: sections[0].id, top: -Infinity });

        if (active && active.id) {
            setActiveSectionId(active.id);
        }
    }, [sections]);

    // Auto-scroll horizontal chips to keep active section in view
    useEffect(() => {
        if (!chipsContainerRef.current) return;
        const activeChip = chipsContainerRef.current.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        if (activeChip) {
            const container = chipsContainerRef.current;
            const scrollLeftTarget = activeChip.offsetLeft - (container.clientWidth / 2) + (activeChip.clientWidth / 2);
            container.scrollTo({ left: Math.max(0, scrollLeftTarget), behavior: 'smooth' });
        }
    }, [activeSectionId]);

    // Search match count calculation
    useEffect(() => {
        if (!isOpen || !contentRef.current) return;
        
        const term = (debouncedSearchTerm || '').trim();
        if (!term) {
            setMatchCount(0);
            setCurrentMatchIndex(-1);
            return;
        }

        const allMarks = contentRef.current.querySelectorAll<HTMLElement>('mark');
        setMatchCount(allMarks.length);
        setCurrentMatchIndex(allMarks.length > 0 ? 0 : -1);
    }, [debouncedSearchTerm, isOpen]);

    // Apply active highlight and scroll to search match
    useEffect(() => {
        if (!isOpen || !contentRef.current || currentMatchIndex === -1) return;

        const allMarks = Array.from(contentRef.current.querySelectorAll<HTMLElement>('mark'));
        if (allMarks.length === 0) return;

        allMarks.forEach((match: HTMLElement, index) => {
            if (index === currentMatchIndex) {
                match.classList.add('bg-orange-500', 'text-white', 'scale-105', 'shadow-xs');
                match.classList.remove('bg-yellow-400/80', 'text-black');
                match.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            } else {
                match.classList.remove('bg-orange-500', 'text-white', 'scale-105', 'shadow-xs');
                match.classList.add('bg-yellow-400/80', 'text-black');
            }
        });
    }, [currentMatchIndex, debouncedSearchTerm, isOpen]);

    if (!isOpen) return null;

    const handleNextMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev + 1) % matchCount);
    };

    const handlePrevMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount);
    };

    const handleScrollToTop = () => {
        if (contentRef.current) {
            contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNextSection = () => {
        if (activeSectionIndex < sections.length - 1) {
            scrollToSection(sections[activeSectionIndex + 1].id);
        }
    };

    const handlePrevSection = () => {
        if (activeSectionIndex > 0) {
            scrollToSection(sections[activeSectionIndex - 1].id);
        }
    };

    const applyHighlight = (node: React.ReactNode, term: string): React.ReactNode => {
        if (typeof node === 'string') {
            if (!((term) || "").trim()) {
                return node;
            }
            const parts = node.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
            return parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-400/80 text-black px-1 py-0.5 rounded-sm font-medium transition-all">
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
        <h2 
            id={id} 
            className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] mt-8 first:mt-2 mb-4 pb-2.5 border-b border-[var(--border-secondary)] scroll-mt-28 sm:scroll-mt-12 flex items-center gap-2"
        >
            {applyHighlight(children, debouncedSearchTerm)}
        </h2>
    );

    const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mt-5 mb-2.5 flex items-center gap-1.5">
            {applyHighlight(children, debouncedSearchTerm)}
        </h3>
    );

    const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <p className="mb-3 leading-relaxed text-[var(--text-secondary)]">
            {applyHighlight(children, debouncedSearchTerm)}
        </p>
    );

    const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <code className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-md font-mono text-[0.88em] inline-block shadow-2xs">
            {children}
        </code>
    );

    const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <li className="mb-2 pl-1 leading-relaxed text-[var(--text-secondary)]">
            {applyHighlight(children, debouncedSearchTerm)}
        </li>
    );

    const currentZoomPercent = Math.round((fontSize / BASE_FONT_SIZE) * 100);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-0 sm:p-3 md:p-6 animate-in fade-in duration-150"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-primary)] sm:rounded-2xl shadow-2xl w-full h-full sm:h-[92vh] sm:max-w-5xl flex flex-col overflow-hidden border-0 sm:border border-[var(--border-primary)]"
                onClick={e => e.stopPropagation()}
            >
                {/* 1. TOP HEADER (Mobile & Desktop) */}
                <header className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)] shrink-0 z-20">
                    <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 gap-2">
                        {/* Title & icon */}
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight truncate">
                                    {t('help.title') || 'Довідка та інструкції'}
                                </h2>
                                <p className="text-xs text-[var(--text-tertiary)] truncate hidden sm:block">
                                    {sections[activeSectionIndex]?.title}
                                </p>
                            </div>
                        </div>

                        {/* Desktop Search Bar */}
                        <div className="hidden md:flex flex-grow max-w-md relative mx-3">
                            <input
                                type="text"
                                placeholder={t('help.search') || 'Пошук у довідці...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-24 py-1.5 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)] transition-all"
                            />
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md"
                                        title={t('help.clearSearch') || 'Очистити'}
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                                {((debouncedSearchTerm) || "").trim() && (
                                    <div className="flex items-center text-xs font-mono bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] border border-[var(--border-secondary)]">
                                        {matchCount > 0 ? (
                                            <>
                                                <span>{currentMatchIndex + 1}/{matchCount}</span>
                                                <button onClick={handlePrevMatch} className="p-0.5 hover:text-[var(--text-primary)] ml-1" title={t('help.prevResult')}>▲</button>
                                                <button onClick={handleNextMatch} className="p-0.5 hover:text-[var(--text-primary)]" title={t('help.nextResult')}>▼</button>
                                            </>
                                        ) : (
                                            <span className="text-[var(--text-disabled)]">{t('help.notFound') || '0'}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Action Controls */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {/* Mobile Table of Contents button */}
                            <button
                                onClick={() => setIsTOCSheetOpen(prev => !prev)}
                                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-medium border border-[var(--border-secondary)] active:scale-95 transition-all"
                                title={t('help.toc') || 'Зміст'}
                                aria-label="Table of Contents"
                            >
                                <List size={16} />
                                <span className="max-w-[80px] truncate">{sections[activeSectionIndex]?.num}. {sections[activeSectionIndex]?.title.split('.')[1] || sections[activeSectionIndex]?.title}</span>
                            </button>

                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => {
                                    setIsSearchExpandedMobile(prev => !prev);
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }}
                                className={`md:hidden p-2 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                                    isSearchExpandedMobile || searchTerm
                                        ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                                title={t('help.search') || 'Пошук'}
                                aria-label="Search"
                            >
                                <Search size={16} />
                            </button>

                            {/* Font Size Toggle Button */}
                            <button
                                onClick={() => setIsFontSizeOpen(prev => !prev)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                                    isFontSizeOpen || currentZoomPercent !== 100
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
                                }`}
                                title={t('help.fontSize') || 'Розмір тексту'}
                                aria-label="Font size"
                            >
                                <Type size={15} />
                                <span className="font-mono">{currentZoomPercent}%</span>
                            </button>

                            {/* Close Button */}
                            <button 
                                onClick={onClose} 
                                className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg active:scale-90 transition-all ml-0.5" 
                                aria-label={t('help.close') || 'Закрити'}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 2. EXPANDABLE MOBILE SEARCH BAR */}
                    {isSearchExpandedMobile && (
                        <div className="md:hidden px-3 py-2 bg-[var(--bg-secondary)]/70 border-t border-[var(--border-secondary)] animate-in slide-in-from-top-1 duration-150">
                            <div className="relative flex items-center">
                                <Search size={16} className="absolute left-3 text-[var(--text-tertiary)]" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('help.search') || 'Введіть слово для пошуку...'}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-24 py-2 text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-lg border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)] shadow-inner"
                                />
                                <div className="absolute right-1.5 flex items-center gap-1">
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md"
                                            title={t('help.clearSearch')}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                    {((debouncedSearchTerm) || "").trim() && (
                                        <div className="flex items-center text-xs font-mono bg-[var(--bg-secondary)] px-1.5 py-1 rounded text-[var(--text-secondary)] border border-[var(--border-secondary)]">
                                            {matchCount > 0 ? (
                                                <>
                                                    <span className="font-semibold">{currentMatchIndex + 1}/{matchCount}</span>
                                                    <button onClick={handlePrevMatch} className="p-1 hover:text-[var(--text-primary)] text-sm ml-0.5" title={t('help.prevResult')}>▲</button>
                                                    <button onClick={handleNextMatch} className="p-1 hover:text-[var(--text-primary)] text-sm" title={t('help.nextResult')}>▼</button>
                                                </>
                                            ) : (
                                                <span className="text-[var(--text-disabled)]">{t('help.notFound') || 'Не знайдено'}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. EXPANDABLE FONT SIZE CONTROL BAR */}
                    {isFontSizeOpen && (
                        <div className="px-3 sm:px-5 py-2.5 bg-[var(--bg-secondary)]/90 border-t border-[var(--border-secondary)] flex flex-wrap items-center justify-between gap-2.5 animate-in slide-in-from-top-1 duration-150">
                            <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                                <Type size={14} />
                                <span>{t('help.fontSize') || 'Розмір шрифту'}:</span>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 flex-grow sm:flex-grow-0 justify-end">
                                <button
                                    onClick={() => setFontSize(prev => Math.max(MIN_FONT_SIZE, prev - FONT_STEP))}
                                    className="px-2.5 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-xs font-bold active:scale-95 transition-all"
                                    title={t('help.zoomOut')}
                                >
                                    A-
                                </button>

                                <input
                                    type="range"
                                    min={MIN_FONT_SIZE}
                                    max={MAX_FONT_SIZE}
                                    step="0.02"
                                    value={fontSize}
                                    onChange={e => setFontSize(parseFloat(e.target.value))}
                                    className="w-28 sm:w-36 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                                />

                                <button
                                    onClick={() => setFontSize(prev => Math.min(MAX_FONT_SIZE, prev + FONT_STEP))}
                                    className="px-2.5 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-sm font-bold active:scale-95 transition-all"
                                    title={t('help.zoomIn')}
                                >
                                    A+
                                </button>

                                {/* Quick Presets */}
                                <div className="flex items-center gap-1 border-l border-[var(--border-secondary)] pl-2">
                                    {[
                                        { label: '85%', val: BASE_FONT_SIZE * 0.85 },
                                        { label: '100%', val: BASE_FONT_SIZE },
                                        { label: '125%', val: BASE_FONT_SIZE * 1.25 },
                                    ].map(p => (
                                        <button
                                            key={p.label}
                                            onClick={() => setFontSize(p.val)}
                                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono border transition-all ${
                                                Math.abs(fontSize - p.val) < 0.03
                                                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
                                            }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. MOBILE HORIZONTAL CHAPTER CHIPS (Swipeable) */}
                    <div 
                        ref={chipsContainerRef}
                        className="md:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-[var(--border-secondary)]/60 bg-[var(--bg-secondary)]/40 scroll-smooth"
                    >
                        {sections.map(section => {
                            const isActive = activeSectionId === section.id;
                            return (
                                <button
                                    key={section.id}
                                    data-section-id={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all active:scale-95 ${
                                        isActive
                                            ? 'bg-[var(--accent-primary)] text-white shadow-xs font-semibold'
                                            : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-secondary)] hover:bg-[var(--bg-hover)]'
                                    }`}
                                >
                                    {section.title}
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* 5. MAIN CONTENT AREA + SIDEBAR */}
                <div className="flex flex-grow min-h-0 relative">
                    {/* Desktop Navigation Sidebar */}
                    <nav className="hidden md:flex w-64 flex-col flex-shrink-0 border-r border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 p-3.5 overflow-y-auto">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] px-2.5 mb-2">
                            {t('help.sections') || 'Розділи довідки'}
                        </div>
                        <ul className="space-y-1">
                            {sections.map(section => {
                                const isActive = activeSectionId === section.id;
                                return (
                                    <li key={section.id}>
                                        <a 
                                            href={`#${section.id}`} 
                                            onClick={(e) => handleNavClick(e, section.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                                                isActive
                                                    ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-xs'
                                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                                            }`}
                                        >
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                                            }`}>
                                                {section.num}
                                            </span>
                                            <span className="truncate">{section.title.replace(/^\d+\.\s*/, '')}</span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Scrollable Reader Content */}
                    <div 
                        ref={contentRef} 
                        onScroll={handleContentScroll}
                        className="flex-grow p-4 sm:p-6 md:p-8 text-[var(--text-secondary)] overflow-y-auto scroll-smooth allow-selection relative"
                        style={{ fontSize: `${fontSize}rem`, lineHeight: 1.68 }}
                    >
                        <div className="max-w-3xl mx-auto pb-16">
                            {(() => {
                                const helpProps = { SectionTitle, SubTitle, Para, Key, ListItem };
                                switch (language) {
                                    case 'en':
                                        return <HelpContentEN {...helpProps} />;
                                    case 'es':
                                        return <HelpContentES {...helpProps} />;
                                    case 'it':
                                        return <HelpContentIT {...helpProps} />;
                                    case 'de':
                                        return <HelpContentDE {...helpProps} />;
                                    case 'fr':
                                        return <HelpContentFR {...helpProps} />;
                                    default:
                                        return <HelpContentUK {...helpProps} />;
                                }
                            })()}
                        </div>
                    </div>

                    {/* 6. FLOATING ACTIONS (Scroll to Top & Chapter Navigator) */}
                    {showScrollTop && (
                        <button
                            onClick={handleScrollToTop}
                            className="absolute right-4 bottom-14 md:bottom-6 p-3 rounded-full bg-[var(--accent-primary)] text-white shadow-lg hover:scale-105 active:scale-95 transition-all z-30"
                            title={t('help.scrollToTop') || 'Вгору'}
                            aria-label="Scroll to top"
                        >
                            <ArrowUp size={18} />
                        </button>
                    )}
                </div>

                {/* 7. BOTTOM MOBILE NAVIGATION FOOTER */}
                <footer className="md:hidden bg-[var(--bg-primary)] border-t border-[var(--border-primary)] px-3 py-2 flex items-center justify-between shrink-0 z-20">
                    <button
                        onClick={handlePrevSection}
                        disabled={activeSectionIndex === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:pointer-events-none active:scale-95 border border-[var(--border-secondary)] transition-all"
                    >
                        <ChevronLeft size={16} />
                        <span>{t('help.prevSection') || 'Назад'}</span>
                    </button>

                    <div className="text-xs font-mono text-[var(--text-tertiary)]">
                        {activeSectionIndex + 1} / {sections.length}
                    </div>

                    <button
                        onClick={handleNextSection}
                        disabled={activeSectionIndex === sections.length - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 disabled:opacity-30 disabled:pointer-events-none active:scale-95 border border-[var(--accent-primary)]/30 transition-all font-semibold"
                    >
                        <span>{t('help.nextSection') || 'Вперед'}</span>
                        <ChevronRight size={16} />
                    </button>
                </footer>

                {/* 8. MOBILE TABLE OF CONTENTS (Bottom Sheet Modal) */}
                {isTOCSheetOpen && (
                    <div 
                        className="md:hidden fixed inset-0 bg-black/60 z-50 flex flex-col justify-end animate-in fade-in duration-150"
                        onClick={() => setIsTOCSheetOpen(false)}
                    >
                        <div 
                            className="bg-[var(--bg-primary)] rounded-t-2xl max-h-[80vh] flex flex-col border-t border-[var(--border-primary)] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <List size={18} className="text-[var(--accent-primary)]" />
                                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                                        {t('help.toc') || 'Зміст довідника'}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setIsTOCSheetOpen(false)}
                                    className="p-1.5 rounded-full text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-3 overflow-y-auto space-y-1.5">
                                {sections.map(section => {
                                    const isActive = activeSectionId === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-all active:scale-98 ${
                                                isActive
                                                    ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-xs'
                                                    : 'bg-[var(--bg-secondary)]/50 text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                                                }`}>
                                                    {section.num}
                                                </span>
                                                <span>{section.title.replace(/^\d+\.\s*/, '')}</span>
                                            </div>
                                            {isActive && <Check size={16} className="shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpModal;
