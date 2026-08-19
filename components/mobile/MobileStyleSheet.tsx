import React, { useState } from 'react';
import { ColorInput } from '../FormControls';
import PropertyEditor from '../PropertyEditor';
import { MobileAlignSheet } from './MobileAlignSheet';
import { Shape, Tool, DistributePathState } from '../../types';
import { 
    AlignShapesLeftIcon, 
    AlignShapesCenterHIcon, 
    AlignShapesRightIcon, 
    AlignShapesTopIcon, 
    AlignShapesCenterVIcon, 
    AlignShapesBottomIcon, 
    DistributeHorizontalIcon, 
    DistributeVerticalIcon,
    PaletteIcon,
    SettingsIcon
} from '../icons';
import { useLanguage } from '../LanguageContext';

interface MobileStyleSheetProps {
    fillColor: string;
    isFillEnabled: boolean;
    setIsFillEnabled: (enabled: boolean) => void;
    handleSetFillColor: (color: string) => void;
    setPreviewFillColor: (color: string | null) => void;
    handleCancelFillPreview: () => void;
    
    strokeColor: string;
    isStrokeEnabled: boolean;
    setIsStrokeEnabled: (enabled: boolean) => void;
    handleSetStrokeColor: (color: string) => void;
    setPreviewStrokeColor: (color: string | null) => void;
    handleCancelStrokePreview: () => void;
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;

    textColor: string;
    setTextColor: (color: string) => void;
    setPreviewTextColor: (color: string | null) => void;
    handleCancelTextPreview: () => void;
    textFont: string;
    setTextFont: (font: string) => void;
    textFontSize: number;
    setTextFontSize: (size: number) => void;

    selectedShapes: Shape[];
    allShapes: Shape[];
    canvasWidth?: number;
    canvasHeight?: number;
    updateShape: (s: Shape) => void;
    updateShapes: (shapes: Shape[]) => void;
    deleteShape: (id: string | string[]) => void;
    duplicateShape: (id: string) => void;
    handleExtractFromGroup?: () => void;
    handleFlip: (axis: 'horizontal' | 'vertical') => void;
    showSystemTags: boolean;
    distributePathState: DistributePathState | null;
    setDistributePathState: (state: DistributePathState | null) => void;
    onConfirmDistributePath?: () => void;
    onCancelDistributePath?: () => void;
    activeTool: Tool;
    activePointIndex: number | null;
    setActivePointIndex: (index: number | null) => void;
    deletePoint: (shapeId: string, pointIndex: number) => void;
    addPoint: (shapeId: string, pointIndex: number) => void;
    convertToPath: (id: string) => void;
    showNotification: (message: string, type?: 'info' | 'error', duration?: number) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    onAlignShapes: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom' | 'center-both' | 'distribute-h' | 'distribute-v' | 'distribute-path', relativeTo: 'selection' | 'canvas', distributeOptions?: { orientAlongPath: boolean, orientationType: 'radial' | 'tangent' | 'parallel' | 'perpendicular' | 'custom', orientationAngle: number, rotateAlongPath: boolean }) => void;
}

