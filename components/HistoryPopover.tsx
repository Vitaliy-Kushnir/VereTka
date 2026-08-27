import React, { useMemo, useEffect, useRef } from 'react';
import { 
    HistoryIcon, 
    UndoIcon, 
    RedoIcon, 
    HomeIcon,
    TrashIcon,
    PaletteIcon,
    LayersIcon,
    GroupIcon,
    UngroupIcon,
    SparklesIcon,
    RectangleIcon,
    CircleIcon,
    EditPointsIcon,
    DistributePathIcon,
    RefreshCwIcon
} from './icons';
import { useLanguage } from './LanguageContext';
import { HistoryEntry } from '../hooks/useHistoryState';
import { formatHistoryEntries, FormattedHistoryStep, AppHistoryState } from '../lib/historyUtils';

interface HistoryPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    historyEntries: HistoryEntry<AppHistoryState>[];
    currentIndex: number;
    onJumpToIndex: (index: number) => void;
    initialMode?: 'undo' | 'redo' | 'all';
    anchorRect?: DOMRect | null;
}

export const HistoryPopover: React.FC<HistoryPopoverProps> = ({
    isOpen,
    onClose,
    historyEntries,
    currentIndex,
    onJumpToIndex,
    initialMode = 'all',
    anchorRect
}) => {
    const { t } = useLanguage();
    const [filterMode, setFilterMode] = React.useState<'all' | 'undo' | 'redo'>(initialMode);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);
    const currentItemRef = useRef<HTMLButtonElement>(null);

    // Sync filter mode if initialMode changes
    useEffect(() => {
        if (isOpen) {
            setFilterMode(initialMode);
        }
    }, [isOpen, initialMode]);

    // Format all steps
    const formattedSteps: FormattedHistoryStep[] = useMemo(() => {
        return formatHistoryEntries(historyEntries, currentIndex, t);
    }, [historyEntries, currentIndex, t]);

    // Filter steps based on active tab
    const displayedSteps = useMemo(() => {
        if (filterMode === 'undo') {
            return formattedSteps.filter(s => s.index <= currentIndex);
        }
        if (filterMode === 'redo') {
            return formattedSteps.filter(s => s.index >= currentIndex);
        }
        return formattedSteps;
    }, [formattedSteps, filterMode, currentIndex]);

    // Undo / Redo counts
    const undoCount = currentIndex;
    const redoCount = Math.max(0, historyEntries.length - 1 - currentIndex);

    // Scroll to current step when opened
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (currentItemRef.current) {
                    currentItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen, filterMode]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const renderActionIcon = (actionType: FormattedHistoryStep['actionType']) => {
        switch (actionType) {
            case 'init':
                return <HomeIcon size={16} className="text-emerald-400" />;
            case 'add':
                return <RectangleIcon size={16} className="text-blue-400" />;
            case 'delete':
                return <TrashIcon size={16} className="text-rose-400" />;
            case 'style':
                return <PaletteIcon size={16} className="text-amber-400" />;
            case 'group':
                return <GroupIcon size={16} className="text-indigo-400" />;
            case 'ungroup':
                return <UngroupIcon size={16} className="text-purple-400" />;
            case 'layer':
                return <LayersIcon size={16} className="text-cyan-400" />;
            case 'distribute':
                return <DistributePathIcon size={16} className="text-teal-400" />;
            case 'transform':
            case 'move':
            case 'edit':
            default:
                return <EditPointsIcon size={16} className="text-amber-400" />;
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-start justify-center sm:items-start p-2 sm:p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[640px] mt-10 sm:mt-14 z-[210] animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/70 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/25 shrink-0">
                            <HistoryIcon size={18} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold text-[var(--text-primary)] leading-tight truncate">
                                {t('history.title') || 'Історія змін'}
                            </h2>
                            <p className="text-[11px] text-[var(--text-secondary)] leading-tight truncate">
                                {initialMode === 'undo' 
                                    ? (t('history.selectUndo') || 'Оберіть дію, до якої скасувати стан')
                                    : initialMode === 'redo'
                                        ? (t('history.selectRedo') || 'Оберіть дію, до якої відновити стан')
                                        : (t('history.fullTimeline') || 'Швидкий перехід по всіх діях')}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-xs font-semibold px-2.5"
                    >
                        ✕
                    </button>
                </div>

                {/* Filter Tabs & Quick Jump */}
                <div className="px-3 py-2 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 flex items-center justify-between gap-1 text-xs shrink-0 flex-wrap">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-[var(--bg-primary)] p-0.5 rounded-lg border border-[var(--border-secondary)]">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                                filterMode === 'all'
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {t('history.filterAll') || 'Всі'} ({historyEntries.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('undo')}
                            disabled={undoCount === 0}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-40 ${
                                filterMode === 'undo'
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <UndoIcon size={12} />
                            <span>{t('history.filterUndo') || 'Назад'} ({undoCount})</span>
                        </button>
                        <button
                            onClick={() => setFilterMode('redo')}
                            disabled={redoCount === 0}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-40 ${
                                filterMode === 'redo'
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] font-semibold shadow-xs'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <RedoIcon size={12} />
                            <span>{t('history.filterRedo') || 'Вперед'} ({redoCount})</span>
                        </button>
                    </div>

                    {/* Quick Jump endpoints */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                onJumpToIndex(0);
                                onClose();
                            }}
                            disabled={currentIndex === 0}
                            title={t('history.jumpToStart') || 'Повернутися на самий початок'}
                            className="px-2 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-35 transition-all text-[11px] font-medium"
                        >
                            ⏮ {t('history.start') || 'Початок'}
                        </button>
                        <button
                            onClick={() => {
                                onJumpToIndex(historyEntries.length - 1);
                                onClose();
                            }}
                            disabled={currentIndex === historyEntries.length - 1}
                            title={t('history.jumpToLatest') || 'Перейти до найновішого стану'}
                            className="px-2 py-1 rounded-md bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-35 transition-all text-[11px] font-medium"
                        >
                            ⏭ {t('history.latest') || 'Останній'}
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div 
                    ref={listContainerRef}
                    className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-[var(--border-secondary)]"
                >
                    {displayedSteps.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[var(--text-secondary)] flex flex-col items-center gap-2">
                            <HistoryIcon size={28} className="opacity-40" />
                            <span>{t('history.empty') || 'Немає записів у вибраному фільтрі'}</span>
                        </div>
                    ) : (
                        displayedSteps.map((step) => {
                            const isCurrent = step.isCurrent;
                            const isUndoTarget = hoveredIndex !== null && hoveredIndex < currentIndex && step.index >= hoveredIndex && step.index < currentIndex;
                            const isRedoTarget = hoveredIndex !== null && hoveredIndex > currentIndex && step.index <= hoveredIndex && step.index > currentIndex;

                            return (
                                <button
                                    key={step.id || step.index}
                                    ref={isCurrent ? currentItemRef : null}
                                    onClick={() => {
                                        onJumpToIndex(step.index);
                                        onClose();
                                    }}
                                    onMouseEnter={() => setHoveredIndex(step.index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 group relative ${
                                        isCurrent
                                            ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)] text-[var(--text-primary)] ring-1 ring-[var(--accent-primary)]/30 font-semibold shadow-xs'
                                            : isUndoTarget
                                                ? 'bg-rose-500/10 border-rose-500/30 text-[var(--text-primary)]'
                                                : isRedoTarget
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-[var(--text-primary)]'
                                                    : 'bg-[var(--bg-secondary)]/40 hover:bg-[var(--bg-secondary)] border-transparent hover:border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {/* Left: Step number, icon, and title */}
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                            isCurrent
                                                ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]'
                                                : 'bg-[var(--bg-primary)] border border-[var(--border-secondary)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                                        }`}>
                                            {step.index + 1}
                                        </div>

                                        <div className="p-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-secondary)]/50 shrink-0">
                                            {renderActionIcon(step.actionType)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                                                    {step.title}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[var(--accent-primary)] text-[var(--accent-text)] font-bold tracking-tight shrink-0">
                                                        {t('history.current') || 'Поточний'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] mt-0.5">
                                                <span>{step.formattedTime}</span>
                                                <span>•</span>
                                                <span>{step.shapesCount} {t('history.shapesCount') || 'фігур'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Offset badge */}
                                    <div className="shrink-0 text-right">
                                        {step.stepOffset === 0 ? (
                                            <span className="text-[11px] text-[var(--accent-primary)] font-bold">
                                                ●
                                            </span>
                                        ) : step.stepOffset < 0 ? (
                                            <span className="text-[10px] text-rose-400 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 group-hover:bg-rose-500/20">
                                                {step.stepOffset}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20 group-hover:bg-emerald-500/20">
                                                +{step.stepOffset}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer status summary */}
                <div className="px-4 py-2 border-t border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50 text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                    <span>
                        {t('history.step') || 'Крок'} {currentIndex + 1} {t('history.of') || 'з'} {historyEntries.length}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                        {t('history.longPressTip') || 'Довгий клік по стрілках для виклику'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HistoryPopover;
