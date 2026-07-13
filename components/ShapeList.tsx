
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Shape, Tool, PolylineShape, DistributePathState, Layer } from '../types';
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, SquareIcon, CircleIcon, LineIcon, EllipseIcon, PencilIcon, TriangleIcon, PolygonIcon, StarIcon, SelectIcon, EditPointsIcon, PolylineIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, BezierIcon, RectangleIcon, ArcIcon, PiesliceIcon, ChordIcon, RightTriangleIcon, EyeIcon, EyeOffIcon, TextIcon, ImageIcon, BitmapIcon, LocateIcon, LockIcon, ChevronDownIcon, ChevronRightIcon } from './icons';
import { getDefaultNameForShape, getTkinterType, isDefaultName } from '../lib/constants';
import { isPolylineAxisAlignedRectangle } from '../lib/geometry';
import { useLanguage } from './LanguageContext';

interface ShapeListProps {
  distributePathState?: DistributePathState | null;
  shapes: Shape[];
  layers: Layer[];
  activeLayerId: string | null;
  lockedShapeIds: Set<string>;
  selectedShapeIds: string[];
  onSelectShape: (id: string | null, isCtrlPressed?: boolean, isShiftPressed?: boolean, ignoreGroup?: boolean) => void;
  onDeleteShape: (id: string) => void;
  onMoveShape: (id: string, direction: 'up' | 'down') => void;
  onUpdateShape: (shape: Shape) => void;
  onReorderShape: (draggedId: string, targetId: string, position: 'top' | 'bottom') => void;
  onMoveToLayer: (shapeId: string, layerId: string) => void;
  onSetActiveLayer: (layerId: string) => void;
  showTkinterNames: boolean;
}

const toolToIcon: Record<Tool | 'group', React.ReactNode> = {
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
    'group': <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
}

// Helper moved outside the component for better performance
const getIconForShape = (s: Shape): React.ReactNode => {
    if (s.type === 'arc') {
        return toolToIcon[s.style as Tool];
    }
    if (s.type === 'rectangle' && s.isAspectRatioLocked) {
        return toolToIcon['square'];
    }
    // If the shape is a closed polyline or bezier, show the polygon icon.
    if ((s.type === 'polyline' || s.type === 'bezier') && s.isClosed) {
        return toolToIcon['polygon'];
    }
    return toolToIcon[s.type as Tool | 'group'];
};

const ShapeNameDisplay = ({ isSelected, shapeName, showTkinterNames, tkinterName, fullTitle }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    useEffect(() => {
        if (containerRef.current && textRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            const textWidth = textRef.current.scrollWidth;
            setShouldScroll(textWidth > containerWidth);
            if (textWidth > containerWidth) {
                textRef.current.style.setProperty('--container-width', `${containerWidth}px`);
            }
        }
    }, [isSelected, shapeName, tkinterName, showTkinterNames]);

    return (
        <div ref={containerRef} className="overflow-hidden whitespace-nowrap" title={fullTitle}>
            <div 
                ref={textRef} 
                className={`inline-block font-medium ${isSelected && shouldScroll ? 'scroll-text-hover' : 'truncate'} w-full`}
            >
                {shapeName}
                {showTkinterNames && (
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-1 font-mono">
                        {tkinterName}
                    </span>
                )}
            </div>
        </div>
    );
};

