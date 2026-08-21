import React from 'react';
import { 
    MenuIcon, 
    UndoIcon, 
    RedoIcon, 
    PreviewIcon, 
    CloudGalleryIcon 
} from '../icons';
import { useLanguage } from '../LanguageContext';
import { useIsLandscape } from '../../hooks/useIsMobile';

interface MobileTopHeaderProps {
    projectName: string;
    isProjectActive: boolean;
    onOpenMenu: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
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
    onOpenPreview,
    onOpenCloudGallery,
    isLandscape: isLandscapeProp
}) => {
    const { t } = useLanguage();
    const isLandscapeDetected = useIsLandscape();
    const isLandscape = isLandscapeProp !== undefined ? isLandscapeProp : isLandscapeDetected;

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
                    {isProjectActive && (
                        <>
                            <span className="text-[var(--text-tertiary)] text-xs shrink-0 select-none">/</span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium truncate max-w-[140px] sm:max-w-[200px]" title={projectName}>
                                {projectName}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Quick actions (Undo, Redo, Preview, Cloud) */}
            <div className="flex items-center gap-1 shrink-0">
                {isProjectActive && (
                    <>
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            title={`${t('menu.edit.undo')} (Ctrl+Z)`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            aria-label={t('menu.edit.undo')}
                        >
                            <UndoIcon size={17} />
                        </button>
                        <button
                            onClick={onRedo}
                            disabled={!canRedo}
                            title={`${t('menu.edit.redo')} (Ctrl+Y)`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            aria-label={t('menu.edit.redo')}
                        >
                            <RedoIcon size={17} />
                        </button>

                        <div className="w-px h-4 bg-[var(--border-secondary)] mx-0.5 shrink-0" />

                        <button
                            onClick={onOpenPreview}
                            title={t('mobile.header.runSimulation') || 'Запустити симуляцію Tkinter'}
                            className="px-2 py-1 rounded-lg text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1 font-semibold text-xs shrink-0"
                        >
                            <PreviewIcon size={15} />
                            <span className="text-[11px]">{t('mobile.header.test') || 'Тест'}</span>
                        </button>
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
