import React from 'react';
import { 
    GroupIcon, 
    DuplicateIcon, 
    TrashIcon, 
    AlignShapesCenterHIcon, 
    XIcon, 
    CheckSquareIcon,
    SelectIcon
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
    onDeselectAll: () => void;
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
    onDeselectAll,
    isMobile = false
}) => {
    const { t } = useLanguage();

    if (selectedCount <= 0) return null;

    const allSelected = selectedCount >= totalSelectableCount && totalSelectableCount > 0;

    return (
        <div 
            className={`fixed ${isMobile ? 'bottom-20 left-1/2 -translate-x-1/2 max-w-[94vw]' : 'top-16 left-1/2 -translate-x-1/2 max-w-xl'} z-[110] transition-all duration-200 animate-in fade-in slide-in-from-top-2 pointer-events-auto`}
            role="toolbar"
            aria-label="Панель мультивибору"
        >
            <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-[var(--bg-primary)]/95 text-[var(--text-primary)] rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-[var(--border-secondary)] backdrop-blur-md">
                {/* Mode Indicator & Badge */}
                <div className="flex items-center gap-1.5 pr-2 sm:pr-2.5 border-r border-[var(--border-secondary)]">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
                    </span>
                    <span className="text-xs font-bold text-[var(--accent-primary)] whitespace-nowrap">
                        {t('status.selected') || 'Виділено'}: <span className="text-[var(--text-primary)] font-extrabold">{selectedCount}</span>
                    </span>
                </div>

                {/* Select All / Invert button */}
                <button
                    type="button"
                    onClick={onSelectAll}
                    title={allSelected ? (t('button.deselectAll') || 'Зняти виділення з усіх') : (t('button.selectAll') || 'Виділити всі об\'єкти')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                        allSelected 
                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' 
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"
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
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"
                    >
                        <span className="hidden sm:inline">{t('menu.object.ungroup') || 'Розгрупувати'}</span>
                    </button>
                )}

                {/* Align Action */}
                {onOpenAlign && selectedCount > 1 && (
                    <button
                        type="button"
                        onClick={onOpenAlign}
                        title={t('menu.tools.align') || 'Вирівняти'}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"
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
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors"
                >
                    <DuplicateIcon size={14} />
                    <span className="hidden sm:inline">{t('action.duplicate') || 'Дублювати'}</span>
                </button>

                {/* Delete Action */}
                <button
                    type="button"
                    onClick={onDelete}
                    title={t('button.delete') || 'Видалити'}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-semibold transition-colors"
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
                        className="p-1 sm:px-2.5 sm:py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1 transition-colors"
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
