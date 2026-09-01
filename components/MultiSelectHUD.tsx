import React, { useState, useRef, useEffect } from 'react';
import { 
    GroupIcon,
    UngroupIcon,
    FlipHorizontalIcon,
    FlipVerticalIcon, 
    DuplicateIcon, 
    TrashIcon, 
    AlignShapesCenterHIcon, 
    XIcon, 
    CheckSquareIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from './icons';
import { useLanguage } from './LanguageContext';

interface MultiSelectHUDProps {
    selectedCount: number;
    totalSelectableCount: number;
    canGroup: boolean;
    canUngroup?: boolean;
    onSelectAll: () => void;
    onGroup: () => void;
    onUngroup?: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onOpenAlign?: () => void;
    onStartDistributePath?: () => void;
    onFlipH?: () => void;
    onFlipV?: () => void;
    onDeselectAll: () => void;
    onCollapse?: () => void;
    isMobile?: boolean;
}

export const MultiSelectHUD: React.FC<MultiSelectHUDProps> = ({
    selectedCount,
    totalSelectableCount,
    canGroup,
    canUngroup = false,
    onSelectAll,
    onGroup,
    onUngroup,
    onDuplicate,
    onDelete,
    onOpenAlign,
    onStartDistributePath,
    onFlipH,
    onFlipV,
    onDeselectAll,
    onCollapse,
    isMobile = false
}) => {
    const { t } = useLanguage();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            // If horizontal scroll is present or vertical scroll should map to horizontal
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                container.scrollLeft += e.deltaY;
                e.preventDefault();
            } else if (e.deltaX !== 0) {
                container.scrollLeft += e.deltaX;
                e.preventDefault();
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    if (selectedCount <= 0) return null;

    const allSelected = selectedCount >= totalSelectableCount && totalSelectableCount > 0;

    return (
        <div 
            className="w-full bg-[var(--bg-secondary)] border-t border-[var(--border-secondary)] z-[100] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 pointer-events-auto"
            role="toolbar"
            aria-label={t('hud.selectionPanel') || 'Панель вибору'}
            onWheel={(e) => e.stopPropagation()}
        >
            <div 
                ref={scrollContainerRef}
                className="flex items-center px-2 py-2 overflow-x-auto hide-scrollbar gap-1 sm:gap-2 w-full select-none"
            >
                {/* Mode Indicator & Badge (Click to collapse) */}
                <div className="flex items-center pr-2 sm:pr-2.5 border-r border-[var(--border-secondary)] shrink-0">
                    <button
                        type="button"
                        onClick={onCollapse}
                        title={t('button.collapse') || 'Згорнути панель'}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-bold text-xs shadow-xs transition-all cursor-pointer group"
                    >
                        <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="font-black text-[var(--text-primary)] whitespace-nowrap tracking-wider">
                            {selectedCount}/{totalSelectableCount}
                        </span>
                        <ChevronDownIcon size={13} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors opacity-70 group-hover:opacity-100" />
                    </button>
                </div>

                {/* Select All / Invert button */}
                <button
                    type="button"
                    onClick={onSelectAll}
                    title={allSelected ? (t('button.deselectAll') || 'Зняти виділення з усіх') : (t('button.selectAll') || 'Виділити всі об\'єкти')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                        allSelected 
                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)]' 
                            : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-secondary)]'
                    }`}
                >
                    <CheckSquareIcon size={14} />
                    <span className="hidden sm:inline">{allSelected ? (t('button.all') || 'Всі') : (t('button.selectAll') || 'Всі')}</span>
                </button>

                {/* Group Action */}
                {canGroup && (
                    <button
                        type="button"
                        onClick={onGroup}
                        title={t('menu.object.group') || 'Згрупувати'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <GroupIcon size={15} />
                        <span className="hidden sm:inline">{t('menu.object.group') || 'Згрупувати'}</span>
                    </button>
                )}

                {/* Ungroup Action */}
                {canUngroup && onUngroup && (
                    <button
                        type="button"
                        onClick={onUngroup}
                        title={t('menu.object.ungroup') || 'Розгрупувати'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <UngroupIcon size={15} />
                        <span className="hidden sm:inline">{t('menu.object.ungroup') || 'Розгрупувати'}</span>
                    </button>
                )}

                {/* Flip Actions */}
                {onFlipH && (
                    <button
                        type="button"
                        onClick={onFlipH}
                        title={t('menu.object.flipHorizontal') || 'Віддзеркалити по горизонталі'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <FlipHorizontalIcon size={16} />
                    </button>
                )}
                {onFlipV && (
                    <button
                        type="button"
                        onClick={onFlipV}
                        title={t('menu.object.flipVertical') || 'Віддзеркалити по вертикалі'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <FlipVerticalIcon size={16} />
                    </button>
                )}

                {/* Align Action */}
                {onOpenAlign && selectedCount > 1 && (
                    <button
                        type="button"
                        onClick={onOpenAlign}
                        title={t('menu.tools.align') || 'Вирівняти'}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                    >
                        <AlignShapesCenterHIcon size={15} />
                        <span className="hidden sm:inline">{t('menu.tools.align') || 'Вирівняти'}</span>
                    </button>
                )}

                {/* Duplicate Action */}
                <button
                    type="button"
                    onClick={onDuplicate}
                    title={t('action.duplicate') || 'Дублювати'}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-secondary)] transition-colors shrink-0"
                >
                    <DuplicateIcon size={14} />
                    <span className="hidden sm:inline">{t('action.duplicate') || 'Дублювати'}</span>
                </button>

                {/* Delete Action */}
                <button
                    type="button"
                    onClick={onDelete}
                    title={t('button.delete') || 'Видалити'}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-semibold transition-colors shrink-0"
                >
                    <TrashIcon size={14} />
                    <span className="hidden sm:inline">{t('button.delete') || 'Видалити'}</span>
                </button>

                {/* Done / Deselect All Button */}
                <div className="pl-1 border-l border-[var(--border-secondary)]">
                    <button
                        type="button"
                        onClick={onDeselectAll}
                        title={t('button.done') || 'Завершити вибір'}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                    >
                        <XIcon size={15} />
                        <span className="hidden sm:inline">{t('button.done') || 'Готово'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiSelectHUD;
