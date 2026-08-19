import React from 'react';
import { 
    XIcon, 
    HomeIcon, 
    NewFileIcon, 
    SaveIcon, 
    OpenFileIcon, 
    CloudGalleryIcon, 
    ImageIcon, 
    FitToScreenIcon, 
    FullscreenIcon, 
    ExitFullscreenIcon, 
    GridIcon, 
    AxesIcon, 
    SunIcon, 
    MoonIcon, 
    SettingsIcon, 
    CodeIcon, 
    PreviewIcon, 
    LightbulbIcon, 
    BugIcon, 
    MessageSquareIcon, 
    ShareLinkIcon, 
    TrashIcon, 
    PlayIcon,
    KeyIcon,
    AlignShapesCenterHIcon,
    VeretkaLogoIcon
} from '../icons';
import { useLanguage } from '../LanguageContext';
import { BetaBadge } from '../BetaBadge';

export type Theme = 'dark' | 'light';

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    isProjectActive: boolean;
    onGoHome: () => void;
    onNewProject: () => void;
    onSaveProject: () => void;
    canSave: boolean;
    onSaveProjectAs: () => void;
    onSaveAsTemplate: () => void;
    onLoadProject: () => void;
    onOpenCloudGallery: (tab?: 'public' | 'personal' | 'group' | 'publish') => void;
    onImportImage: () => void;
    onExport: () => void;
    onShareLink?: () => void;
    showShareLink?: boolean;
    onClearCanvas: () => void;
    onFitCanvasToView: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    showGrid: boolean;
    setShowGrid: (show: boolean) => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    showAxes: boolean;
    setShowAxes: (show: boolean) => void;
    showCenterGuides: boolean;
    setShowCenterGuides: (show: boolean) => void;
    enableSnapping: boolean;
    setEnableSnapping: (show: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    onOpenSettings: () => void;
    onOpenCode: () => void;
    onOpenPreview: () => void;
    onOpenAlign?: () => void;
    onSaveCode: () => void;
    onRunOnline?: () => void;
    onOpenAbout: () => void;
    onOpenHelp: () => void;
    onOpenShortcuts: () => void;
    onOpenFeedback: () => void;
    onOpenCheatCodes?: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
    isOpen,
    onClose,
    projectName,
    isProjectActive,
    onGoHome,
    onNewProject,
    onSaveProject,
    canSave,
    onSaveProjectAs,
    onSaveAsTemplate,
    onLoadProject,
    onOpenCloudGallery,
    onImportImage,
    onExport,
    onShareLink,
    showShareLink,
    onClearCanvas,
    onFitCanvasToView,
    onToggleFullscreen,
    isFullscreen,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    showAxes,
    setShowAxes,
    showCenterGuides,
    setShowCenterGuides,
    enableSnapping,
    setEnableSnapping,
    theme,
    setTheme,
    onOpenSettings,
    onOpenCode,
    onOpenPreview,
    onOpenAlign,
    onSaveCode,
    onRunOnline,
    onOpenAbout,
    onOpenHelp,
    onOpenShortcuts,
    onOpenFeedback,
    onOpenCheatCodes
}) => {
    const { t } = useLanguage();
    const touchStartXRef = React.useRef<number>(0);
    const [dragTranslateX, setDragTranslateX] = React.useState<number>(0);

    if (!isOpen) return null;

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartXRef.current = e.touches[0].clientX;
        setDragTranslateX(0);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - touchStartXRef.current;
        if (deltaX < 0) {
            setDragTranslateX(deltaX);
        }
    };

    const handleTouchEnd = () => {
        if (dragTranslateX < -60) {
            onClose();
        }
        setDragTranslateX(0);
    };

    return (
        <div className="fixed inset-0 z-[110] flex justify-start">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Drawer Container */}
            <div 
                className="relative w-[85vw] max-w-[340px] h-full bg-[var(--bg-app)] text-[var(--text-primary)] shadow-2xl flex flex-col z-10 border-r border-[var(--border-primary)] animate-slide-right overflow-hidden transition-transform duration-75"
                style={{
                    transform: dragTranslateX < 0 ? `translateX(${dragTranslateX}px)` : undefined
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center p-1 shrink-0 shadow-xs">
                            <VeretkaLogoIcon size={22} className="w-full h-full object-contain" />
                        </div>
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                                <h2 className="font-bold text-sm truncate text-[var(--brand-header-text)]">{t('welcome.title')}</h2>
                                <BetaBadge size="sm" />
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                                {isProjectActive ? projectName : t('menu.mainTitle')}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-4 overscroll-contain text-sm">
                    {/* Navigation / Home */}
                    {isProjectActive && (
                        <div>
                            <button
                                onClick={() => handleAction(onGoHome)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] font-medium transition-colors"
                            >
                                <HomeIcon size={18} className="text-[var(--accent-primary)]" />
                                <span>{t('menu.home') || 'Головний екран'}</span>
                            </button>
                        </div>
                    )}

                    {/* Section: File & Project */}
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-1.5">
                            {t('menu.file') || 'Проєкт і Файли'}
                        </div>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleAction(onNewProject)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <NewFileIcon size={18} className="text-emerald-500" />
                                <span>{t('menu.file.new') || 'Новий проєкт'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onSaveProject)}
                                disabled={!canSave}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                            >
                                <SaveIcon size={18} className="text-blue-500" />
                                <span>{t('menu.file.save') || 'Зберегти проєкт'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onSaveProjectAs)}
                                disabled={!isProjectActive}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                            >
                                <SaveIcon size={18} className="text-blue-400" />
                                <span>{t('menu.file.saveAs') || 'Зберегти як...'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onSaveAsTemplate)}
                                disabled={!isProjectActive}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                            >
                                <SaveIcon size={18} className="text-purple-400" />
                                <span>{t('menu.file.saveTemplate') || 'Зберегти як шаблон'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onLoadProject)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <OpenFileIcon size={18} className="text-amber-500" />
                                <span>{t('menu.file.load') || 'Відкрити проєкт (.json)'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(() => onOpenCloudGallery('publish'))}
                                disabled={!isProjectActive}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50 text-indigo-400"
                            >
                                <CloudGalleryIcon size={18} />
                                <span>{t('menu.file.publishCloud') || 'Опублікувати в Хмару'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onImportImage)}
                                disabled={!isProjectActive}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                            >
                                <ImageIcon size={18} className="text-pink-400" />
                                <span>{t('menu.file.importImage') || 'Імпортувати зображення'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onExport)}
                                disabled={!isProjectActive}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                            >
                                <SaveIcon size={18} className="text-cyan-400" />
                                <span>{t('menu.file.export') || 'Експорт (PNG, SVG, JPG)'}</span>
                            </button>
                            {showShareLink && onShareLink && (
                                <button
                                    onClick={() => handleAction(onShareLink)}
                                    disabled={!isProjectActive}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left disabled:opacity-50"
                                >
                                    <ShareLinkIcon size={18} className="text-teal-400" />
                                    <span>{t('menu.file.shareLink') || 'Поділитися посиланням'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section: Cloud Gallery */}
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-1.5">
                            {t('toolbar.cloudGallery') || 'Спільна Хмара'}
                        </div>
                        <button
                            onClick={() => handleAction(() => onOpenCloudGallery('public'))}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/25 font-semibold transition-colors text-left"
                        >
                            <CloudGalleryIcon size={20} />
                            <div>
                                <div className="text-sm">Хмарна Галерея</div>
                                <div className="text-[11px] text-indigo-300/80 font-normal">Публічні проєкти, групи та класи</div>
                            </div>
                        </button>
                    </div>

                    {/* Section: Python Tkinter Code & Simulator */}
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-1.5">
                            {t('menu.export.code') || 'Код Tkinter'}
                        </div>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleAction(onOpenCode)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <CodeIcon size={18} className="text-emerald-400" />
                                <span>Перегляд коду Python</span>
                            </button>
                            <button
                                onClick={() => handleAction(onOpenPreview)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left text-amber-400 font-medium"
                            >
                                <PreviewIcon size={18} />
                                <span>Запуск у симуляторі (Tkinter)</span>
                            </button>
                            <button
                                onClick={() => handleAction(onSaveCode)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <SaveIcon size={18} className="text-blue-400" />
                                <span>Зберегти як .py файл</span>
                            </button>
                            {onRunOnline && (
                                <button
                                    onClick={() => handleAction(onRunOnline)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                                >
                                    <PlayIcon size={18} className="text-green-400" />
                                    <span>Запустити в онлайн-середовищі</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Section: View & Canvas Controls */}
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-1.5">
                            {t('menu.view') || 'Вигляд і Полотно'}
                        </div>
                        <div className="space-y-1">
                            {onOpenAlign && isProjectActive && (
                                <button
                                    onClick={() => handleAction(onOpenAlign)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left text-[var(--accent-primary)] font-medium"
                                >
                                    <AlignShapesCenterHIcon size={18} />
                                    <span>{t('menu.tools.align') || 'Вирівнювання та розподіл'}</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleAction(onFitCanvasToView)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <FitToScreenIcon size={18} />
                                <span>{t('menu.view.fit') || 'Вписати у вікно'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onToggleFullscreen)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                {isFullscreen ? <ExitFullscreenIcon size={18} /> : <FullscreenIcon size={18} />}
                                <span>{isFullscreen ? (t('menu.view.exitFullscreen') || 'Вийти з повного екрана') : (t('menu.view.fullscreen') || 'Повний екран')}</span>
                            </button>
                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <GridIcon size={18} />
                                    <span>{t('menu.view.grid') || 'Сітка'}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${showGrid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                                    {showGrid ? (t('common.on') || 'Увімк') : (t('common.off') || 'Вимк')}
                                </span>
                            </button>
                            <button
                                onClick={() => setSnapToGrid(!snapToGrid)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <GridIcon size={18} />
                                    <span>{t('menu.view.snap') || 'Прилипання до сітки'}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${snapToGrid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                                    {snapToGrid ? (t('common.on') || 'Увімк') : (t('common.off') || 'Вимк')}
                                </span>
                            </button>
                            <button
                                onClick={() => setShowAxes(!showAxes)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <AxesIcon size={18} />
                                    <span>{t('menu.view.rulers') || 'Лінійки та осі'}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${showAxes ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                                    {showAxes ? (t('common.on') || 'Увімк') : (t('common.off') || 'Вимк')}
                                </span>
                            </button>
                            <button
                                onClick={() => setShowCenterGuides(!showCenterGuides)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <AxesIcon size={18} />
                                    <span>{t('settings.appearance.showCenterGuides') || 'Напрямні центру'}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${showCenterGuides ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                                    {showCenterGuides ? (t('common.on') || 'Увімк') : (t('common.off') || 'Вимк')}
                                </span>
                            </button>
                            <button
                                onClick={() => setEnableSnapping(!enableSnapping)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <AxesIcon size={18} />
                                    <span>{t('settings.appearance.enableSnapping') || 'Прилипання до фігур'}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded font-semibold border ${enableSnapping ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-secondary)]'}`}>
                                    {enableSnapping ? (t('common.on') || 'Увімк') : (t('common.off') || 'Вимк')}
                                </span>
                            </button>
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                                    <span>{theme === 'dark' ? 'Світла тема' : 'Темна тема'}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleAction(onOpenSettings)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <SettingsIcon size={18} />
                                <span>{t('settings.title') || 'Налаштування полотна'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onClearCanvas)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 text-left"
                            >
                                <TrashIcon size={18} />
                                <span>{t('toolbar.clear') || 'Очистити полотно'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Section: Help & Information */}
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] px-3 mb-1.5">
                            {t('menu.help') || 'Довідка & Інформація'}
                        </div>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleAction(onOpenHelp)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <LightbulbIcon size={18} className="text-amber-400" />
                                <span>{t('menu.help.manual') || 'Посібник користувача'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onOpenShortcuts)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <KeyIcon size={18} className="text-blue-400" />
                                <span>{t('menu.help.shortcuts') || 'Гарячі клавіші'}</span>
                            </button>
                            {onOpenCheatCodes && (
                                <button
                                    onClick={() => handleAction(onOpenCheatCodes)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left text-purple-400"
                                >
                                    <KeyIcon size={18} />
                                    <span>Чит-коди</span>
                                </button>
                            )}
                            <button
                                onClick={() => handleAction(onOpenAbout)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <MessageSquareIcon size={18} className="text-indigo-400" />
                                <span>{t('menu.help.about') || 'Про Веретку'}</span>
                            </button>
                            <button
                                onClick={() => handleAction(onOpenFeedback)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] text-left"
                            >
                                <BugIcon size={18} className="text-rose-400" />
                                <span>{t('menu.help.feedback') || 'Зворотний зв\'язок'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-[var(--border-primary)] bg-[var(--bg-primary)] text-center text-xs text-[var(--text-tertiary)] shrink-0">
                    {t('welcome.title')} • Tkinter Vector Studio
                </div>
            </div>
        </div>
    );
};

export default MobileMenuDrawer;
