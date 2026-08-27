import React, { useState, useMemo } from 'react';
import { 
    DistributePathIcon, 
    CheckIcon, 
    XIcon, 
    SettingsIcon, 
    EditPointsIcon, 
    TrashIcon, 
    GroupIcon, 
    AlignShapesCenterHIcon,
    UndoIcon
} from './icons';
import { Shape, DistributePathState, Tool, PolygonShape } from '../types';
import { isShapeClosed } from '../lib/geometry';
import { useLanguage } from './LanguageContext';

export interface FloatingModeControlsProps {
    // Mode states
    distributePathState: DistributePathState | null;
    onDistributePathChange: (state: DistributePathState) => void;
    onConfirmDistributePath: () => void;
    onCancelDistributePath: () => void;
    isSelectingPathShape?: boolean;
    onToggleSelectPathShape?: () => void;

    // Active tool & Points editing
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    selectedShapeIds: string[];
    selectedShapes: Shape[];
    allShapes: Shape[];
    activePointIndex: number | null;
    setActivePointIndex: (index: number | null) => void;
    onDeletePoint?: (shapeId: string, pointIndex: number) => void;
    onAddPoint?: (shapeId: string, pointIndex: number) => void;

    // Drawing polyline / bezier
    isDrawingPolyline: boolean;
    polylinePoints: Array<{ x: number; y: number }>;
    onCompletePolyline: (close: boolean) => void;
    onCancelPolyline: () => void;
    onUndoPolylinePoint?: () => void;

    isDrawingBezier: boolean;
    bezierPoints: any[];
    onCompleteBezier: (close?: boolean) => void;
    onCancelBezier: () => void;
    onUndoBezierPoint?: () => void;

    // Multi-selection operations
    onGroup?: () => void;
    onDeleteSelected?: () => void;
    onOpenAlign?: () => void;
    onStartDistributePath?: () => void;

    // Image placing
    isImportingImage?: boolean;
    pendingImage?: any;
    onCancelImportImage?: () => void;

    // Canvas dimensions for sliders
    canvasWidth: number;
    canvasHeight: number;
}

