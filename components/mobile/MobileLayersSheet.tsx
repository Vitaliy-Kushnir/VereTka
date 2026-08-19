import React, { useState } from 'react';
import ShapeList from '../ShapeList';
import LayerList from '../LayerList';
import { Shape, Layer, DistributePathState } from '../../types';
import { LayersIcon, ListIcon } from '../icons';
import { useLanguage } from '../LanguageContext';

interface MobileLayersSheetProps {
    shapes: Shape[];
    lockedShapeIds: Set<string>;
    selectedShapeIds: string[];
    onSelectShape: (id: string, isShift: boolean) => void;
    onDeleteShape: (id: string) => void;
    onMoveShape: (id: string, direction: 'up' | 'down') => void;
    onUpdateShape: (shape: Shape) => void;
    onReorderShape: (draggedId: string, targetId: string, position: 'top' | 'bottom' | 'inside') => void;
    showTkinterNames: boolean;
    layers: Layer[];
    activeLayerId: string;
    onMoveToLayer: (shapeId: string, layerId: string) => void;
    onSetActiveLayer: (id: string) => void;
    onLayerWarning?: (reason: 'hidden' | 'locked', layerId?: string, action?: () => void) => void;
    ignoreHiddenWarningForLayer?: string | null;
    distributePathState?: DistributePathState | null;

    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onClearLayer: (id: string) => void;
    onToggleLayerVisibility: (id: string) => void;
    onToggleLayerLock: (id: string) => void;
    onUpdateLayerName: (id: string, name: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
    canvasWidth: number;
    canvasHeight: number;
    canvasBgColor: string;
}

export const MobileLayersSheet: React.FC<MobileLayersSheetProps> = ({
    shapes,
    lockedShapeIds,
    selectedShapeIds,
    onSelectShape,
    onDeleteShape,
    onMoveShape,
    onUpdateShape,
    onReorderShape,
    showTkinterNames,
    layers,
    activeLayerId,
    onMoveToLayer,
    onSetActiveLayer,
    onLayerWarning,
    ignoreHiddenWarningForLayer,
    distributePathState,
    onAddLayer,
    onDeleteLayer,
    onClearLayer,
    onToggleLayerVisibility,
    onToggleLayerLock,
    onUpdateLayerName,
    onMoveLayer,
    canvasWidth,
    canvasHeight,
    canvasBgColor
}) => {
    const [activeTab, setActiveTab] = useState<'shapes' | 'layers'>('shapes');
    const { t } = useLanguage();

    return (
        <div className="flex flex-col h-[65vh] min-h-[320px]">
            {/* Tab Switcher */}
            <div className="grid grid-cols-2 bg-[var(--bg-secondary)] p-1 rounded-2xl mb-3 shrink-0 border border-[var(--border-secondary)] gap-1">
                <button
                    onClick={() => setActiveTab('shapes')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'shapes'
                            ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <ListIcon size={15} />
                    <span className="truncate">{t('shape.list') || 'Список фігур'}</span>
                    <span className="text-[10px] bg-[var(--border-secondary)]/50 px-1.5 py-0.2 rounded-full opacity-80">
                        {shapes.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                        activeTab === 'layers'
                            ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)] shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    <LayersIcon size={15} />
                    <span className="truncate">{t('layer.title') || 'Шари'}</span>
                    <span className="text-[10px] bg-[var(--border-secondary)]/50 px-1.5 py-0.2 rounded-full opacity-80">
                        {layers.length}
                    </span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'shapes' ? (
                    <div className="h-full overflow-hidden flex flex-col">
                        <ShapeList
                            distributePathState={distributePathState}
                            shapes={shapes}
                            lockedShapeIds={lockedShapeIds}
                            selectedShapeIds={selectedShapeIds}
                            onSelectShape={onSelectShape}
                            onDeleteShape={onDeleteShape}
                            onMoveShape={onMoveShape}
                            onUpdateShape={onUpdateShape}
                            onReorderShape={onReorderShape}
                            showTkinterNames={showTkinterNames}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onMoveToLayer={onMoveToLayer}
                            onSetActiveLayer={onSetActiveLayer}
                            onLayerWarning={onLayerWarning}
                            ignoreHiddenWarningForLayer={ignoreHiddenWarningForLayer}
                        />
                    </div>
                ) : (
                    <div className="h-full overflow-hidden flex flex-col">
                        <LayerList
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onAddLayer={onAddLayer}
                            onDeleteLayer={onDeleteLayer}
                            onClearLayer={onClearLayer}
                            onToggleVisibility={onToggleLayerVisibility}
                            onToggleLock={onToggleLayerLock}
                            onSetActiveLayer={onSetActiveLayer}
                            onUpdateLayerName={onUpdateLayerName}
                            onMoveLayer={onMoveLayer}
                            shapes={shapes}
                            canvasWidth={canvasWidth}
                            canvasHeight={canvasHeight}
                            canvasBgColor={canvasBgColor}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileLayersSheet;
