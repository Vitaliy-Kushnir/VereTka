import React, { useState } from 'react';
import { Shape, Tool, PolylineShape } from '../types';
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, SquareIcon, CircleIcon, LineIcon, EllipseIcon, PencilIcon, TriangleIcon, PolygonIcon, StarIcon, SelectIcon, EditPointsIcon, PolylineIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, BezierIcon, RectangleIcon, ArcIcon, PiesliceIcon, ChordIcon, RightTriangleIcon, EyeIcon, EyeOffIcon, TextIcon, ImageIcon, BitmapIcon } from './icons';
import { getDefaultNameForShape, getTkinterType } from '../lib/constants';
import { isPolylineAxisAlignedRectangle } from '../lib/geometry';

interface ShapeListProps {
  shapes: Shape[];
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
  onDeleteShape: (id: string) => void;
  onMoveShape: (id: string, direction: 'up' | 'down') => void;
  onUpdateShape: (shape: Shape) => void;
  onReorderShape: (draggedId: string, targetId: string, position: 'top' | 'bottom') => void;
  showTkinterNames: boolean;
}

const toolToIcon: Record<Tool, React.ReactNode> = {
    'select': <SelectIcon />,
    'edit-points': <EditPointsIcon />,
    'rectangle': <RectangleIcon />,
    'square': <SquareIcon />,
    'circle': <CircleIcon />,
    'ellipse': <EllipseIcon />,
    'line': <LineIcon />,
    'bezier': <BezierIcon />,
    'pencil': <PencilIcon />,
    'triangle': <TriangleIcon />,
    'right-triangle': <RightTriangleIcon />,
    'polygon': <PolygonIcon />,
    'star': <StarIcon />,
    'polyline': <PolylineIcon />,
    'rhombus': <RhombusIcon />,
    'trapezoid': <TrapezoidIcon />,
    'parallelogram': <ParallelogramIcon />,
    'arc': <ArcIcon />,
    'pieslice': <PiesliceIcon />,
    'chord': <ChordIcon />,
    'text': <TextIcon />,
    'image': <ImageIcon />,
    'bitmap': <BitmapIcon />,
}

// Helper moved outside the component for better performance
const getIconForShape = (s: Shape): React.ReactNode => {
    if (s.type === 'arc') {
        return toolToIcon[s.style];
    }
    if (s.type === 'rectangle' && s.isAspectRatioLocked) {
        return toolToIcon['square'];
    }
    // If the shape is a closed polyline or bezier, show the polygon icon.
    if ((s.type === 'polyline' || s.type === 'bezier') && s.isClosed) {
        return toolToIcon['polygon'];
    }
    return toolToIcon[s.type];
};

