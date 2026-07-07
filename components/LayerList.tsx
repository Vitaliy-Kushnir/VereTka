import React, { useState } from 'react';
import { Layer } from '../types';
import { EyeIcon, EyeOffIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, LockIcon, UnlockIcon } from './icons';
import { useLanguage } from './LanguageContext';

interface LayerListProps {
    layers: Layer[];
    activeLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onSetActiveLayer: (id: string) => void;
    onUpdateLayerName: (id: string, newName: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export default function LayerList({ layers, activeLayerId, onAddLayer, onDeleteLayer, onToggleVisibility, onToggleLock, onSetActiveLayer, onUpdateLayerName, onMoveLayer }: LayerListProps) {
    const { t } = useLanguage();
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const startEditing = (layer: Layer) => {
        setEditingLayerId(layer.id);
        setEditName(layer.name);
    };

    const finishEditing = () => {
        if (editingLayerId && editName.trim()) {
            onUpdateLayerName(editingLayerId, editName.trim());
        }
        setEditingLayerId(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-2 border-b border-[var(--border-color)]">
                <span className="font-medium text-sm text-[var(--text-primary)]">{t('layer.title') || 'Шари'}</span>
                <button 
                    onClick={onAddLayer}
                    className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    title={t('layer.add') || 'Додати шар'}
                >
                    +
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {layers.map((layer, index) => (
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
                            onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                            disabled={layers.length <= 1}
                            className="p-1 disabled:opacity-30 hover:text-red-500"
                            title={t('layer.delete') || 'Видалити шар'}
                        >
                            <TrashIcon size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