export const FloatingModeControls: React.FC<FloatingModeControlsProps> = ({
    distributePathState,
    onDistributePathChange,
    onConfirmDistributePath,
    onCancelDistributePath,
    isSelectingPathShape,
    onToggleSelectPathShape,

    activeTool,
    setActiveTool,
    selectedShapeIds,
    selectedShapes,
    allShapes,
    activePointIndex,
    setActivePointIndex,
    onDeletePoint,
    onAddPoint,

    isDrawingPolyline,
    polylinePoints,
    onCompletePolyline,
    onCancelPolyline,
    onUndoPolylinePoint,

    isDrawingBezier,
    bezierPoints,
    onCompleteBezier,
    onCancelBezier,
    onUndoBezierPoint,

    onGroup,
    onDeleteSelected,
    onOpenAlign,
    onStartDistributePath,

    isImportingImage,
    pendingImage,
    onCancelImportImage,

    canvasWidth,
    canvasHeight
}) => {
    const { t } = useLanguage();
    const [isParamsOpen, setIsParamsOpen] = useState(false);

    // Filter candidate shapes for "Фігура (контур)"
    const candidatePathShapes = useMemo(() => {
        if (!distributePathState) return [];
        const entityIds = new Set(distributePathState.entities.flatMap(e => e.ids));
        return allShapes.filter(s => 
            !entityIds.has(s.id) &&
            s.type !== 'text' &&
            s.type !== 'group' &&
            !s.groupId
        );
    }, [allShapes, distributePathState]);

    // Active single shape for point editing
    const activePointShape = selectedShapes.length === 1 ? selectedShapes[0] : null;
    const shapePointsCount = activePointShape && 'points' in activePointShape && Array.isArray(activePointShape.points)
        ? activePointShape.points.length
        : 0;

    // Determine current active mode
    const isDistributing = !!distributePathState;
    const isEditingPoints = activeTool === 'edit-points' && selectedShapes.length > 0;
    const isDrawing = isDrawingPolyline || isDrawingBezier;
    const isMultiSelecting = selectedShapeIds.length >= 2 && !isDistributing;
    const isPlacingImage = !!(isImportingImage || pendingImage);

    // If no special active mode, do not render anything to keep canvas clear
    if (!isDistributing && !isEditingPoints && !isDrawing && !isMultiSelecting && !isPlacingImage && !isSelectingPathShape) {
        return null;
    }

    return (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center w-[calc(100vw-16px)] max-w-[420px] pointer-events-auto select-none transition-all duration-200 animate-in fade-in slide-in-from-top-2">
            
            {/* Main Floating Island Header / Controls Bar */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-[var(--bg-primary)]/95 backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl text-[var(--text-primary)] text-xs font-medium max-w-full">
                
                {/* 1. DISTRIBUTE ALONG PATH MODE */}
                {isDistributing && distributePathState && (
                    <>
                        <div className="flex items-center gap-1.5 pr-2 border-r border-[var(--border-primary)] shrink-0">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <DistributePathIcon size={16} className="text-amber-500" />
                            <span className="bg-amber-500/15 text-amber-400 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                                {distributePathState.type === 'circle' ? (t('tool.distribute.path.circle') || 'Коло') :
                                 distributePathState.type === 'line' ? (t('tool.distribute.path.line') || 'Пряма') : 
                                 (t('tool.distribute.path.shape') || 'Фігура')}
                            </span>
                        </div>

                        {/* Button to toggle parameters popover */}
                        <button
                            type="button"
                            onClick={() => setIsParamsOpen(prev => !prev)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-xl transition-all font-semibold shrink-0 text-xs ${
                                isParamsOpen
                                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)]'
                            }`}
                            title="Відкрити вікно параметрів розподілу"
                        >
                            <SettingsIcon size={13} className={isParamsOpen ? 'animate-spin-slow' : ''} />
                            <span>{t('menu.settings') || 'Параметри'}</span>
                        </button>

                        {/* In Shape Mode: Button to pick shape on canvas */}
                        {distributePathState.type === 'shape' && onToggleSelectPathShape && (
                            <button
                                type="button"
                                onClick={onToggleSelectPathShape}
                                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                                    isSelectingPathShape
                                        ? 'bg-amber-500 text-white animate-pulse shadow-md'
                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)]'
                                }`}
                                title="Клікніть по фігурі на полотні"
                            >
                                <span>{isSelectingPathShape ? '👆 Обрати...' : '🎯 Контур'}</span>
                            </button>
                        )}

                        {/* Confirm Button */}
                        <button
                            type="button"
                            onClick={onConfirmDistributePath}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold shadow-sm transition-all shrink-0 text-xs"
                            title="Застосувати зміни"
                        >
                            <CheckIcon size={13} />
                            <span>Готово</span>
                        </button>

                        {/* Cancel Button */}
                        <button
                            type="button"
                            onClick={onCancelDistributePath}
                            className="flex items-center gap-1 p-1 rounded-xl hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors shrink-0"
                            title="Скасувати розподіл"
                        >
                            <XIcon size={15} />
                        </button>
                    </>
                )}

                {/* 2. SELECTING PATH SHAPE STANDALONE MODE */}
                {!isDistributing && isSelectingPathShape && (
                    <>
                        <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-primary)]">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            <span className="font-bold text-cyan-400">
                                🎯 Клікніть фігуру на полотні для вибору контуру
                            </span>
                        </div>
                        {onToggleSelectPathShape && (
                            <button
                                type="button"
                                onClick={onToggleSelectPathShape}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold"
                            >
                                <XIcon size={14} />
                                <span>Скасувати</span>
                            </button>
                        )}
                    </>
                )}

                {/* 3. EDIT POINTS MODE */}
                {isEditingPoints && !isDistributing && (
                    <>
                        <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-primary)]">
                            <EditPointsIcon size={16} className="text-cyan-400" />
                            <span className="font-bold text-cyan-400">
                                {t('tool.editPoints') || 'Редагування точок'}
                            </span>
                            <span className="text-[11px] text-[var(--text-tertiary)]">
                                {activePointIndex !== null ? `(Вузол #${activePointIndex + 1})` : `(${shapePointsCount} точок)`}
                            </span>
                        </div>

                        {/* Delete point button */}
                        {onDeletePoint && activePointShape && activePointIndex !== null && (
                            <button
                                type="button"
                                onClick={() => onDeletePoint(activePointShape.id, activePointIndex)}
                                disabled={shapePointsCount <= 2}
                                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-40 font-semibold transition-all shrink-0 text-xs"
                                title="Видалити вибрану точку"
                            >
                                <TrashIcon size={13} />
                                <span>Видалити</span>
                            </button>
                        )}

                        {/* Add point button */}
                        {onAddPoint && activePointShape && activePointIndex !== null && (
                            <button
                                type="button"
                                onClick={() => onAddPoint(activePointShape.id, activePointIndex)}
                                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] font-semibold transition-all shrink-0 text-xs"
                                title="Вставити нову точку після поточної"
                            >
                                <span>+ Точка</span>
                            </button>
                        )}

                        {/* Finish editing points */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTool('select');
                                setActivePointIndex(null);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-[var(--accent-text)] font-bold shadow-sm transition-all shrink-0 text-xs"
                        >
                            <CheckIcon size={13} />
                            <span>Готово</span>
                        </button>
                    </>
                )}

                {/* 5. MULTI-SELECTION MODE (when not distributing) */}
                {isMultiSelecting && !isDistributing && !isEditingPoints && !isDrawing && (
                    <>
                        <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-primary)]">
                            <span className="font-bold text-[var(--accent-primary)]">
                                🔲 {t('status.selected') || 'Виділено'}:
                            </span>
                            <span className="bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold px-2 py-0.5 rounded-full text-[11px]">
                                {selectedShapeIds.length}
                            </span>
                        </div>

                        {/* Group Button */}
                        {onGroup && (
                            <button
                                type="button"
                                onClick={onGroup}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] font-semibold transition-all"
                                title="Згрупувати виділені об'єкти (Ctrl+G)"
                            >
                                <GroupIcon size={14} />
                                <span className="hidden sm:inline">Згрупувати</span>
                            </button>
                        )}

                        {/* Align Button */}
                        {onOpenAlign && (
                            <button
                                type="button"
                                onClick={onOpenAlign}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] font-semibold transition-all"
                                title="Відкрити панель вирівнювання"
                            >
                                <AlignShapesCenterHIcon size={14} className="text-[var(--accent-primary)]" />
                                <span>Вирівняти</span>
                            </button>
                        )}

                        {/* Distribute along path button */}
                        {onStartDistributePath && (
                            <button
                                type="button"
                                onClick={onStartDistributePath}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 font-semibold transition-all"
                                title="Розподілити фігури за колом, прямою або контуром"
                            >
                                <DistributePathIcon size={14} />
                                <span className="hidden sm:inline">За шляхом</span>
                            </button>
                        )}

                        {/* Delete Button */}
                        {onDeleteSelected && (
                            <button
                                type="button"
                                onClick={onDeleteSelected}
                                className="flex items-center gap-1 p-1 rounded-xl hover:bg-red-500/15 text-red-400 transition-colors"
                                title="Видалити виділені фігури (Del)"
                            >
                                <TrashIcon size={16} />
                            </button>
                        )}
                    </>
                )}

                {/* 6. PLACING IMAGE MODE */}
                {isPlacingImage && !isDistributing && (
                    <>
                        <div className="flex items-center gap-2 pr-2 border-r border-[var(--border-primary)]">
                            <span className="font-bold text-amber-400">
                                🖼️ Клікніть на полотні для розміщення зображення
                            </span>
                        </div>
                        {onCancelImportImage && (
                            <button
                                type="button"
                                onClick={onCancelImportImage}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold"
                            >
                                <XIcon size={14} />
                                <span>Скасувати</span>
                            </button>
                        )}
                    </>
                )}

            </div>

            {/* FLOATING PARAMETERS CARD (Toggled via ⚙️ button in Distribute Mode) */}
            {isDistributing && distributePathState && isParamsOpen && (
                <div className="mt-2 w-[calc(100vw-20px)] max-w-[360px] max-h-[60vh] overflow-y-auto bg-[var(--bg-primary)]/95 backdrop-blur-2xl border border-[var(--border-primary)] rounded-2xl shadow-2xl p-3.5 space-y-3 text-xs text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-150">
                    
                    <div className="flex items-center justify-between border-b border-[var(--border-secondary)] pb-2">
                        <div className="flex items-center gap-2 font-bold text-amber-500">
                            <DistributePathIcon size={16} />
                            <span>{t('tool.distributePath.title') || 'Параметри розподілу за шляхом'}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsParamsOpen(false)}
                            className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            <XIcon size={14} />
                        </button>
                    </div>

                    {/* Path Type Selector Tabs */}
                    <div className="space-y-1">
                        <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">
                            {t('tool.distributePath.type') || 'Тип шляху'}:
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    let newOrientation = distributePathState.orientationType;
                                    if (newOrientation === 'parallel' || newOrientation === 'perpendicular') {
                                        newOrientation = newOrientation === 'parallel' ? 'tangent' : 'radial';
                                    }
                                    onDistributePathChange({
                                        ...distributePathState,
                                        type: 'circle',
                                        orientationType: newOrientation
                                    });
                                }}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                                    distributePathState.type === 'circle'
                                        ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-xs'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                }`}
                            >
                                <span>{t('tool.distribute.path.circle') || 'Коло'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    let newOrientation = distributePathState.orientationType;
                                    if (newOrientation === 'radial' || newOrientation === 'tangent') {
                                        newOrientation = newOrientation === 'radial' ? 'perpendicular' : 'parallel';
                                    }
                                    onDistributePathChange({
                                        ...distributePathState,
                                        type: 'line',
                                        orientationType: newOrientation
                                    });
                                }}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                                    distributePathState.type === 'line'
                                        ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-xs'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                }`}
                            >
                                <span>{t('tool.distribute.path.line') || 'Пряма'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    let newOrientation = distributePathState.orientationType;
                                    if (newOrientation === 'radial' || newOrientation === 'tangent') {
                                        newOrientation = newOrientation === 'radial' ? 'perpendicular' : 'parallel';
                                    }
                                    const updated: DistributePathState = {
                                        ...distributePathState,
                                        type: 'shape',
                                        orientationType: newOrientation
                                    };
                                    if (!updated.shapePathParams) {
                                        const firstCandidate = candidatePathShapes[0];
                                        updated.shapePathParams = {
                                            shapeId: firstCandidate?.id,
                                            pathShape: firstCandidate ? { ...firstCandidate } : undefined,
                                            keepShape: true,
                                            isExisting: !!firstCandidate
                                        };
                                    }
                                    onDistributePathChange(updated);
                                }}
                                className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                                    distributePathState.type === 'shape'
                                        ? 'bg-[var(--accent-primary)] text-white border-transparent shadow-xs'
                                        : 'bg-[var(--bg-secondary)] border-[var(--border-secondary)] text-[var(--text-secondary)]'
                                }`}
                            >
                                <span>{t('tool.distribute.path.shape') || 'Фігура'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Circle Radius */}
                    {distributePathState.type === 'circle' && (
                        <div className="space-y-1 bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--border-secondary)]">
                            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                <span>{t('prop.radius') || 'Радіус кола'}:</span>
                                <strong className="text-[var(--text-primary)] font-mono">{Math.round(distributePathState.circleParams?.radius ?? 100)} px</strong>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max={Math.max(300, Math.min(canvasWidth, canvasHeight) / 2)}
                                value={Math.round(distributePathState.circleParams?.radius ?? 100)}
                                onChange={(e) => {
                                    onDistributePathChange({
                                        ...distributePathState,
                                        circleParams: {
                                            ...distributePathState.circleParams,
                                            radius: Number(e.target.value)
                                        }
                                    });
                                }}
                                className="w-full accent-[var(--accent-primary)]"
                            />
                        </div>
                    )}

                    {/* Shape / Contour Controls */}
                    {distributePathState.type === 'shape' && (
                        <div className="bg-[var(--bg-secondary)] p-2.5 rounded-xl border border-[var(--border-secondary)] space-y-2.5">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                                    <span className="font-semibold">{t('tool.distribute.path.shape') || 'Фігура-контур'}:</span>
                                    {distributePathState.shapePathParams?.pathShape && (
                                        <span className="text-amber-400 font-medium truncate max-w-[150px]">
                                            {distributePathState.shapePathParams.pathShape.name || distributePathState.shapePathParams.pathShape.type}
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={distributePathState.shapePathParams?.shapeId || ''}
                                    onChange={(e) => {
                                        const shapeId = e.target.value;
                                        const foundShape = candidatePathShapes.find(s => s.id === shapeId);
                                        onDistributePathChange({
                                            ...distributePathState,
                                            shapePathParams: {
                                                ...distributePathState.shapePathParams,
                                                shapeId: shapeId || undefined,
                                                pathShape: foundShape ? { ...foundShape } : undefined,
                                                keepShape: distributePathState.shapePathParams?.keepShape ?? true,
                                                isExisting: !!foundShape
                                            }
                                        });
                                    }}
                                    className="w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)]"
                                >
                                    <option value="">
                                        {candidatePathShapes.length === 0 
                                            ? 'Немає фігур на полотні' 
                                            : '-- Оберіть контур зі списку --'}
                                    </option>
                                    {candidatePathShapes.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name || s.type} (#{s.id.slice(0, 4)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                                <input
                                    type="checkbox"
                                    checked={distributePathState.shapePathParams?.keepShape ?? true}
                                    onChange={(e) => {
                                        onDistributePathChange({
                                            ...distributePathState,
                                            shapePathParams: {
                                                ...distributePathState.shapePathParams,
                                                keepShape: e.target.checked
                                            }
                                        });
                                    }}
                                    className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                                />
                                <span className="text-xs font-medium text-[var(--text-primary)]">
                                    {t('tool.distribute.path.keepShape') || 'Залишити фігуру-шлях на полотні'}
                                </span>
                            </label>

                            {/* Polygon Sides */}
                            {distributePathState.shapePathParams?.pathShape && 
                             (distributePathState.shapePathParams.pathShape.type === 'polygon' || distributePathState.shapePathParams.pathShape.type === 'star') && (
                                <div className="space-y-1 pt-1 border-t border-[var(--border-secondary)]/50">
                                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                        <span>{t('prop.sides') || 'Сторони / Промені'}:</span>
                                        <strong className="text-[var(--text-primary)]">{(distributePathState.shapePathParams.pathShape as PolygonShape).sides}</strong>
                                    </div>
                                    <input
                                        type="range"
                                        min="3"
                                        max="24"
                                        value={(distributePathState.shapePathParams.pathShape as PolygonShape).sides || 5}
                                        onChange={(e) => {
                                            onDistributePathChange({
                                                ...distributePathState,
                                                shapePathParams: {
                                                    ...distributePathState.shapePathParams,
                                                    pathShape: {
                                                        ...distributePathState.shapePathParams!.pathShape!,
                                                        sides: Number(e.target.value)
                                                    } as any
                                                }
                                            });
                                        }}
                                        className="w-full accent-[var(--accent-primary)]"
                                    />
                                </div>
                            )}

                            {/* Closed Shape Contour Shift */}
                            {distributePathState.shapePathParams?.pathShape && isShapeClosed(distributePathState.shapePathParams.pathShape) && (
                                <div className="space-y-1 pt-1 border-t border-[var(--border-secondary)]/50">
                                    <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                        <span>{t('tool.distribute.path.contourShift') || 'Зсув вздовж контуру'}:</span>
                                        <strong className="text-[var(--text-primary)]">{Math.round(distributePathState.shapePathParams?.contourShift || 0)}%</strong>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={Math.round(distributePathState.shapePathParams?.contourShift || 0)}
                                        onChange={(e) => {
                                            onDistributePathChange({
                                                ...distributePathState,
                                                shapePathParams: {
                                                    ...distributePathState.shapePathParams,
                                                    contourShift: Number(e.target.value)
                                                }
                                            });
                                        }}
                                        className="w-full accent-[var(--accent-primary)]"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orientation & Rotation Settings */}
                    <div className="space-y-2 pt-1 border-t border-[var(--border-secondary)]">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!distributePathState.orientAlongPath}
                                onChange={(e) => {
                                    onDistributePathChange({
                                        ...distributePathState,
                                        orientAlongPath: e.target.checked
                                    });
                                }}
                                className="w-4 h-4 rounded accent-[var(--accent-primary)]"
                            />
                            <span className="font-semibold text-[var(--text-primary)]">
                                {t('tool.distribute.path.orient') || 'Орієнтувати вздовж шляху'}
                            </span>
                        </label>

                        {distributePathState.orientAlongPath && (
                            <div className="pl-5 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[var(--text-secondary)] text-xs">Тип орієнтації:</span>
                                    <select
                                        value={distributePathState.orientationType}
                                        onChange={(e) => {
                                            onDistributePathChange({
                                                ...distributePathState,
                                                orientationType: e.target.value as any
                                            });
                                        }}
                                        className="bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-2 py-1 text-xs text-[var(--text-primary)]"
                                    >
                                        {distributePathState.type === 'circle' ? (
                                            <>
                                                <option value="radial">{t('tool.distribute.path.radial') || 'Радіально'}</option>
                                                <option value="tangent">{t('tool.distribute.path.tangent') || 'Дотично'}</option>
                                                <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="parallel">{t('tool.distribute.path.parallel') || 'Паралельно'}</option>
                                                <option value="perpendicular">{t('tool.distribute.path.perpendicular') || 'Перпендикулярно'}</option>
                                                <option value="custom">{t('tool.distribute.path.customAngle') || 'Власний кут'}</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {distributePathState.orientationType === 'custom' && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                                            <span>Кут орієнтації:</span>
                                            <strong className="text-[var(--text-primary)]">{distributePathState.orientationAngle ?? 0}°</strong>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={distributePathState.orientationAngle ?? 0}
                                            onChange={(e) => {
                                                onDistributePathChange({
                                                    ...distributePathState,
                                                    orientationAngle: Number(e.target.value)
                                                });
                                            }}
                                            className="w-full accent-[var(--accent-primary)]"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!distributePathState.rotateAlongPath}
                                disabled={!!distributePathState.orientAlongPath}
                                onChange={(e) => {
                                    onDistributePathChange({
                                        ...distributePathState,
                                        rotateAlongPath: e.target.checked
                                    });
                                }}
                                className="w-4 h-4 rounded accent-[var(--accent-primary)] disabled:opacity-40"
                            />
                            <span className={`font-medium ${distributePathState.orientAlongPath ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
                                {t('tool.distribute.path.rotate') || 'Обертати фігури за кутом'}
                            </span>
                        </label>
                    </div>

                    {/* Modal bottom actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-secondary)]">
                        <button
                            type="button"
                            onClick={() => setIsParamsOpen(false)}
                            className="px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold"
                        >
                            Згорнути вікно
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

export default FloatingModeControls;