export const MobileStyleSheet: React.FC<MobileStyleSheetProps> = ({
    fillColor,
    isFillEnabled,
    setIsFillEnabled,
    handleSetFillColor,
    setPreviewFillColor,
    handleCancelFillPreview,
    strokeColor,
    isStrokeEnabled,
    setIsStrokeEnabled,
    handleSetStrokeColor,
    setPreviewStrokeColor,
    handleCancelStrokePreview,
    strokeWidth,
    setStrokeWidth,
    textColor,
    setTextColor,
    setPreviewTextColor,
    handleCancelTextPreview,
    textFont,
    setTextFont,
    textFontSize,
    setTextFontSize,
    selectedShapes,
    allShapes,
    canvasWidth = 800,
    canvasHeight = 600,
    updateShape,
    updateShapes,
    deleteShape,
    duplicateShape,
    handleExtractFromGroup,
    handleFlip,
    showSystemTags,
    distributePathState,
    setDistributePathState,
    onConfirmDistributePath,
    onCancelDistributePath,
    activeTool,
    activePointIndex,
    setActivePointIndex,
    deletePoint,
    addPoint,
    convertToPath,
    showNotification,
    setShapePreview,
    cancelShapePreview,
    onAlignShapes
}) => {
    const { t } = useLanguage();
    const hasSelection = selectedShapes.length > 0;
    const [subTab, setSubTab] = useState<'style' | 'properties' | 'align'>(hasSelection ? 'properties' : 'style');

    return (
        <div className="flex flex-col w-full space-y-3 pb-6">
            {/* Sub Tabs if shape selected */}
            {hasSelection && (
                <div className="grid grid-cols-3 bg-[var(--bg-secondary)] p-1 rounded-2xl mb-2 shrink-0 border border-[var(--border-secondary)] gap-1">
                    <button
                        onClick={() => setSubTab('properties')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            subTab === 'properties'
                                ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <SettingsIcon size={14} />
                        <span className="truncate">Властивості</span>
                    </button>
                    <button
                        onClick={() => setSubTab('style')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            subTab === 'style'
                                ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <PaletteIcon size={14} />
                        <span className="truncate">Кольори</span>
                    </button>
                    <button
                        onClick={() => setSubTab('align')}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            subTab === 'align'
                                ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <AlignShapesCenterHIcon size={14} />
                        <span className="truncate">Позиція</span>
                    </button>
                </div>
            )}

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto pr-0.5 space-y-3.5 overscroll-contain">
                {/* Properties View */}
                {hasSelection && subTab === 'properties' && (
                    <div className="p-0.5">
                        <PropertyEditor
                            onExtractFromGroup={handleExtractFromGroup}
                            handleFlip={handleFlip}
                            showSystemTags={showSystemTags}
                            distributePathState={distributePathState}
                            onDistributePathChange={setDistributePathState}
                            selectedShapes={selectedShapes}
                            allShapes={allShapes}
                            updateShape={updateShape}
                            updateShapes={updateShapes}
                            deleteShape={deleteShape}
                            duplicateShape={duplicateShape}
                            activeTool={activeTool}
                            activePointIndex={activePointIndex}
                            setActivePointIndex={setActivePointIndex}
                            deletePoint={deletePoint}
                            addPoint={addPoint}
                            convertToPath={convertToPath}
                            showNotification={showNotification}
                            setShapePreview={setShapePreview}
                            cancelShapePreview={cancelShapePreview}
                            fillColor={fillColor}
                            strokeColor={strokeColor}
                        />
                    </div>
                )}

                {/* Alignment View */}
                {hasSelection && subTab === 'align' && (
                    <div className="p-0.5">
                        <MobileAlignSheet
                            selectedShapes={selectedShapes}
                            allShapes={allShapes}
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            onAlignShapes={onAlignShapes}
                            distributePathState={distributePathState}
                            onDistributePathChange={setDistributePathState}
                            onConfirmDistributePath={onConfirmDistributePath}
                            onCancelDistributePath={onCancelDistributePath}
                        />
                    </div>
                )}

                {/* Colors / Quick Style View */}
                {(!hasSelection || subTab === 'style') && (
                    <div className="space-y-3.5">
                        {/* Fill Color */}
                        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--border-secondary)] space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <input 
                                        type="checkbox" 
                                        id="mobileFillToggle"
                                        checked={isFillEnabled} 
                                        onChange={(e) => setIsFillEnabled(e.target.checked)} 
                                        className="w-4 h-4 rounded accent-[var(--accent-primary)]" 
                                    />
                                    <label htmlFor="mobileFillToggle" className="text-sm font-bold cursor-pointer select-none">
                                        {t('tool.fillColor') || 'Заливка фігури'}
                                    </label>
                                </div>
                                <ColorInput 
                                    id="mobile-fill" 
                                    value={fillColor} 
                                    onChange={handleSetFillColor} 
                                    onPreview={setPreviewFillColor} 
                                    onCancel={handleCancelFillPreview} 
                                    disabled={!isFillEnabled} 
                                />
                            </div>
                        </div>

                        {/* Stroke Color & Width */}
                        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--border-secondary)] space-y-3 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <input 
                                        type="checkbox" 
                                        id="mobileStrokeToggle"
                                        checked={isStrokeEnabled} 
                                        onChange={(e) => setIsStrokeEnabled(e.target.checked)} 
                                        className="w-4 h-4 rounded accent-[var(--accent-primary)]" 
                                    />
                                    <label htmlFor="mobileStrokeToggle" className="text-sm font-bold cursor-pointer select-none">
                                        {t('tool.strokeColor') || 'Контур / Обводка'}
                                    </label>
                                </div>
                                <ColorInput 
                                    id="mobile-stroke" 
                                    value={strokeColor} 
                                    onChange={handleSetStrokeColor} 
                                    onPreview={setPreviewStrokeColor} 
                                    onCancel={handleCancelStrokePreview} 
                                    disabled={!isStrokeEnabled} 
                                />
                            </div>

                            <div className="pt-2.5 border-t border-[var(--border-secondary)] flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-[var(--text-secondary)] shrink-0">
                                    {t('tool.strokeWidth') || 'Товщина'}: <strong className="text-[var(--text-primary)]">{isNaN(strokeWidth) ? 1 : strokeWidth}px</strong>
                                </span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="20" 
                                    value={isNaN(strokeWidth) ? 1 : strokeWidth} 
                                    onChange={(e) => setStrokeWidth(Number(e.target.value))} 
                                    disabled={!isStrokeEnabled} 
                                    className="flex-1 accent-[var(--accent-primary)] disabled:opacity-40" 
                                />
                            </div>
                        </div>

                        {/* Text Styling */}
                        <div className="bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--border-secondary)] space-y-3 shadow-xs">
                            <div className="text-[11px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider">
                                {t('tool.text') || 'Параметри тексту'}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-[var(--text-primary)]">Колір тексту</span>
                                <ColorInput 
                                    id="mobile-text-color" 
                                    value={textColor} 
                                    onChange={setTextColor} 
                                    onPreview={setPreviewTextColor} 
                                    onCancel={handleCancelTextPreview} 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-[var(--border-secondary)]">
                                <div>
                                    <span className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Шрифт</span>
                                    <select
                                        value={textFont}
                                        onChange={(e) => setTextFont(e.target.value)}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl p-2 text-xs text-[var(--text-primary)] font-medium"
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Times New Roman">Times</option>
                                        <option value="Courier New">Courier</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Tahoma">Tahoma</option>
                                        <option value="Comic Sans MS">Comic Sans</option>
                                    </select>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Розмір (pt)</span>
                                    <input
                                        type="number"
                                        min="6"
                                        max="120"
                                        value={isNaN(textFontSize) ? 12 : textFontSize}
                                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-xl p-2 text-xs text-[var(--text-primary)] font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileStyleSheet;
