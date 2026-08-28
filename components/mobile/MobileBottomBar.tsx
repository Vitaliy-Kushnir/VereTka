import React, { useState } from 'react';
import { 
    SelectIcon, 
    RectangleIcon, 
    LayersIcon, 
    PaletteIcon, 
    CodeIcon,
    DuplicateIcon, 
    TrashIcon, 
    FlipHorizontalIcon, 
    FlipVerticalIcon, 
    GroupIcon, 
    UngroupIcon, 
    EditPointsIcon,
    AlignShapesCenterHIcon
} from '../icons';
import { MoreHorizontal, ChevronRight, ChevronLeft } from 'lucide-react';
import { Tool } from '../../types';
import { useIsLandscape } from '../../hooks/useIsMobile';
import { useLanguage } from '../LanguageContext';

interface MobileBottomBarProps {
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    hasSelectedShapes: boolean;
    selectedShapesCount?: number;
    canGroup?: boolean;
    canUngroup?: boolean;
    canFlip?: boolean;
    onDeleteShape: () => void;
    onDuplicateShape: () => void;
    onGroup?: () => void;
    onUngroup?: () => void;
    onFlipH?: () => void;
    onFlipV?: () => void;
    onOpenLayers: () => void;
    onOpenShapes: () => void;
    onOpenPalette: () => void;
    onOpenCode: () => void;
    onOpenAlign?: () => void;
    onOpenActions?: () => void;
    activeSheet?: 'tools' | 'shapes' | 'palette' | 'layers' | 'code' | 'menu' | 'align' | null;
    isLandscape?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
    activeTool,
    setActiveTool,
    hasSelectedShapes,
    selectedShapesCount = 0,
    canGroup = false,
    canUngroup = false,
    canFlip = false,
    onDeleteShape,
    onDuplicateShape,
    onGroup,
    onUngroup,
    onFlipH,
    onFlipV,
    onOpenLayers,
    onOpenShapes,
    onOpenPalette,
    onOpenCode,
    onOpenAlign,
    activeSheet = null,
    isLandscape: isLandscapeProp
}) => {
    const { t } = useLanguage();
    const isLandscapeDetected = useIsLandscape();
    const isLandscape = isLandscapeProp !== undefined ? isLandscapeProp : isLandscapeDetected;
    const [isActionsExpanded, setIsActionsExpanded] = useState<boolean>(false);

    const isShapesActive = activeSheet === 'shapes' || (!activeSheet && activeTool !== 'select' && activeTool !== 'edit-points');
    const isStyleActive = activeSheet === 'palette';
    const isLayersActive = activeSheet === 'layers';
    const isCodeActive = activeSheet === 'code';
    const isAlignActive = activeSheet === 'align';
    const isSelectActive = !activeSheet && (activeTool === 'select' || activeTool === 'edit-points');

    // -------------------------------------------------------------
    // LANDSCAPE MODE: Vertical Right-Side Bar (Top to Bottom)
    // -------------------------------------------------------------
    if (isLandscape) {
        return (
            <aside 
                className="fixed top-12 bottom-0 right-0 w-14 sm:w-16 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] z-[120] shadow-[-6px_0_20px_rgba(0,0,0,0.35)] flex flex-col justify-between items-center py-2 px-1 pb-[max(6px,env(safe-area-inset-bottom,0px))] pr-[max(4px,env(safe-area-inset-right,0px))] select-none"
                aria-label={t('mobile.bottomBar.label') || 'Панель керування'}
            >
                {/* Top Section: Main Navigation Tools (Top to Bottom) */}
                <div className="flex flex-col items-center gap-1.5 w-full">
                    {/* 1. Select / Edit points */}
                    <button 
                        onClick={() => {
                            if (activeTool === 'select') {
                                setActiveTool('edit-points');
                            } else {
                                setActiveTool('select');
                            }
                        }}
                        title={activeTool === 'edit-points' ? (t('mobile.nav.nodes') || 'Вузли') : (t('mobile.nav.select') || 'Вибір')}
                        className={`relative w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isSelectActive 
                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                        }`}
                    >
                        {activeTool === 'edit-points' ? <EditPointsIcon size={18} /> : <SelectIcon size={18} />}
                        <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-full">
                            {activeTool === 'edit-points' ? (t('mobile.nav.nodes') || 'Вузли') : (t('mobile.nav.select') || 'Вибір')}
                        </span>
                        {isSelectActive && (
                            <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--accent-primary)]" />
                        )}
                    </button>

                    {/* 2. Shapes Sheet */}
                    <button 
                        onClick={onOpenShapes}
                        title={t('mobile.nav.shapesTitle') || 'Фігури та інструменти'}
                        className={`relative w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isShapesActive
                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                        }`}
                    >
                        <RectangleIcon size={18} />
                        <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-full">
                            {t('mobile.nav.shapes') || 'Фігури'}
                        </span>
                        {activeSheet === 'shapes' && (
                            <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--accent-primary)]" />
                        )}
                    </button>

                    {/* 3. Style / Palette Sheet */}
                    <button 
                        onClick={onOpenPalette}
                        title={t('mobile.nav.styleTitle') || 'Стиль та колір'}
                        className={`relative w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isStyleActive
                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                        }`}
                    >
                        <PaletteIcon size={18} />
                        <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-full">
                            {t('mobile.nav.style') || 'Стиль'}
                        </span>
                        {isStyleActive && (
                            <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--accent-primary)]" />
                        )}
                    </button>

                    {/* 4. Objects / Layers Sheet */}
                    <button 
                        onClick={onOpenLayers}
                        title={t('mobile.nav.objectsTitle') || 'Обʼєкти та шари'}
                        className={`relative w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isLayersActive
                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                        }`}
                    >
                        <LayersIcon size={18} />
                        <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-full">
                            {t('mobile.nav.objects') || 'Обʼєкти'}
                        </span>
                        {isLayersActive && (
                            <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--accent-primary)]" />
                        )}
                    </button>

                    {/* 5. Tkinter Code Sheet */}
                    <button 
                        onClick={onOpenCode}
                        title={t('mobile.nav.codeTitle') || 'Код Tkinter'}
                        className={`relative w-full py-1.5 px-0.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isCodeActive
                                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                        }`}
                    >
                        <CodeIcon size={18} />
                        <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate max-w-full">
                            {t('mobile.nav.code') || 'Код'}
                        </span>
                        {isCodeActive && (
                            <span className="absolute left-0.5 top-1.5 bottom-1.5 w-1 rounded-r bg-[var(--accent-primary)]" />
                        )}
                    </button>
                </div>

                            </aside>
        );
    }

    // -------------------------------------------------------------
    // PORTRAIT MODE: Horizontal Bottom Bar
    // -------------------------------------------------------------
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] pb-[env(safe-area-inset-bottom)] z-[120] shadow-[0_-8px_25px_rgba(0,0,0,0.35)]">
            
            {/* Main Mobile Navigation Tabs (Portrait) */}
            <div className="grid grid-cols-5 items-center px-1.5 py-1 text-center gap-1">
                {/* 1. Select / Edit Points Tool */}
                <button 
                    onClick={() => {
                        if (activeTool === 'select') {
                            setActiveTool('edit-points');
                        } else {
                            setActiveTool('select');
                        }
                    }}
                    className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                        isSelectActive 
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                    }`}
                >
                    {activeTool === 'edit-points' ? <EditPointsIcon size={19} /> : <SelectIcon size={19} />}
                    <span className="text-[11px] mt-0.5 leading-tight tracking-tight truncate max-w-full">
                        {activeTool === 'edit-points' ? (t('mobile.nav.nodes') || 'Вузли') : (t('mobile.nav.select') || 'Вибір')}
                    </span>
                    {isSelectActive && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                </button>

                {/* 2. Shapes Sheet */}
                <button 
                    onClick={onOpenShapes}
                    className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                        isShapesActive
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                    }`}
                >
                    <RectangleIcon size={19} />
                    <span className="text-[11px] mt-0.5 leading-tight tracking-tight truncate max-w-full">
                        {t('mobile.nav.shapes') || 'Фігури'}
                    </span>
                    {activeSheet === 'shapes' && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                </button>

                {/* 3. Style & Properties Sheet */}
                <button 
                    onClick={onOpenPalette}
                    className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                        isStyleActive
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                    }`}
                >
                    <PaletteIcon size={19} />
                    <span className="text-[11px] mt-0.5 leading-tight tracking-tight truncate max-w-full">
                        {t('mobile.nav.style') || 'Стиль'}
                    </span>
                    {isStyleActive && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                </button>

                {/* 4. Objects / Layers & Shapes List Sheet */}
                <button 
                    onClick={onOpenLayers}
                    className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                        isLayersActive
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                    }`}
                >
                    <LayersIcon size={19} />
                    <span className="text-[11px] mt-0.5 leading-tight tracking-tight truncate max-w-full">
                        {t('mobile.nav.objects') || 'Обʼєкти'}
                    </span>
                    {isLayersActive && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                </button>

                {/* 5. Tkinter Code & Simulator */}
                <button 
                    onClick={onOpenCode}
                    className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                        isCodeActive
                            ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/15 font-bold shadow-xs border border-[var(--accent-primary)]/30' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] font-medium'
                    }`}
                >
                    <CodeIcon size={19} />
                    <span className="text-[11px] mt-0.5 leading-tight tracking-tight truncate max-w-full">
                        {t('mobile.nav.code') || 'Код'}
                    </span>
                    {isCodeActive && (
                        <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default MobileBottomBar;
