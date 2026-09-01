import React from 'react';
import { 
    MenuIcon, 
    UndoIcon, 
    RedoIcon, 
    CloudGalleryIcon 
} from '../icons';
import { useLanguage } from '../LanguageContext';
import { useIsLandscape } from '../../hooks/useIsMobile';
import { BetaBadge } from '../BetaBadge';
import { useLongPress } from '../../hooks/useLongPress';

interface MobileTopHeaderProps {
    projectName: string;
    isProjectActive: boolean;
    onOpenMenu: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onOpenHistory?: (mode: 'undo' | 'redo' | 'all') => void;
    onOpenPreview: () => void;
    onOpenCloudGallery: () => void;
    onFitToView?: () => void;
    isLandscape?: boolean;
}

export const MobileTopHeader: React.FC<MobileTopHeaderProps> = ({
    projectName,
    isProjectActive,
    onOpenMenu,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onOpenHistory,
    onOpenPreview,
    onOpenCloudGallery,
    isLandscape: isLandscapeProp
}) => {
    const { t } = useLanguage();
    const isLandscapeDetected = useIsLandscape();
    const isLandscape = isLandscapeProp !== undefined ? isLandscapeProp : isLandscapeDetected;

    const undoPress = useLongPress({
        threshold: 400,
        onLongPress: () => onOpenHistory?.('undo'),
        onClick: () => onUndo(),
        disabled: !canUndo
    });

    const redoPress = useLongPress({
        threshold: 400,
        onLongPress: () => onOpenHistory?.('redo'),
        onClick: () => onRedo(),
        disabled: !canRedo
    });

    return (
        <header 
            className="h-12 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center justify-between px-2.5 shrink-0 z-30 select-none shadow-xs transition-[padding] duration-150"
            style={{
                paddingLeft: 'max(10px, env(safe-area-inset-left, 0px))',
                paddingRight: 'max(10px, env(safe-area-inset-right, 0px))'
            }}
        >
            {/* Left: Menu & Brand */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                <button
                    onClick={onOpenMenu}
                    title={t('mobile.header.openMenu') || 'Меню'}
                    className="p-2 -ml-1 rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-transform shrink-0"
                    aria-label={t('mobile.header.openMenu') || 'Відкрити меню'}
                >
                    <MenuIcon size={21} />
                </button>

                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                    <span className="font-extrabold text-xs tracking-tight text-[var(--brand-header-text)] shrink-0">
                        ВереTkа
                    </span>
                    <BetaBadge size="sm" compact className="shrink-0" />
                    {isProjectActive && (
                        <>
                            <span className="text-[var(--text-tertiary)] text-xs shrink-0 select-none">/</span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[110px] sm:max-w-[180px]" title={projectName}>
                                {projectName}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Quick actions (Undo, Redo, Cloud) */}
            <div className="flex items-center gap-1 shrink-0">
                {isProjectActive && (
                    <>
                        <button
                            {...undoPress}
                            disabled={!canUndo}
                            title={`${t('menu.edit.undo')} (Ctrl+Z)`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            aria-label={t('menu.edit.undo')}
                        >
                            <UndoIcon size={17} />
                        </button>
                        <button
                            {...redoPress}
                            disabled={!canRedo}
                            title={`${t('menu.edit.redo')} (Ctrl+Y)`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            aria-label={t('menu.edit.redo')}
                        >
                            <RedoIcon size={17} />
                        </button>

                        <div className="w-px h-4 bg-[var(--border-secondary)] mx-0.5 shrink-0" />
                    </>
                )}

                <button
                    onClick={onOpenCloudGallery}
                    title={t('welcome.action.cloud') || 'Хмарна галерея'}
                    className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 active:scale-95 transition-all shrink-0"
                    aria-label={t('welcome.action.cloud') || 'Хмарна галерея'}
                >
                    <CloudGalleryIcon size={18} />
                </button>
            </div>
        </header>
    );
};

export default MobileTopHeader;
