import React, { useState } from 'react';
import { Layer, Shape } from '../types';
import { EyeIcon, EyeOffIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, LockIcon, UnlockIcon, EraserIcon } from './icons';
import { useLanguage } from './LanguageContext';
import ConfirmationModal from './ConfirmationModal';

interface LayerListProps {
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onClearLayer?: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onSetActiveLayer: (id: string) => void;
    onUpdateLayerName: (id: string, newName: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
    shapes: Shape[];
    canvasWidth: number;
    canvasHeight: number;
    canvasBgColor?: string;
}

function LayerThumbnail({ shapes, canvasWidth, canvasHeight, layerShapes, canvasBgColor }: { shapes: Shape[], canvasWidth: number, canvasHeight: number, layerShapes: string[], canvasBgColor?: string }) {
    const allIdsSet = new Set<string>();
    const collect = (id: string) => {
        if (!id) return;
        allIdsSet.add(id);
        const shape = shapes.find(s => s.id === id);
        if (shape && shape.type === 'group' && shape.shapeIds) {
            shape.shapeIds.forEach(collect);
        }
    };
    layerShapes.forEach(collect);

    const uniqueIds = Array.from(allIdsSet);

    return (
        <div 
            className="w-8 h-8 shrink-0 border border-[var(--border-color)] rounded overflow-hidden flex items-center justify-center pointer-events-none relative shadow-sm" 
            style={{ backgroundColor: canvasBgColor || '#ffffff' }}
            title="Мініатюра шару"
        >
            <svg 
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} 
                preserveAspectRatio="xMidYMid meet" 
                className="w-full h-full opacity-80"
                style={{ pointerEvents: 'none' }}
            >
                {/* Use shapes rendered by the Canvas. Make sure the Canvas component has corresponding ids. */}
                {uniqueIds.map(id => (
                    <use key={id} href={`#shape-render-${id}`} />
                ))}
            </svg>
        </div>
    );
}

export default function LayerList({ layers, activeLayerId, onAddLayer, onDeleteLayer, onClearLayer, onToggleVisibility, onToggleLock, onSetActiveLayer, onUpdateLayerName, onMoveLayer, shapes, canvasWidth, canvasHeight, canvasBgColor }: LayerListProps) {
    const { t } = useLanguage();
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>('');
    const [layerToClear, setLayerToClear] = useState<Layer | null>(null);

    const startEditing = (layer: Layer) => {
        setEditingLayerId(layer.id);
        setEditName(layer.name || '');
    };

    const finishEditing = () => {
        if (editingLayerId && editName && editName.trim()) {
            const trimmedName = editName.trim();
            const currentLayer = layers.find(l => l.id === editingLayerId);
            
            if (trimmedName !== currentLayer?.name) {
                if (layers.some(l => l.name === trimmedName && l.id !== editingLayerId)) {
                    alert(t('layer.duplicateName') || 'Шар з такою назвою вже існує. Будь ласка, виберіть іншу назву.');
                    return; // Keep editing mode open
                }
                onUpdateLayerName(editingLayerId, trimmedName);
            }
        }
        setEditingLayerId(null);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-primary)]">
            <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 border-b border-[var(--border-primary)] flex-shrink-0">
                <span className="font-semibold text-sm text-[var(--text-primary)]">{t('layer.title') || 'Шари'}</span>
                <button 
                    onClick={onAddLayer}
                    className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    title={t('layer.add') || 'Додати шар'}
                >
                    +
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {layers.map((layer, index) => {
                    const isLayerEmpty = !layer.shapeIds || layer.shapeIds.length === 0;
                    const canClear = !layer.locked && !isLayerEmpty;

                    return (
                        <div 
                            key={layer.id} 
                            className={`flex items-center gap-2 p-2 border-b border-[var(--border-color)] cursor-pointer ${activeLayerId === layer.id ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}
                            onClick={() => onSetActiveLayer(layer.id)}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                                className="p-1"
                                title={layer.visible ? (t('layer.hide') || 'Приховати') : (t('layer.show') || 'Показати')}
                            >
                                {layer.visible ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                                className="p-1"
                                title={layer.locked ? (t('layer.unlock') || 'Розблокувати') : (t('layer.lock') || 'Заблокувати')}
                            >
                                {layer.locked ? <LockIcon size={16} /> : <UnlockIcon size={16} />}
                            </button>
                            
                            <LayerThumbnail shapes={shapes} canvasWidth={canvasWidth} canvasHeight={canvasHeight} layerShapes={layer.shapeIds} canvasBgColor={canvasBgColor} />
                            
                            {editingLayerId === layer.id ? (
                                <input 
                                    autoFocus
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onBlur={finishEditing}
                                    onKeyDown={e => e.key === 'Enter' && finishEditing()}
                                    className="flex-1 min-w-0 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded px-1 text-sm"
                                />
                            ) : (
                                <span 
                                    className="flex-1 truncate text-sm"
                                    onDoubleClick={(e) => { e.stopPropagation(); startEditing(layer); }}
                                >
                                    {layer.name}
                                </span>
                            )}

                            <div className="flex flex-col gap-0">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                                    disabled={index === 0}
                                    className="disabled:opacity-30 hover:bg-black/10 rounded"
                                >
                                    <ArrowUpIcon size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                                    disabled={index === layers.length - 1}
                                    className="disabled:opacity-30 hover:bg-black/10 rounded"
                                >
                                    <ArrowDownIcon size={12} />
                                </button>
                            </div>
                            
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (canClear) {
                                        setLayerToClear(layer); 
                                    }
                                }}
                                disabled={!canClear}
                                className="p-1 disabled:opacity-30 disabled:cursor-not-allowed hover:text-amber-500 transition-colors"
                                title={layer.locked ? (t('layer.lockedCannotClear') || 'Заблокований шар не можна очистити') : (t('layer.clear') || 'Очистити шар')}
                            >
                                <EraserIcon size={16} />
                            </button>

                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                                disabled={layers.length <= 1}
                                className="p-1 disabled:opacity-30 hover:text-red-500"
                                title={t('layer.delete') || 'Видалити шар'}
                            >
                                <TrashIcon size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {layerToClear && (
                <ConfirmationModal
                    isOpen={!!layerToClear}
                    onClose={() => setLayerToClear(null)}
                    onConfirm={() => {
                        if (layerToClear && onClearLayer) {
                            onClearLayer(layerToClear.id);
                        }
                        setLayerToClear(null);
                    }}
                    title={t('layer.clearConfirmTitle') || 'Очищення шару'}
                    message={(t('layer.clearConfirmText') || 'Ви впевнені, що хочете видалити всі об\'єкти з шару "{name}"? Сам шар залишиться.').replace('{name}', layerToClear.name)}
                    confirmText={t('layer.clear') || 'Очистити'}
                    cancelText={t('action.cancel') || 'Скасувати'}
                    variant="destructive"
                />
            )}
        </div>
    );
}
