
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion } from 'motion/react';
import { Shape, Tool, PolylineShape, DistributePathState, Layer } from '../types';
import { ArrowUpIcon, ArrowDownIcon, TrashIcon, SquareIcon, CircleIcon, LineIcon, EllipseIcon, PencilIcon, TriangleIcon, PolygonIcon, StarIcon, SelectIcon, SelectOffIcon, EditPointsIcon, PolylineIcon, RhombusIcon, TrapezoidIcon, ParallelogramIcon, BezierIcon, RectangleIcon, ArcIcon, PiesliceIcon, ChordIcon, RightTriangleIcon, EyeIcon, EyeOffIcon, TextIcon, ImageIcon, BitmapIcon, LocateIcon, LockIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon } from './icons';
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
  onSelectShape: (id: string | string[] | null, isCtrlPressed?: boolean, isShiftPressed?: boolean, ignoreGroup?: boolean) => void;
  onDeleteShape: (id: string) => void;
  onMoveShape: (id: string, direction: 'up' | 'down') => void;
  onUpdateShape: (shape: Shape) => void;
  onReorderShape: (draggedId: string, targetId: string, position: 'top' | 'bottom' | 'inside') => void;
  onMoveToLayer: (shapeId: string, layerId: string) => void;
  onSetActiveLayer: (layerId: string) => void;
  showTkinterNames: boolean;
  onLayerWarning?: (reason: 'hidden' | 'locked', layerId: string, action?: () => void) => void;
  ignoreHiddenWarningForLayer?: string | null;
  isMultiSelectMode?: boolean;
  setIsMultiSelectMode?: (val: boolean) => void;
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
};

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