const ShapeList: React.FC<ShapeListProps> = ({ shapes, selectedShapeId, onSelectShape, onDeleteShape, onMoveShape, onUpdateShape, onReorderShape, showTkinterNames }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

    const handleStartEditing = (shape: Shape) => {
        setEditingId(shape.id);
        setEditingValue(shape.name || getDefaultNameForShape(shape));
    };

    const handleFinishEditing = () => {
        if (editingId) {
            const shape = shapes.find(s => s.id === editingId);
            if (shape && editingValue.trim() !== '') {
                onUpdateShape({ ...shape, name: editingValue.trim() });
            }
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFinishEditing();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };
    
    const handleToggleVisibility = (e: React.MouseEvent, shape: Shape) => {
        e.stopPropagation();
        const newState = shape.state === 'hidden' ? 'normal' : 'hidden';
        onUpdateShape({ ...shape, state: newState });
    };

    const handleDragStart = (e: React.DragEvent, shapeId: string) => {
        setDraggedId(shapeId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', shapeId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLIElement>, shapeId: string) => {
        e.preventDefault();
        if (shapeId === draggedId) return;
        setDragOverId(shapeId);
        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDropPosition(e.clientY < midpoint ? 'top' : 'bottom');
    };

    const handleDragLeave = () => {
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
        e.preventDefault();
        if (draggedId && draggedId !== targetId && dropPosition) {
            onReorderShape(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

  return (
    <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)]">
        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">Об'єкти</h2>
        </div>
        <div className="flex-grow overflow-y-auto">
            {shapes.length > 0 ? (
                <ul className="p-1 space-y-1">
                    {[...shapes].reverse().map((shape, index) => {
                        if (!shape) return null;
                        const isSelected = shape.id === selectedShapeId;
                        const isEditing = editingId === shape.id;
                        const originalIndex = shapes.length - 1 - index;
                        const canMoveUp = originalIndex < shapes.length - 1;
                        const canMoveDown = originalIndex > 0;
                        const defaultName = getDefaultNameForShape(shape);
                        const isDragOverTop = dragOverId === shape.id && dropPosition === 'top';
                        const isDragOverBottom = dragOverId === shape.id && dropPosition === 'bottom';
                        
                        return (
                            <li
                                key={shape.id}
                                onClick={() => onSelectShape(shape.id)}
                                onDoubleClick={() => handleStartEditing(shape)}
                                draggable={!isEditing}
                                onDragStart={isEditing ? undefined : (e) => handleDragStart(e, shape.id)}
                                onDragOver={isEditing ? undefined : (e) => handleDragOver(e, shape.id)}
                                onDragLeave={isEditing ? undefined : handleDragLeave}
                                onDrop={isEditing ? undefined : (e) => handleDrop(e, shape.id)}
                                onDragEnd={isEditing ? undefined : handleDragEnd}
                                className={`group flex items-center justify-between p-2 rounded-md transition-all duration-150 cursor-pointer 
                                    ${isSelected ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}
                                    ${draggedId === shape.id ? 'opacity-30' : ''}
                                    ${isDragOverTop ? 'border-t-2 border-[var(--selection-stroke)]' : 'border-t-2 border-transparent -mb-0.5'}
                                    ${isDragOverBottom ? 'border-b-2 border-[var(--selection-stroke)]' : 'border-b-2 border-transparent -mt-0.5'}
                                `}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <button onClick={(e) => handleToggleVisibility(e, shape)} title={shape.state === 'hidden' ? 'Показати' : 'Приховати'} className="flex-shrink-0 p-1 rounded hover:bg-[var(--bg-hover)]">
                                        {shape.state === 'hidden' ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center" style={{ opacity: shape.state === 'hidden' ? 0.5 : 1 }}>
                                        {getIconForShape(shape)}
                                    </div>
                                    <div className="truncate text-sm" style={{ opacity: shape.state === 'hidden' ? 0.5 : 1 }}>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editingValue}
                                                onChange={e => setEditingValue(e.target.value)}
                                                onBlur={handleFinishEditing}
                                                onKeyDown={handleKeyDown}
                                                onClick={e => e.stopPropagation()}
                                                autoFocus
                                                className="bg-[var(--bg-app)]/80 text-[var(--text-primary)] p-0.5 -m-0.5 rounded outline-none ring-2 ring-[var(--accent-primary)] w-full"
                                            />
                                        ) : (
                                            <span className="truncate" title={shape.name || defaultName}>
                                                {shape.name || defaultName}
                                                {showTkinterNames && (
                                                    <span className="ml-1 text-xs text-[var(--text-tertiary)]">
                                                        [{getTkinterType(shape)}]
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-0.5 transition-opacity ${isSelected && !isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMoveShape(shape.id, 'up'); }}
                                        disabled={!canMoveUp}
                                        title="Перемістити вище"
                                        className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                                    ><ArrowUpIcon /></button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onMoveShape(shape.id, 'down'); }}
                                        disabled={!canMoveDown}
                                        title="Перемістити нижче"
                                        className="p-1 rounded hover:bg-[var(--bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
                                    ><ArrowDownIcon /></button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }}
                                        title="Видалити"
                                        className="p-1 rounded text-[var(--destructive-text)] hover:bg-[var(--destructive-bg)] hover:text-[var(--accent-text)]"
                                    ><TrashIcon size={16} /></button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="text-center text-[var(--text-tertiary)] py-8 px-4">
                    <p className="text-sm">Немає об'єктів.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ShapeList;