const ShapeList: React.FC<ShapeListProps> = ({ distributePathState, shapes, layers, activeLayerId, lockedShapeIds, selectedShapeIds, onSelectShape, onDeleteShape, onMoveShape, onUpdateShape, onReorderShape, onMoveToLayer, onSetActiveLayer, showTkinterNames }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);
    const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const { t } = useLanguage();
    
    const listContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const [isSelectedItemVisible, setIsSelectedItemVisible] = useState(true);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
    const [scrollFix, setScrollFix] = useState<{ id: string, clientY: number } | null>(null);

    useLayoutEffect(() => {
        if (scrollFix && listContainerRef.current) {
            const item = itemRefs.current[scrollFix.id];
            if (item) {
                const currentY = item.getBoundingClientRect().top;
                const diff = currentY - scrollFix.clientY;
                if (diff !== 0) {
                    listContainerRef.current.scrollTop += diff;
                }
            }
            setScrollFix(null);
        }
    }, [shapes, scrollFix]);

    const handleMoveShape = (e: React.MouseEvent, id: string, direction: 'up' | 'down') => {
        e.stopPropagation();
        if (listContainerRef.current) {
            const item = itemRefs.current[id];
            if (item) {
                setScrollFix({ id, clientY: item.getBoundingClientRect().top });
            }
        }
        onMoveShape(id, direction);
    };

    const firstSelectedId = selectedShapeIds.length > 0 ? selectedShapeIds[0] : null;

    const scrollToSelected = () => {
        if (firstSelectedId) {
            const selectedItem = itemRefs.current[firstSelectedId];
            selectedItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    useEffect(() => {
        if (isAutoScrollEnabled && firstSelectedId) {
            // Adding a small timeout to allow the DOM to potentially update
            // if the selection change caused a re-render.
            const timer = setTimeout(() => {
                scrollToSelected();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [firstSelectedId, isAutoScrollEnabled]);

    useEffect(() => {
        const container = listContainerRef.current;
        if (!container) return;

        const checkVisibility = () => {
            if ((selectedShapeIds.length === 0) || !firstSelectedId) {
                setIsSelectedItemVisible(true);
                return;
            }
            
            const selectedItem = itemRefs.current[firstSelectedId];
            if (!selectedItem) {
                setIsSelectedItemVisible(true);
                return;
            }

            const containerRect = container.getBoundingClientRect();
            const itemRect = (selectedItem as HTMLElement).getBoundingClientRect();
            
            const isVisible = itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;
            
            setIsSelectedItemVisible(isVisible);
        };

        checkVisibility();

        container.addEventListener('scroll', checkVisibility, { passive: true });
        const resizeObserver = new ResizeObserver(checkVisibility);
        resizeObserver.observe(container);

        return () => {
            container.removeEventListener('scroll', checkVisibility);
            resizeObserver.disconnect();
        };
    }, [selectedShapeIds, shapes]);

    const handleStartEditing = (shape: Shape) => {
        setEditingId(shape.id);
        setEditingValue(shape.name || getDefaultNameForShape(shape, t));
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
        
        // Create a custom drag image (ghost)
        const li = e.currentTarget as HTMLLIElement;
        // clone it to remove the "dragging" opacity effect from the ghost image immediately
        const clone = li.cloneNode(true) as HTMLElement;
        clone.style.backgroundColor = 'var(--bg-secondary)';
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        clone.style.width = `${li.offsetWidth}px`;
        clone.style.opacity = '1';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, 10, 10);
        setTimeout(() => document.body.removeChild(clone), 0);
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

    const renderShapeItem = (shape: Shape, index: number, originalIndex: number, level: number = 0, isLayerVisible: boolean = true, isLastChild: boolean = false) => {
        if (!shape) return null;
        const isDistributing = distributePathState?.entities.some(e => e.ids.includes(shape.id)) ?? false;
        const isSelected = selectedShapeIds.includes(shape.id);
        const isEditing = editingId === shape.id;
        
        let canMoveUp = originalIndex < shapes.length - 1;
        let canMoveDown = originalIndex > 0;
        let isParentSelected = false;
        if (shape.groupId) {
            isParentSelected = selectedShapeIds.includes(shape.groupId);
            const group = shapes.find(s => s.id === shape.groupId);
            if (group && group.type === 'group' && group.shapeIds) {
                const groupChildren = shapes.filter(s => group.shapeIds!.includes(s.id));
                const childIndexInGroup = groupChildren.findIndex(s => s.id === shape.id);
                canMoveUp = childIndexInGroup < groupChildren.length - 1;
                canMoveDown = childIndexInGroup > 0;
            }
        }
        
        const defaultName = getDefaultNameForShape(shape, t);
        const isDragOverTop = dragOverId === shape.id && dropPosition === 'top';
        const isDragOverBottom = dragOverId === shape.id && dropPosition === 'bottom';
        const shapeName = !isDefaultName(shape.name || '') ? shape.name : defaultName;
        const tkinterName = showTkinterNames ? `[${getTkinterType(shape).toLowerCase()}]` : '';
        const fullTitle = `${shapeName} ${tkinterName}`.trim();
        const isLocked = lockedShapeIds.has(shape.id);
        
        return (
            <li
                ref={(el) => { itemRefs.current[shape.id] = el; }}
                key={shape.id}
                onClick={(e) => {
                    if (isLocked) return;
                    
                    if (shape.type === 'group' && e.shiftKey) {
                        // User specifically requested: selecting all child shapes in a group by clicking in the list on the row with the group name with the SHIFT key pressed.
                        if (shape.shapeIds && shape.shapeIds.length > 0) {
                            onSelectShape(shape.shapeIds, e.ctrlKey || e.metaKey, false, true);
                        }
                        return;
                    }
                    
                    const isAlreadySelected = selectedShapeIds.includes(shape.id) || (shape.groupId && selectedShapeIds.includes(shape.groupId));
                    const ignoreGroup = !!isAlreadySelected || e.ctrlKey || e.metaKey || e.shiftKey;
                    onSelectShape(shape.id, e.ctrlKey || e.metaKey, e.shiftKey, ignoreGroup);
                }}
                onDoubleClick={() => !isLocked && handleStartEditing(shape)}
                draggable={!isEditing && !isLocked}
                onDragStart={isEditing ? undefined : (e) => handleDragStart(e, shape.id)}
                onDragOver={isEditing ? undefined : (e) => handleDragOver(e, shape.id)}
                onDragLeave={isEditing ? undefined : handleDragLeave}
                onDrop={isEditing ? undefined : (e) => handleDrop(e, shape.id)}
                onDragEnd={isEditing ? undefined : handleDragEnd}
                className={`group flex flex-col p-0 rounded-md transition-all duration-150 relative
                    ${draggedId === shape.id ? 'opacity-30' : ''}
                `}
            >
                <div className={`flex items-center justify-between py-0.5 px-1.5 rounded-md cursor-pointer ${isSelected ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : isDistributing ? 'bg-amber-500/80 text-white outline outline-1 outline-amber-600' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                    {/* Drop Insertion Indicators */}
                    {isDragOverTop && (
                        <div className="absolute -top-[3px] left-0 right-0 h-[3px] bg-[var(--selection-stroke)] rounded-full shadow-[0_0_4px_var(--selection-stroke)] z-50 pointer-events-none animate-pulse"></div>
                    )}
                    {isDragOverBottom && (
                        <div className="absolute -bottom-[3px] left-0 right-0 h-[3px] bg-[var(--selection-stroke)] rounded-full shadow-[0_0_4px_var(--selection-stroke)] z-50 pointer-events-none animate-pulse"></div>
                    )}

                    {level > 0 && (
                        <>
                            {/* Shelf (T-cap) at the top of the group */}
                            {index === 0 && (
                                <div className={`absolute left-[-12px] top-[-2px] w-[8px] h-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                            )}
                            
                            {/* Vertical line */}
                            {!isLastChild ? (
                                /* Full vertical line for non-last children */
                                <div className={`absolute left-[-9px] top-[-2px] bottom-[-2px] w-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                            ) : (
                                /* Half vertical line for last child */
                                <div className={`absolute left-[-9px] top-[-2px] bottom-[calc(50%-1px)] w-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                            )}

                            {/* Horizontal dash to child */}
                            <div className={`absolute left-[-9px] top-[calc(50%-1px)] w-[9px] h-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                        </>
                    )}

                    <div className="flex items-center gap-2 overflow-hidden flex-1 relative z-10">
                        {shape.type === 'group' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCollapsedGroups(prev => {
                                        const next = new Set(prev);
                                        if (next.has(shape.id)) next.delete(shape.id);
                                        else next.add(shape.id);
                                        return next;
                                    });
                                }}
                                className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {collapsedGroups.has(shape.id) ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                            </button>
                        )}
                        <button onClick={(e) => handleToggleVisibility(e, shape)} title={shape.state === 'hidden' ? t('list.visibility.show') : t('list.visibility.hide')} className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)]">
                            {shape.state === 'hidden' ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                        </button>
                        <div className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center" style={{ opacity: (!isLayerVisible || shape.state === 'hidden') ? 0.5 : 1 }}>
                            {getIconForShape(shape)}
                        </div>
                        {isLocked && <div className="flex-shrink-0 text-[var(--text-secondary)]"><LockIcon size={12} /></div>}
                        <div className="overflow-hidden flex-1 text-sm flex items-center gap-1" style={{ opacity: (!isLayerVisible || shape.state === 'hidden') ? 0.5 : 1 }}>
                            {!isLayerVisible && <span className="text-[10px] text-amber-500 font-bold leading-none" title={t('list.layerHidden') || 'Шар прихований'}>[H]</span>}
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    onBlur={handleFinishEditing}
                                    onKeyDown={handleKeyDown}
                                    onClick={e => e.stopPropagation()}
                                    autoFocus
                                    className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] px-1 py-0.5 rounded outline-none focus:ring-1 focus:ring-[var(--accent-primary)] border border-[var(--border-primary)]"
                                />
                            ) : (
                                <ShapeNameDisplay 
                                    isSelected={isSelected}
                                    shapeName={shapeName}
                                    showTkinterNames={showTkinterNames}
                                    tkinterName={tkinterName}
                                    fullTitle={fullTitle}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ArrowUpIcon size={12} />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ArrowDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} disabled={!!distributePathState} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>
                </div>
            </li>
        );
    };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('list.title')}</h2>
            <div className="flex items-center gap-3">
                <button
                    onClick={scrollToSelected}
                    disabled={(selectedShapeIds.length === 0) || isSelectedItemVisible || isAutoScrollEnabled}
                    title={
                        isAutoScrollEnabled 
                            ? t('list.autoscroll.on')
                            : (selectedShapeIds.length === 0) 
                                ? t('list.autoscroll.noSelection')
                                : isSelectedItemVisible 
                                    ? t('list.autoscroll.visible')
                                    : t('list.autoscroll.scroll')
                    }
                    className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[var(--text-tertiary)]"
                >
                    <LocateIcon size={14} />
                    <span>{t('list.find')}</span>
                </button>
                <label 
                    className="flex items-center cursor-pointer select-none"
                    title={t('list.autoscroll.toggle')}
                >
                    <input
                        type="checkbox"
                        checked={isAutoScrollEnabled}
                        onChange={(e) => setIsAutoScrollEnabled(e.target.checked)}
                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-app)] focus:ring-[var(--accent-primary)] bg-[var(--bg-secondary)] border-[var(--border-primary)]"
                    />
                </label>
            </div>
        </div>
        <div className="flex-grow overflow-hidden relative">
            <div ref={listContainerRef} className="h-full overflow-y-auto">
                {shapes.length > 0 ? (
                    <div className="p-1 space-y-2">
                        {layers.map((layer, lIndex) => {
                            const layerShapes = layer.shapeIds.map(id => shapes.find(s => s.id === id)).filter(s => s) as Shape[];
                            const isDragOverLayer = dragOverId === layer.id;

                            return (
                                <div key={layer.id} className="flex flex-col">
                                    <div 
                                        className={`px-2 py-1 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-hover)]'} ${isDragOverLayer ? 'bg-[var(--accent-primary)]/20 outline outline-1 outline-[var(--accent-primary)]' : ''}`}
                                        onClick={() => onSetActiveLayer(layer.id)}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverId(layer.id);
                                            setDropPosition(null);
                                        }}
                                        onDragLeave={() => {
                                            if (dragOverId === layer.id) setDragOverId(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            if (draggedId) {
                                                onMoveToLayer(draggedId, layer.id);
                                            }
                                            setDragOverId(null);
                                            setDraggedId(null);
                                        }}
                                        onDoubleClick={(e) => {
                                            e.stopPropagation();
                                            setCollapsedLayers(prev => {
                                                const next = new Set(prev);
                                                if (next.has(layer.id)) next.delete(layer.id);
                                                else next.add(layer.id);
                                                return next;
                                            });
                                        }}
                                    >
                                        <div className="flex items-center gap-1">
                                            <button 
                                                className="p-0.5 rounded hover:bg-[var(--bg-app)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCollapsedLayers(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(layer.id)) next.delete(layer.id);
                                                        else next.add(layer.id);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {collapsedLayers.has(layer.id) ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} />}
                                            </button>
                                            <span className="flex items-center gap-1">
                                                {layer.name}
                                                {!layer.visible && <span className="text-[10px] text-amber-500 font-normal leading-none tracking-normal capitalize" title={t('list.layerHidden') || 'Шар прихований'}>Прихований [H]</span>}
                                            </span>
                                        </div>
                                        {activeLayerId === layer.id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></span>}
                                    </div>
                                    {!collapsedLayers.has(layer.id) && (
                                        <ul className={`space-y-0.5 pt-0.5 mt-0 ml-1 border-l-2 ${activeLayerId === layer.id ? 'border-[var(--accent-primary)]' : 'border-[var(--text-tertiary)]'} relative z-0`}>
                                        {[...layerShapes].reverse().map((shape, index) => {
                                            if (!shape) return null;
                                            if (shape.groupId) return null; // Skip children of groups
                                            
                                            const originalIndex = shapes.findIndex(s => s.id === shape.id);
                                            const el = renderShapeItem(shape, index, originalIndex, 0, layer.visible);
                                            if (shape.type === 'group') {
                                                const children = layerShapes.filter(s => shape.shapeIds?.includes(s.id)).reverse();
                                                return (
                                                    <React.Fragment key={shape.id}>
                                                        {el}
                                                        {!collapsedGroups.has(shape.id) && (
                                                            <ul className="ml-[14px] pl-2 space-y-0.5 pt-0 mt-0 relative z-0">
                                                                {children.map((child, cIdx) => {
                                                                    const cOriginalIndex = shapes.findIndex(s => s.id === child.id);
                                                                    const isLastChild = cIdx === children.length - 1;
                                                                    return renderShapeItem(child, cIdx, cOriginalIndex, 1, layer.visible, isLastChild);
                                                                })}
                                                            </ul>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            }
                                            return el;
                                        })}
                                        {layerShapes.length === 0 && (
                                            <li className="text-xs text-[var(--text-tertiary)] italic px-3 py-1">
                                                {t('list.emptyLayer') || 'Порожній шар'}
                                            </li>
                                        )}
                                    </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-[var(--text-tertiary)] py-8 px-4">
                        <p className="text-sm">{t('list.empty')}</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ShapeList;