const ShapeList: React.FC<ShapeListProps> = ({ 
    distributePathState, 
    shapes, 
    layers, 
    activeLayerId, 
    lockedShapeIds, 
    selectedShapeIds, 
    onSelectShape, 
    onDeleteShape, 
    onMoveShape, 
    onUpdateShape, 
    onReorderShape, 
    onMoveToLayer, 
    onSetActiveLayer, 
    showTkinterNames, 
    onLayerWarning, 
    ignoreHiddenWarningForLayer,
    isMultiSelectMode = false,
    setIsMultiSelectMode
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'inside' | null>(null);
    const [touchDraggedId, setTouchDraggedId] = useState<string | null>(null);
    const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const { t } = useLanguage();
    
    const listContainerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
    const [isSelectedItemVisible, setIsSelectedItemVisible] = useState(true);
    const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(false);
    const [scrollFix, setScrollFix] = useState<{ id: string, clientY: number } | null>(null);

    // Touch grab & drag-to-reorder state
    const touchDragStateRef = useRef<{
        shapeId: string;
        startX: number;
        startY: number;
        isDragging: boolean;
    } | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isLongPressTriggeredRef = useRef<boolean>(false);

    const handleItemTouchStart = (e: React.TouchEvent, shapeId: string) => {
        if (lockedShapeIds.has(shapeId) || editingId) return;
        const touch = e.touches[0];
        touchDragStateRef.current = {
            shapeId,
            startX: touch.clientX,
            startY: touch.clientY,
            isDragging: false
        };
        isLongPressTriggeredRef.current = false;

        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            if (!touchDragStateRef.current) return;
            touchDragStateRef.current.isDragging = true;
            isLongPressTriggeredRef.current = true;
            setTouchDraggedId(shapeId);
            setDraggedId(shapeId);

            if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                try { navigator.vibrate(50); } catch (_) {}
            }
        }, 320);
    };

    const handleItemTouchMove = (e: React.TouchEvent) => {
        if (!touchDragStateRef.current) return;
        const touch = e.touches[0];

        // If not yet dragging, check distance to cancel long press if scrolling
        if (!touchDragStateRef.current.isDragging) {
            const dist = Math.hypot(touch.clientX - touchDragStateRef.current.startX, touch.clientY - touchDragStateRef.current.startY);
            if (dist > 8) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            }
            return;
        }

        // Active touch drag in progress
        e.preventDefault();

        // Auto-scroll list if dragging near edges
        if (listContainerRef.current) {
            const containerRect = listContainerRef.current.getBoundingClientRect();
            if (touch.clientY < containerRect.top + 40) {
                listContainerRef.current.scrollTop -= 6;
            } else if (touch.clientY > containerRect.bottom - 40) {
                listContainerRef.current.scrollTop += 6;
            }
        }

        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const targetLi = elem?.closest('[data-shape-id]') as HTMLElement;
        const targetLayerElem = elem?.closest('[data-layer-id]') as HTMLElement;

        if (targetLi) {
            const targetId = targetLi.getAttribute('data-shape-id');
            if (targetId && targetId !== touchDragStateRef.current.shapeId) {
                setDragOverId(targetId);
                const rect = targetLi.getBoundingClientRect();
                const y = touch.clientY - rect.top;
                const targetShape = shapes.find(s => s.id === targetId);

                if (targetShape?.type === 'group') {
                    if (y < rect.height * 0.25) {
                        setDropPosition('top');
                    } else if (y > rect.height * 0.75) {
                        setDropPosition('bottom');
                    } else {
                        setDropPosition('inside');
                    }
                } else {
                    setDropPosition(y < rect.height * 0.5 ? 'top' : 'bottom');
                }
            }
        } else if (targetLayerElem) {
            const targetLayerId = targetLayerElem.getAttribute('data-layer-id');
            if (targetLayerId) {
                setDragOverId(targetLayerId);
                setDropPosition(null);
            }
        }
    };

    const handleItemTouchEnd = (e: React.TouchEvent) => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        if (touchDragStateRef.current?.isDragging && touchDraggedId) {
            e.preventDefault();
            e.stopPropagation();

            if (dragOverId && dragOverId !== touchDraggedId) {
                const targetLayer = layers.find(l => l.id === dragOverId || `layer-list-${l.id}` === dragOverId);
                if (targetLayer) {
                    if (targetLayer.locked) {
                        if (onLayerWarning) onLayerWarning('locked', targetLayer.id);
                    } else if (!targetLayer.visible && ignoreHiddenWarningForLayer !== targetLayer.id) {
                        if (onLayerWarning) {
                            onLayerWarning('hidden', targetLayer.id, () => {
                                onMoveToLayer(touchDraggedId, targetLayer.id);
                            });
                        }
                    } else {
                        onMoveToLayer(touchDraggedId, targetLayer.id);
                        if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                            try { navigator.vibrate(30); } catch (_) {}
                        }
                    }
                } else if (dropPosition) {
                    onReorderShape(touchDraggedId, dragOverId, dropPosition);
                    if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                        try { navigator.vibrate(30); } catch (_) {}
                    }
                }
            }

            setTouchDraggedId(null);
            setDraggedId(null);
            setDragOverId(null);
            setDropPosition(null);

            setTimeout(() => {
                isLongPressTriggeredRef.current = false;
            }, 150);
        }

        touchDragStateRef.current = null;
    };

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
            if (shape && ((editingValue) || "").trim() !== '') {
                onUpdateShape({ ...shape, name: ((editingValue) || "").trim() });
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
        const y = e.clientY - rect.top;
        const targetShape = shapes.find(s => s.id === shapeId);
        
        if (targetShape?.type === 'group') {
            if (y < rect.height * 0.25) {
                setDropPosition('top');
            } else if (y > rect.height * 0.75) {
                setDropPosition('bottom');
            } else {
                setDropPosition('inside');
            }
        } else {
            const midpoint = rect.height / 2;
            setDropPosition(y < midpoint ? 'top' : 'bottom');
        }
    };

    const handleDragLeave = (e?: React.DragEvent) => {
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const targetShape = shapes.find(s => s.id === targetId);
        const targetLayer = layers.find(l => l.shapeIds.includes(targetId));

        if (targetLayer) {
            if (targetLayer.locked) {
                if (onLayerWarning) onLayerWarning('locked', targetLayer.id);
                setDraggedId(null);
                setDragOverId(null);
                setDropPosition(null);
                return;
            }
            if (!targetLayer.visible && ignoreHiddenWarningForLayer !== targetLayer.id) {
                if (onLayerWarning) {
                    onLayerWarning('hidden', targetLayer.id, () => {
                        if (draggedId && draggedId !== targetId && dropPosition) {
                            onReorderShape(draggedId, targetId, dropPosition);
                        }
                    });
                }
                setDraggedId(null);
                setDragOverId(null);
                setDropPosition(null);
                return;
            }
        } else if (lockedShapeIds.has(targetId)) {
            const activeL = layers.find(l => l.id === activeLayerId);
            if (onLayerWarning && activeL) onLayerWarning('locked', activeL.id);
            setDraggedId(null);
            setDragOverId(null);
            setDropPosition(null);
            return;
        }

        if (draggedId && draggedId !== targetId && dropPosition) {
            onReorderShape(draggedId, targetId, dropPosition);
        }
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDragEnd = (e?: React.DragEvent) => {
        setDraggedId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const renderShapeTree = (shape: Shape, index: number, originalIndex: number, level: number = 0, isLayerVisible: boolean = true, isLastChild: boolean = false, layerShapes: Shape[] = []) => {
        let childrenNode: React.ReactNode = null;
        if (shape.type === 'group') {
            const children = layerShapes.filter(s => shape.shapeIds?.includes(s.id)).reverse();
            if (children.length > 0 && !collapsedGroups.has(shape.id)) {
                childrenNode = (
                    <ul className="ml-[14px] pl-2 space-y-0.5 pt-0 mt-0 relative z-0">
                        {children.map((child, cIdx) => {
                            const cOriginalIndex = shapes.findIndex(s => s.id === child.id);
                            const isLastChildForGroup = cIdx === children.length - 1;
                            return renderShapeTree(child, cIdx, cOriginalIndex, level + 1, isLayerVisible, isLastChildForGroup, layerShapes);
                        })}
                    </ul>
                );
            }
        }
        return renderShapeItem(shape, index, originalIndex, level, isLayerVisible, isLastChild, childrenNode);
    };

    const renderShapeItem = (shape: Shape, index: number, originalIndex: number, level: number = 0, isLayerVisible: boolean = true, isLastChild: boolean = false, childrenNode: React.ReactNode = null) => {
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
        const isDragOverInside = dragOverId === shape.id && dropPosition === 'inside';
        const shapeName = !isDefaultName(shape.name || '') ? shape.name : defaultName;
        const tkinterName = showTkinterNames ? `[${getTkinterType(shape).toLowerCase()}]` : '';
        const fullTitle = `${shapeName} ${tkinterName}`.trim();
        const isLocked = lockedShapeIds.has(shape.id);
        
        return (
            <motion.li
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                ref={(el: any) => { itemRefs.current[shape.id] = el; }}
                key={shape.id}
                data-shape-id={shape.id}
                onTouchStart={(e) => handleItemTouchStart(e, shape.id)}
                onTouchMove={handleItemTouchMove}
                onTouchEnd={handleItemTouchEnd}
                onTouchCancel={handleItemTouchEnd}
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (isLocked) return;
                    if (isLongPressTriggeredRef.current) {
                        isLongPressTriggeredRef.current = false;
                        return;
                    }
                    
                    // In multi-select mode or with Ctrl/Shift, toggle / range select
                    if (isMultiSelectMode || selectedShapeIds.length > 1) {
                        onSelectShape(shape.id, true, e.shiftKey, true);
                    } else {
                        onSelectShape(shape.id, e.ctrlKey || e.metaKey, e.shiftKey, true);
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isLocked) handleStartEditing(shape);
                }}
                draggable={!isEditing && !isLocked}
                onDragStart={isEditing ? undefined : (e: any) => { e.stopPropagation(); handleDragStart(e, shape.id); }}
                onDragOver={isEditing ? undefined : (e: any) => { e.stopPropagation(); handleDragOver(e, shape.id); }}
                onDragLeave={isEditing ? undefined : (e: any) => { e.stopPropagation(); handleDragLeave(e); }}
                onDrop={isEditing ? undefined : (e: any) => { e.stopPropagation(); handleDrop(e, shape.id); }}
                onDragEnd={isEditing ? undefined : (e: any) => { e.stopPropagation(); handleDragEnd(e); }}
                className={`group flex flex-col p-0 rounded-md transition-all duration-150 relative select-none
                    ${draggedId === shape.id && !touchDraggedId ? 'opacity-30' : ''}
                    ${touchDraggedId === shape.id ? 'ring-2 ring-[var(--accent-primary)] shadow-xl scale-[1.02] bg-[var(--bg-secondary)] z-40' : ''}
                `}
            >
                {/* Touch Grab Floating Badge */}
                {touchDraggedId === shape.id && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-[11px] font-bold shadow-lg z-50 whitespace-nowrap flex items-center gap-1.5 pointer-events-none animate-bounce">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>{t('list.reorder.grabbed') || 'Захоплено для переміщення'}</span>
                    </div>
                )}

                <div className={`flex items-center justify-between py-0.5 px-1.5 rounded-md cursor-pointer ${isSelected ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : isDistributing ? 'bg-amber-500/80 text-white outline outline-1 outline-amber-600' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'}`}>
                    {/* Drop Insertion Indicators */}
                    {isDragOverTop && (
                        <div className="absolute -top-[3px] left-0 right-0 h-[3px] bg-[var(--selection-stroke)] rounded-full shadow-[0_0_4px_var(--selection-stroke)] z-50 pointer-events-none animate-pulse"></div>
                    )}
                    {isDragOverBottom && (
                        <div className="absolute -bottom-[3px] left-0 right-0 h-[3px] bg-[var(--selection-stroke)] rounded-full shadow-[0_0_4px_var(--selection-stroke)] z-50 pointer-events-none animate-pulse"></div>
                    )}
                    {isDragOverInside && (
                         <div className="absolute inset-0 bg-[var(--selection-stroke)]/20 outline outline-2 outline-[var(--selection-stroke)] rounded-md pointer-events-none z-50 animate-pulse"></div>
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
                                <div className={`absolute left-[-9px] top-[-2px] h-[16px] w-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                            )}

                            {/* Horizontal dash to child */}
                            <div className={`absolute left-[-9px] top-[14px] w-[9px] h-[2px] ${isParentSelected ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]'} pointer-events-none z-10`}></div>
                        </>
                    )}

                    <div className={`flex items-center gap-2 overflow-hidden flex-1 relative z-10 ${isLocked ? 'pointer-events-none' : ''}`}>
                        {(isMultiSelectMode || selectedShapeIds.length > 1) ? (
                            /* Checkbox toggle button in multi-select mode */
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocked) return;
                                    onSelectShape(shape.id, true, false, true);
                                    if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                                        try { navigator.vibrate(25); } catch (_) {}
                                    }
                                }}
                                className={`flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                                    isSelected 
                                        ? 'bg-white text-[var(--accent-primary)] shadow-sm' 
                                        : 'border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
                                }`}
                                title={isSelected ? (t('button.deselect') || 'Зняти вибір') : (t('button.select') || 'Виділити')}
                            >
                                {isSelected && (
                                    <svg className="w-3 h-3 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                )}
                            </button>
                        ) : null}

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
                                style={{ pointerEvents: 'auto' }}
                            >
                                {collapsedGroups.has(shape.id) ? <ChevronRightIcon size={12} /> : <ChevronDownIcon size={12} />}
                            </button>
                        )}
                        <button onClick={(e) => handleToggleVisibility(e, shape)} disabled={isLocked} title={shape.state === 'hidden' ? t('list.visibility.show') : t('list.visibility.hide')} className="flex-shrink-0 p-0.5 rounded hover:bg-[var(--bg-hover)] disabled:opacity-50">
                            {shape.state === 'hidden' ? <EyeOffIcon size={12} /> : <EyeIcon size={12} />}
                        </button>
                        
                        {/* Option 1: Shape Icon button - click/tap to toggle multi-selection */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isLocked) return;
                                setIsMultiSelectMode?.(true);
                                onSelectShape(shape.id, true, false, true);
                                if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                                    try { navigator.vibrate(25); } catch (_) {}
                                }
                            }}
                            title={t('list.multiselect.tapIconHint') || 'Натисніть на іконку для вибору'}
                            className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-[var(--bg-app)] hover:scale-110 active:scale-95 transition-all text-[var(--text-secondary)] hover:text-[var(--accent-primary)] cursor-pointer"
                            style={{ opacity: (!isLayerVisible || shape.state === 'hidden') ? 0.5 : 1 }}
                        >
                            {getIconForShape(shape)}
                        </button>

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

                    <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0 ${isLocked ? 'hidden' : ''}`}>
                        <div className="flex flex-col">
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'up')} disabled={!canMoveUp || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-t-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveUp')}>
                                <ArrowUpIcon size={12} />
                            </button>
                            <button onClick={(e) => handleMoveShape(e, shape.id, 'down')} disabled={!canMoveDown || isLocked} className="p-[2px] hover:bg-[var(--bg-app)] rounded-b-sm disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('list.moveDown')}>
                                <ArrowDownIcon size={12} />
                            </button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} disabled={!!distributePathState || isLocked} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>
                    </div>
                </div>
                {childrenNode}
            </motion.li>
        );
    };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('list.title')}</h2>
            <div className="flex items-center gap-2">
                {/* Option 2: Select / Done toggle button in Header */}
                <button
                    type="button"
                    onClick={() => {
                        const newMode = !isMultiSelectMode;
                        setIsMultiSelectMode?.(newMode);
                    }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition-all cursor-pointer ${
                        isMultiSelectMode
                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs font-bold'
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] shadow-2xs'
                    }`}
                    title={isMultiSelectMode ? (t('list.multiselect.done') || 'Готово') : (t('list.multiselect.select') || 'Вибрати')}
                >
                    {isMultiSelectMode ? (
                        <>
                            <CheckIcon size={13} />
                            <span>{t('list.multiselect.done') || 'Готово'}</span>
                        </>
                    ) : (
                        <>
                            <SelectIcon size={13} />
                            <span>{t('list.multiselect.select') || 'Вибрати'}</span>
                        </>
                    )}
                </button>
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
        {(isMultiSelectMode || selectedShapeIds.length > 1) && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--accent-primary)]/10 border-b border-[var(--accent-primary)]/20 flex-shrink-0 animate-in fade-in">
                <span className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
                    {t('status.selected') || 'Виділено'}: {selectedShapeIds.length}
                </span>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => {
                            const selectable = shapes.filter(s => !lockedShapeIds.has(s.id)).map(s => s.id);
                            onSelectShape(selectable, false, false, true);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors cursor-pointer"
                    >
                        {t('list.multiselect.selectAll') || 'Вибрати всі'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onSelectShape(null);
                        }}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-secondary)] transition-colors cursor-pointer"
                    >
                        {t('list.multiselect.deselectAll') || 'Зняти вибір'}
                    </button>
                </div>
            </div>
        )}
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
                                        className={`group px-2 py-1 flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider rounded cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'hover:bg-[var(--bg-hover)]'} ${isDragOverLayer ? 'bg-[var(--accent-primary)]/20 outline-2 outline-dashed outline-[var(--accent-primary)] outline-offset-[-2px]' : ''}`}
                                        onClick={(e) => {
                                            if (e.shiftKey) {
                                                if (layer.shapeIds.length > 0) {
                                                    const selectableIds = layer.shapeIds.filter(id => !lockedShapeIds.has(id));
                                                    if (selectableIds.length > 0) onSelectShape(selectableIds, e.ctrlKey || e.metaKey, false, true);
                                                }
                                            } else {
                                                onSetActiveLayer(layer.id);
                                            }
                                        }}
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
                                            if (layer.locked) {
                                                if (onLayerWarning) onLayerWarning('locked', layer.id);
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }
                                            if (!layer.visible && ignoreHiddenWarningForLayer !== layer.id) {
                                                if (onLayerWarning) {
                                                    onLayerWarning('hidden', layer.id, () => {
                                                        if (draggedId) {
                                                            onMoveToLayer(draggedId, layer.id);
                                                        }
                                                    });
                                                }
                                                setDragOverId(null);
                                                setDraggedId(null);
                                                return;
                                            }
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
                                                {layer.locked && <span className="flex-shrink-0 text-[var(--text-secondary)] ml-1" title={t('menu.edit.lock') || 'Заблоковано'}><LockIcon size={12} /></span>}
                                                {!layer.visible && <span className="text-[10px] text-amber-500 font-normal leading-none tracking-normal capitalize" title={t('list.layerHidden') || 'Шар прихований'}>Прихований [H]</span>}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const selectableIds = layer.shapeIds.filter(id => !lockedShapeIds.has(id));
                                                    if (selectableIds.length > 0) onSelectShape(selectableIds, e.ctrlKey || e.metaKey, false, true); 
                                                }}
                                                title={t('list.selectAll')}
                                            >
                                                <SelectIcon size={12} />
                                            </button>
                                            <button 
                                                className="p-1 rounded hover:bg-[var(--bg-app)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    const newSelection = selectedShapeIds.filter(id => !layer.shapeIds.includes(id));
                                                    onSelectShape(newSelection.length > 0 ? newSelection : null, false, false, true); 
                                                }}
                                                title={t('list.deselectAll')}
                                            >
                                                <SelectOffIcon size={12} />
                                            </button>
                                        </div>
                                        {activeLayerId === layer.id && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] flex-shrink-0"></span>}
                                    </div>
                                    {!collapsedLayers.has(layer.id) && (
                                        <ul 
                                            className={`space-y-0.5 pt-0.5 mt-0 ml-1 border-l-2 ${activeLayerId === layer.id ? 'border-[var(--accent-primary)]' : 'border-[var(--text-tertiary)]'} relative z-0 transition-colors ${dragOverId === `layer-list-${layer.id}` ? 'bg-[var(--accent-primary)]/10 outline-2 outline-dashed outline-[var(--accent-primary)] outline-offset-[-2px] rounded' : ''}`}
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setDragOverId(`layer-list-${layer.id}`);
                                                setDropPosition(null);
                                            }}
                                            onDragLeave={() => {
                                                if (dragOverId === `layer-list-${layer.id}`) setDragOverId(null);
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (layer.locked) {
                                                    if (onLayerWarning) onLayerWarning('locked', layer.id);
                                                    setDragOverId(null);
                                                    setDraggedId(null);
                                                    return;
                                                }
                                                if (!layer.visible && ignoreHiddenWarningForLayer !== layer.id) {
                                                    if (onLayerWarning) {
                                                        onLayerWarning('hidden', layer.id, () => {
                                                            if (draggedId) {
                                                                onMoveToLayer(draggedId, layer.id);
                                                            }
                                                        });
                                                    }
                                                    setDragOverId(null);
                                                    setDraggedId(null);
                                                    return;
                                                }
                                                if (draggedId) {
                                                    onMoveToLayer(draggedId, layer.id);
                                                }
                                                setDragOverId(null);
                                                setDraggedId(null);
                                            }}
                                        >
                                        {[...layerShapes].reverse().map((shape, index) => {
                                            if (!shape) return null;
                                            if (shape.groupId) return null; // Skip children of groups
                                            
                                            const originalIndex = shapes.findIndex(s => s.id === shape.id);
                                            return renderShapeTree(shape, index, originalIndex, 0, layer.visible, false, layerShapes);
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
