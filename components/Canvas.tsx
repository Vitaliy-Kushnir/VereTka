
import React, {useContext} from 'react';
import { useLanguage } from './LanguageContext';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { type Shape, type Tool, type CanvasAction, type RotatableShape, type RectangleShape, type EllipseShape, type PathShape, type LineShape, PolylineShape, PolygonShape, DrawMode, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, BezierCurveShape, ViewTransform, JoinStyle, ArcShape, RightTriangleShape, TransformHandle, TextShape, ImageShape, BitmapShape, MagnifierMode } from '../types';
import { SelectionControls } from './SelectionControls';
import { getShapeCenter, rotatePoint, getBoundingBox, getIsoscelesTrianglePoints, getPolylinePointsAsPath, getPolygonPointsAsArray, getRhombusPoints, getTrapezoidPoints, getParallelogramPoints, getSmoothedPathData, getFinalPoints, getArcPathData, getRightTrianglePoints, getTextBoundingBox, processTextLines, getVisualBoundingBox, isShapeClosed, getClosestPointOnShapeContour, evaluateShapeContourPointAndTangent, isShapeIntersectingRect } from '../lib/geometry';
import { CheckSquareIcon, ClosePathIcon, XSquareIcon, UndoIcon } from './icons';
import { TOOL_TYPE_TO_NAME, ROTATE_CURSOR_STYLE, ADJUST_CURSOR_STYLE, getDefaultNameForShape, getVisualFontFamily, isDefaultName, DUPLICATE_CURSOR_STYLE } from '../lib/constants';
import { Magnifier } from './Magnifier';
import { VirtualJoystick } from './VirtualJoystick';

interface CanvasProps {
  onDrawingAttempt?: () => boolean;
  width: number;
  height: number;
  backgroundColor: string;
  shapes: Shape[];
  lockedShapeIds: Set<string>;
  addShape: (shape: Shape, isDuplication?: boolean) => void;
  addShapes?: (shapes: Shape[], isDuplication?: boolean) => void;
  updateShape: (shape: Shape) => void;
  updateShapes?: (shapes: Shape[]) => void;
  activeTool: Tool;
  drawMode: DrawMode;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  textColor: string;
  textFont: string;
  textFontSize: number;
  numberOfSides: number;
  selectedShapeIds: string[];
  onSelectShape: (id: string | string[] | null, isCtrlPressed?: boolean, isShiftPressed?: boolean, ignoreGroup?: boolean) => void;
  touchDrawingMode?: 'tap-drag' | 'virtual-joystick';
  setTouchDrawingMode?: (mode: 'tap-drag' | 'virtual-joystick') => void;
  showMagnifier?: MagnifierMode | boolean;
  setShowMagnifier?: (mode: MagnifierMode) => void;
  isDrawingPolyline: boolean;
  polylinePoints: {x: number, y: number}[];
  setPolylinePoints: React.Dispatch<React.SetStateAction<{x: number, y: number}[]>>;
  onCompletePolyline: (isClosed: boolean) => void;
  onCancelPolyline: () => void;
  onUndoPolylinePoint?: () => void;
  isDrawingBezier: boolean;
  bezierPoints: {x: number, y: number}[];
  setBezierPoints: React.Dispatch<React.SetStateAction<{x: number, y: number}[]>>;
  onCompleteBezier: (isClosed: boolean) => void;
  onCancelBezier: () => void;
  onUndoBezierPoint?: () => void;
  showGrid: boolean;
  gridSize: number;
  snapStep: number;
  viewTransform: ViewTransform;
  setViewTransform: React.Dispatch<React.SetStateAction<ViewTransform>>;
  activePointIndex: number | null;
  setActivePointIndex: (index: number | null) => void;
  showCursorCoords: boolean;
  showRotationAngle: boolean;
  pendingImage: string | null;
  setPendingImage: (src: string | null) => void;
  isImportingImage: boolean;
  setCursorPos: (pos: {x:number, y:number} | null) => void;
  showNotification: (message: string, type?: 'info' | 'error') => void;
  onStartInlineEdit: (shapeId: string) => void;
  inlineEditingShapeId: string | null;
  keyboardSnapLines?: {x: number | null, y: number | null};
  showCenterGuides: boolean;
  enableSnapping: boolean;
  distributePathState?: import('../types').DistributePathState | null;
  onDistributePathChange?: (state: import('../types').DistributePathState) => void;
  onDistributePathChangeEnd?: () => void;
  isSelectingPathShape?: boolean;
  onSelectPathShape?: (shape: Shape) => void;
  isMultiSelectMode?: boolean;
  setIsMultiSelectMode?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

function translateShape(shape: Shape, dx: number, dy: number): Shape {
    const s = JSON.parse(JSON.stringify(shape)) as any;
    if (typeof s.x === 'number') s.x += dx;
    if (typeof s.y === 'number') s.y += dy;
    if (typeof s.cx === 'number') s.cx += dx;
    if (typeof s.cy === 'number') s.cy += dy;
    if (typeof s.x1 === 'number') { s.x1 += dx; s.y1 += dy; s.x2 += dx; s.y2 += dy; }
    if (Array.isArray(s.points)) {
        s.points = s.points.map((p: any) => p ? { x: p.x + dx, y: p.y + dy } : p);
    }
    return s as Shape;
}

function updateShapeNode(shape: Shape, nodeIdx: number, startPt: {x: number, y: number}, currentPt: {x: number, y: number}): Shape {
    let s = JSON.parse(JSON.stringify(shape)) as any;
    const dx = currentPt.x - startPt.x;
    const dy = currentPt.y - startPt.y;

    if (!Array.isArray(s.points) && s.type !== 'line') {
        const finalPts = getFinalPoints(shape);
        if (finalPts && finalPts.length > 0) {
            const isClosed = isShapeClosed(shape);
            s = {
                id: shape.id,
                type: 'polyline',
                points: finalPts,
                isClosed,
                stroke: shape.stroke,
                strokeWidth: shape.strokeWidth,
                fill: 'fill' in shape ? shape.fill : 'none',
            };
        }
    }

    if (Array.isArray(s.points) && nodeIdx < s.points.length) {
        if (s.points[nodeIdx]) {
            s.points[nodeIdx] = { x: s.points[nodeIdx].x + dx, y: s.points[nodeIdx].y + dy };
        }
    } else if (s.type === 'line') {
        if (nodeIdx === 0) { s.x1 += dx; s.y1 += dy; }
        else if (nodeIdx === 1) { s.x2 += dx; s.y2 += dy; }
    } else {
        return translateShape(shape, dx, dy);
    }
    return s as Shape;
}

function resizeShapeFromCorner(shape: Shape, corner: string, startPt: {x: number, y: number}, currentPt: {x: number, y: number}): Shape {
    const unrotatedShape = { ...shape, rotation: 0 };
    const pts = getFinalPoints(unrotatedShape as any);
    if (!pts || pts.length === 0) return shape;

    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const origWidth = Math.max(1, maxX - minX);
    const origHeight = Math.max(1, maxY - minY);

    const dx = currentPt.x - startPt.x;
    const dy = currentPt.y - startPt.y;

    let anchorX = minX;
    let anchorY = minY;
    let newWidth = origWidth;
    let newHeight = origHeight;

    if (corner === 'shape-resize-top-left') {
        anchorX = maxX; anchorY = maxY;
        newWidth = Math.max(10, origWidth - dx);
        newHeight = Math.max(10, origHeight - dy);
    } else if (corner === 'shape-resize-top-right') {
        anchorX = minX; anchorY = maxY;
        newWidth = Math.max(10, origWidth + dx);
        newHeight = Math.max(10, origHeight - dy);
    } else if (corner === 'shape-resize-bottom-left') {
        anchorX = maxX; anchorY = minY;
        newWidth = Math.max(10, origWidth - dx);
        newHeight = Math.max(10, origHeight + dy);
    } else if (corner === 'shape-resize-bottom-right') {
        anchorX = minX; anchorY = minY;
        newWidth = Math.max(10, origWidth + dx);
        newHeight = Math.max(10, origHeight + dy);
    } else if (corner === 'shape-resize-top-center') {
        anchorX = minX; anchorY = maxY;
        newWidth = origWidth;
        newHeight = Math.max(10, origHeight - dy);
    } else if (corner === 'shape-resize-bottom-center') {
        anchorX = minX; anchorY = minY;
        newWidth = origWidth;
        newHeight = Math.max(10, origHeight + dy);
    } else if (corner === 'shape-resize-middle-left') {
        anchorX = maxX; anchorY = minY;
        newWidth = Math.max(10, origWidth - dx);
        newHeight = origHeight;
    } else if (corner === 'shape-resize-middle-right') {
        anchorX = minX; anchorY = minY;
        newWidth = Math.max(10, origWidth + dx);
        newHeight = origHeight;
    }

    const scaleX = newWidth / origWidth;
    const scaleY = newHeight / origHeight;

    const s = JSON.parse(JSON.stringify(shape)) as any;

    if (Array.isArray(s.points)) {
        s.points = s.points.map((p: any) => p ? {
            x: anchorX + (p.x - anchorX) * scaleX,
            y: anchorY + (p.y - anchorY) * scaleY
        } : p);
    } else if ('x' in s && 'y' in s && 'width' in s && 'height' in s) {
        const newMinX = corner.includes('left') ? anchorX - newWidth : anchorX;
        const newMinY = corner.includes('top') ? anchorY - newHeight : anchorY;
        s.x = newMinX;
        s.y = newMinY;
        s.width = newWidth;
        s.height = newHeight;
    } else if ('cx' in s && 'cy' in s) {
        s.cx = anchorX + (s.cx - anchorX) * scaleX;
        s.cy = anchorY + (s.cy - anchorY) * scaleY;
        if ('radius' in s) s.radius *= Math.min(scaleX, scaleY);
        if ('rx' in s) s.rx *= scaleX;
        if ('ry' in s) s.ry *= scaleY;
    } else if ('x1' in s && 'y1' in s) {
        s.x1 = anchorX + (s.x1 - anchorX) * scaleX;
        s.y1 = anchorY + (s.y1 - anchorY) * scaleY;
        s.x2 = anchorX + (s.x2 - anchorX) * scaleX;
        s.y2 = anchorY + (s.y2 - anchorY) * scaleY;
    }

    return s as Shape;
}

const DRAG_THRESHOLD = 3;
const MIN_SCALE = 0.05;
const MAX_SCALE = 30;

const getCursorForHandle = (handle: TransformHandle): string => {
    switch (handle) {
        case 'top-left':
        case 'bottom-right':
            return 'nwse-resize';
        case 'top-right':
        case 'bottom-left':
            return 'nesw-resize';
        case 'top-center':
        case 'bottom-center':
            return 'ns-resize';
        case 'middle-left':
        case 'middle-right':
            return 'ew-resize';
        case 'line-start':
        case 'line-end':
            return 'grabbing';
        default:
            return 'default';
    }
};


const wrapAngle = (angle: number): number => {
    // Keeps the angle within -359.99... to 359.99...
    // 360 becomes 0, -360 becomes 0.
    return angle % 360;
};

const formatPointsForSvg = (points: { x: number; y: number }[]): string => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
};

const Canvas: React.FC<CanvasProps> = (props) => {
    const { t } = useLanguage();
    const { 
        width, height, backgroundColor, shapes, lockedShapeIds, addShape, addShapes, updateShape, updateShapes,
        activeTool, drawMode, fillColor, strokeColor, strokeWidth, 
        textColor, textFont, textFontSize,
        numberOfSides, selectedShapeIds, onSelectShape,
        isDrawingPolyline, polylinePoints, setPolylinePoints, onCompletePolyline, onCancelPolyline,
        isDrawingBezier, bezierPoints, setBezierPoints, onCompleteBezier, onCancelBezier,
        showGrid, gridSize, snapStep,
        viewTransform, setViewTransform,
        activePointIndex, setActivePointIndex,
        showCursorCoords, showRotationAngle,
        pendingImage, setPendingImage,
        isImportingImage,
        setCursorPos,
        showNotification,
        onStartInlineEdit,
        inlineEditingShapeId,
        keyboardSnapLines,
        showCenterGuides,
        enableSnapping,
        isMultiSelectMode = false,
        setIsMultiSelectMode,
    } = props;
    
  const [action, setAction] = useState<CanvasAction>(null);
  const [activeTransformShape, _setActiveTransformShape] = useState<Shape | null>(null);
  const activeTransformShapeRef = useRef<Shape | null>(null);
  const setActiveTransformShape = useCallback((shape: Shape | null) => {
    _setActiveTransformShape(shape);
    activeTransformShapeRef.current = shape;
  }, []);

  const [auxiliaryTransformShapes, _setAuxiliaryTransformShapes] = useState<Shape[]>([]);
  const auxiliaryTransformShapesRef = useRef<Shape[]>([]);
  const setAuxiliaryTransformShapes = useCallback((shapes: Shape[]) => {
    _setAuxiliaryTransformShapes(shapes);
    auxiliaryTransformShapesRef.current = shapes;
  }, []);
  const [previewMousePos, setPreviewMousePos] = useState<{x: number, y: number} | null>(null);
  const [rawMousePos, setRawMousePos] = useState<{x: number; y: number } | null>(null);
  const [snapLines, setSnapLines] = useState<{x: number | null, y: number | null}>({x: null, y: null});
  const [isTouchDown, setIsTouchDown] = useState(false);
  const [aimPos, setAimPos] = useState<{ x: number; y: number }>(() => ({
    x: Math.round(width / 2),
    y: Math.round(height / 2)
  }));
  const [lastKnownCanvasPos, setLastKnownCanvasPos] = useState<{ x: number; y: number } | null>(null);
  const [anchorTarget, setAnchorTarget] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const isDraggingAnchorRef = useRef(false);
  const [magnifierCenter, setMagnifierCenter] = useState<{ x: number; y: number; radius: number } | null>(null);

  const handleMagnifierCenterChange = useCallback((center: { x: number; y: number; radius: number }) => {
    setMagnifierCenter(prev => {
      if (prev && Math.abs(prev.x - center.x) < 0.5 && Math.abs(prev.y - center.y) < 0.5 && prev.radius === center.radius) {
        return prev;
      }
      return center;
    });
  }, []);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasDraggedRef = useRef(false);
  const mouseDownPosRef = useRef<{x: number, y: number} | null>(null);
  const touchStateRef = useRef<{ initialDist: number, initialMidpoint: {x:number, y:number}, initialTransform: ViewTransform } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number; shapeId?: string } | null>(null);
  const pendingTouchRef = useRef<{
    clientX: number;
    clientY: number;
    time: number;
    shapeId?: string;
    resolvedShapeId?: string;
    isAlreadySelected: boolean;
    isHandle: boolean;
    startCanvasPos: { x: number; y: number };
    hasMoved: boolean;
  } | null>(null);
  const isMultiTouchGestureRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressPosRef = useRef<{ x: number; y: number; shapeId?: string } | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const isSpacePressedRef = useRef(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = true;
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                setIsSpacePressed(true);
                e.preventDefault();
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            isSpacePressedRef.current = false;
            setIsSpacePressed(false);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
      if (!action) setSnapLines({ x: null, y: null });
  }, [action]);

  const getPointerPosition = useCallback((event: MouseEvent | React.MouseEvent | React.Touch | Touch): { x: number; y: number } => {
    if (!containerRef.current) return {x: 0, y: 0};
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }, []);

  const getTransformedPointerPosition = useCallback((pos: {x: number, y: number}): { x: number; y: number } => {
    const transformedX = (pos.x - viewTransform.x) / viewTransform.scale;
    const transformedY = (pos.y - viewTransform.y) / viewTransform.scale;
    
    if (snapStep > 0) {
        return {
          x: Math.round(transformedX / snapStep) * snapStep,
          y: Math.round(transformedY / snapStep) * snapStep,
        }
    }
    return { x: transformedX, y: transformedY };
  }, [viewTransform, snapStep]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement | undefined)?.closest?.('[data-magnifier="true"]') || (e.target as Element | undefined)?.closest?.('#magnifier-anchor-layer') || isDraggingAnchorRef.current) {
        return;
    }
    if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) { // Middle mouse button or Space+Left for panning
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    hasDraggedRef.current = false;
    const pos = getTransformedPointerPosition(getPointerPosition(e));
    mouseDownPosRef.current = pos;

    if (props.touchDrawingMode === 'virtual-joystick') {
        setAimPos(pos);
        setPreviewMousePos(pos);
    }

    if (e.button === 2) { // Right mouse button for duplicating
        if (props.distributePathState) {
            e.preventDefault();
            return;
        }
        const clickedShapeId = (e.target as SVGElement)?.dataset?.id;
        
        let rootShapeId = clickedShapeId;
        if (clickedShapeId) {
            const getRootId = (id: string): string => {
                const parent = shapes.find(g => g.type === 'group' && g.shapeIds?.includes(id));
                return parent ? getRootId(parent.id) : id;
            };
            rootShapeId = getRootId(clickedShapeId);
        }

        const shapeToDuplicate = rootShapeId ? shapes.find(s => s.id === rootShapeId) : null;

        if (shapeToDuplicate) {
             // If the right-clicked shape isn't the currently selected one, select it first.
            if (rootShapeId && !selectedShapeIds.includes(rootShapeId)) {
                onSelectShape(rootShapeId);
            }
            // Use a type-safe deep copy to prevent mutation issues
            let deepCopiedShape: Shape;
            switch (shapeToDuplicate.type) {
                case 'group':
                    deepCopiedShape = {...shapeToDuplicate, shapeIds: [...(shapeToDuplicate.shapeIds || [])]};
                    break;
                case 'line':
                    deepCopiedShape = {...shapeToDuplicate, points: [{...shapeToDuplicate.points[0]}, {...shapeToDuplicate.points[1]}]};
                    break;
                case 'pencil':
                case 'polyline':
                case 'bezier':
                    deepCopiedShape = {...shapeToDuplicate, points: shapeToDuplicate.points.map(p => ({...p}))};
                    break;
                default:
                    deepCopiedShape = {...shapeToDuplicate};
            }
            deepCopiedShape.id = `${shapeToDuplicate.id}-preview`;
            setAction({ type: 'duplicating', initialShape: deepCopiedShape, startPos: pos });
        }
        return;
    }

    if (e.button !== 0) return;
    
    if (activeTool !== 'select' && activeTool !== 'edit-points' && true) {
        if (props.onDrawingAttempt && !props.onDrawingAttempt()) {
            return;
        }
    }
    
    const targetElement = e.target as SVGElement | undefined;
    // Important: Check if the click is on a resize/rotate handle or anchor layer *first*.
    if (targetElement?.closest?.('[data-handle="true"]') || targetElement?.closest?.('#magnifier-anchor-layer') || isDraggingAnchorRef.current) {
      // The logic for this is handled by the dedicated control handles
      return;
    }

    if (isDrawingBezier) {
        if (props.touchDrawingMode === 'tap-drag' && (e as any).type === 'touchstart') {
            setPreviewMousePos(pos); // Wait for touchend
        } else {
            setBezierPoints(prev => [...prev, pos]);
        }
        return;
    }
    if (isDrawingPolyline) {
        if (props.touchDrawingMode === 'tap-drag' && (e as any).type === 'touchstart') {
            setPreviewMousePos(pos); // Wait for touchend
        } else {
            setPolylinePoints(prev => [...prev, pos]);
        }
        return;
    }

    const clickedShapeId = targetElement.dataset.id;
    const clickedShape = shapes.find(s => s?.id === clickedShapeId);

    if (activeTool === 'edit-points') {
        if (!clickedShape) {
          onSelectShape(null);
        } else if (clickedShape && clickedShape.state === 'normal') {
          if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
          else if (e.ctrlKey || e.metaKey || e.shiftKey) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
        }
      return;
    }

    if (activeTool === 'select') {
        if (clickedShape && clickedShape.state !== 'disabled' && clickedShape.state !== 'hidden') {
            if (props.distributePathState) {
                const clickedEntity = props.distributePathState.entities.find(e => e.ids.includes(clickedShape.id));
                if (clickedEntity) {
                    setAction({ type: 'edit-distribute-path', handle: 'move-all', startPoint: pos, initialDistributePath: props.distributePathState });
                    return;
                } else if (props.distributePathState.type === 'shape' || props.isSelectingPathShape) {
                    props.onSelectPathShape?.(clickedShape);
                    return;
                }
            } else if (props.isSelectingPathShape) {
                props.onSelectPathShape?.(clickedShape);
                return;
            }
            
            const getRootId = (id: string): string => {
                const shape = shapes.find(s => s.id === id);
                if (shape && shape.groupId) return getRootId(shape.groupId);
                const groupParent = shapes.find(g => g.type === 'group' && g.shapeIds?.includes(id));
                if (groupParent) return getRootId(groupParent.id);
                return id;
            };
            const resolvedClickedId = getRootId(clickedShape.id);
            const isAlreadySelected = selectedShapeIds.includes(resolvedClickedId) || selectedShapeIds.includes(clickedShape.id);

            if (isMultiSelectMode) {
                // In multi-select mode, clicking a shape toggles it in the selection (Ctrl behavior)
                onSelectShape(clickedShape.id, true, e.shiftKey);
            } else if (!isAlreadySelected) {
                // First click: only select the shape/group, do not initiate dragging
                onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
            } else {
                // Shape is already selected: start dragging on subsequent press/drag (or toggle selection if Ctrl/Shift held)
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
                } else {
                    setAction({ type: 'dragging', initialShape: clickedShape, startPos: pos });
                }
            }
        } else {
            // Clicked on empty space, initiate selection box.
            setAction({ type: 'selecting', startPos: pos, currentPos: pos });
        }
        return;
    }
    
    onSelectShape(null);
    const id = new Date().toISOString();
    let newShape: Shape | null = null;
    const toolNameKey = activeTool === 'right-triangle' ? 'rightTriangle' : activeTool;
    const localizedToolName = t(`tool.${toolNameKey}`);

    switch (activeTool) {
        case 'rectangle': newShape = { id, name: localizedToolName, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: false }; break;
        case 'square': newShape = { id, name: localizedToolName, type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: true }; break;
        case 'circle': newShape = { id, name: localizedToolName, type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: true }; break;
        case 'ellipse': newShape = { id, name: localizedToolName, type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: false }; break;
        case 'line': newShape = { id, name: localizedToolName, type: 'line', points: [{...pos}, {...pos}], stroke: strokeColor, strokeWidth, rotation: 0, capstyle: 'round', arrowshape: [8, 10, 3], state: 'normal' }; break;
        case 'pencil': newShape = { id, name: localizedToolName, type: 'pencil', points: [pos], stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'round', capstyle: 'round', arrowshape: [8, 10, 3], isAspectRatioLocked: false }; break;
        case 'triangle': newShape = { id, name: localizedToolName, type: 'triangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', topVertexOffset: 0, isAspectRatioLocked: false }; break;
        case 'right-triangle': newShape = { id, name: localizedToolName, type: 'right-triangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'rhombus': newShape = { id, name: localizedToolName, type: 'rhombus', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'trapezoid': newShape = { id, name: localizedToolName, type: 'trapezoid', x: pos.x, y: pos.y, width: 0, height: 0, topLeftOffsetRatio: 0.25, topRightOffsetRatio: 0.25, isSymmetrical: true, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'parallelogram': newShape = { id, name: localizedToolName, type: 'parallelogram', x: pos.x, y: pos.y, width: 0, height: 0, angle: 75, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'pieslice':
        case 'chord':
        case 'arc': {
            let style: 'pieslice' | 'chord' | 'arc';
            if (activeTool === 'pieslice') style = 'pieslice';
            else if (activeTool === 'chord') style = 'chord';
            else style = 'arc';
            
            const finalFillColor = style === 'arc' ? 'none' : fillColor;
            const extent = (style === 'pieslice' || style === 'chord') ? 270 : 90;
            
            newShape = { id, name: localizedToolName, type: 'arc', x: pos.x, y: pos.y, width: 0, height: 0, fill: finalFillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', start: 0, extent, style, isAspectRatioLocked: false };
            break;
        }
        case 'polygon':
        case 'star':
            newShape = {
                id, name: localizedToolName, type: activeTool, cx: pos.x, cy: pos.y, radius: 0, sides: numberOfSides,
                fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter',
                innerRadius: activeTool === 'star' ? 0 : undefined, isAspectRatioLocked: true,
            };
            break;
        case 'text': {
            newShape = {
                id,
                name: localizedToolName,
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: t('tool.text'),
                font: textFont,
                fontSize: textFontSize,
                weight: 'normal',
                slant: 'roman',
                underline: false,
                overstrike: false,
                fill: textColor,
                stroke: 'none',
                strokeWidth: 0,
                rotation: 0,
                anchor: 'nw',
                justify: 'left',
                width: 0,
                state: 'normal',
                isAspectRatioLocked: false,
            };
            break;
        }
        case 'image': {
            if (pendingImage) {
                const img = new Image();
                img.onload = () => {
                    const newImageShape: ImageShape = {
                        id,
                        name: isImportingImage ? t('tool.imageImport') : localizedToolName,
                        type: 'image',
                        x: pos.x,
                        y: pos.y,
                        width: img.width,
                        height: img.height,
                        src: pendingImage,
                        stroke: 'none',
                        strokeWidth: 0,
                        rotation: 0,
                        state: 'normal',
                        isAspectRatioLocked: true,
                        isImport: isImportingImage,
                    };
                    addShape(newImageShape);
                    setPendingImage(null); // Clear after placing
                };
                img.src = pendingImage;
            }
            break;
        }
        case 'bitmap': {
            newShape = {
                id,
                name: localizedToolName,
                type: 'bitmap',
                x: pos.x,
                y: pos.y,
                width: 50,
                height: 50,
                bitmapType: 'error',
                foreground: '#000000',
                background: '#ffffff',
                stroke: 'none',
                strokeWidth: 0,
                rotation: 0,
                state: 'normal',
                isAspectRatioLocked: false,
            };
            break;
        }
    }
    if (newShape && !['text', 'image', 'bitmap'].includes(newShape.type)) {
        setAction({ type: 'drawing', shape: newShape, startPos: pos });
    } else if (newShape) {
        addShape(newShape);
    }
  }, [activeTool, shapes, onSelectShape, fillColor, strokeColor, strokeWidth, textColor, textFont, textFontSize, numberOfSides, isDrawingPolyline, setPolylinePoints, isDrawingBezier, setBezierPoints, getTransformedPointerPosition, getPointerPosition, selectedShapeIds, pendingImage, setPendingImage, addShape, isImportingImage, props.onDrawingAttempt, props.distributePathState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement | undefined)?.closest?.('[data-magnifier="true"]') || isDraggingAnchorRef.current) {
        return;
    }
    const rawPos = getPointerPosition(e);
    setRawMousePos(rawPos);
    let pos = getTransformedPointerPosition(rawPos);
    setPreviewMousePos(pos);
    setLastKnownCanvasPos(pos);
    setCursorPos(pos);
    if (props.touchDrawingMode === 'virtual-joystick') {
        setAimPos(pos);
    }
    
    if (!hasDraggedRef.current && mouseDownPosRef.current) {
        const dist = Math.hypot(pos.x - mouseDownPosRef.current.x, pos.y - mouseDownPosRef.current.y);
        if (dist > DRAG_THRESHOLD) {
            hasDraggedRef.current = true;
        }
    }
    
    if (!action) return;

    let newSnapLines = { x: null as number | null, y: null as number | null };

    if ((enableSnapping || showCenterGuides) && (action.type === 'dragging' || action.type === 'duplicating' || (action.type === 'edit-distribute-path' && ['move-all', 'center', 'start', 'end'].includes(action.handle))) && !e.altKey) {
        let dx = 0;
        let dy = 0;
        if (action.type === 'edit-distribute-path') {
            dx = pos.x - action.startPoint.x;
            dy = pos.y - action.startPoint.y;
        } else {
            dx = pos.x - action.startPos.x;
            dy = pos.y - action.startPos.y;
        }
        
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
        }

        let movingBboxOriginal: { x: number, y: number, width: number, height: number } | null = null;
        
        if (action.type === 'edit-distribute-path') {
            const p = action.initialDistributePath;
            if (action.handle === 'center') {
                movingBboxOriginal = { x: p.circleParams.cx, y: p.circleParams.cy, width: 0, height: 0 };
            } else if (action.handle === 'start') {
                movingBboxOriginal = { x: p.lineParams.x1, y: p.lineParams.y1, width: 0, height: 0 };
            } else if (action.handle === 'end') {
                movingBboxOriginal = { x: p.lineParams.x2, y: p.lineParams.y2, width: 0, height: 0 };
            } else {
                if (p.type === 'circle') {
                    movingBboxOriginal = { x: p.circleParams.cx - p.circleParams.radius, y: p.circleParams.cy - p.circleParams.radius, width: p.circleParams.radius * 2, height: p.circleParams.radius * 2 };
                } else {
                    const minX = Math.min(p.lineParams.x1, p.lineParams.x2);
                    const minY = Math.min(p.lineParams.y1, p.lineParams.y2);
                    movingBboxOriginal = { x: minX, y: minY, width: Math.abs(p.lineParams.x2 - p.lineParams.x1), height: Math.abs(p.lineParams.y2 - p.lineParams.y1) };
                }
            }
        } else {
            const box = getVisualBoundingBox((action as any).initialShape, undefined, shapes);
            if (box) movingBboxOriginal = box;
        }
        
        if (movingBboxOriginal) {
            const movingBox = {
               x: movingBboxOriginal.x + dx,
               y: movingBboxOriginal.y + dy,
               width: movingBboxOriginal.width,
               height: movingBboxOriginal.height
            };
            const movingCenters = {
               x: movingBox.x + movingBox.width / 2,
               y: movingBox.y + movingBox.height / 2
            };

            const SNAP_DIST = 5 / viewTransform.scale;

            let bestDx = dx;
            let bestDy = dy;
            let minSnapDistX = SNAP_DIST;
            let minSnapDistY = SNAP_DIST;

            if (enableSnapping) {
                let excludedIds = selectedShapeIds;
                if (action.type === 'edit-distribute-path') {
                    const distributedIds = new Set(action.initialDistributePath.entities.flatMap(e => e.ids));
                    excludedIds = shapes.filter(s => distributedIds.has(s.id)).map(s => s.id);
                }
                const otherShapes = shapes.filter(s => !excludedIds.includes(s.id) && s.groupId === undefined);

                for (const other of otherShapes) {
                    const otherBox = getVisualBoundingBox(other, undefined, shapes);
                    if (!otherBox) continue;

                    const otherCenters = { x: otherBox.x + otherBox.width/2, y: otherBox.y + otherBox.height/2 };
                    
                    const xTargets = [
                       { moving: movingBox.x, target: otherBox.x },
                       { moving: movingBox.x, target: otherBox.x + otherBox.width },
                       { moving: movingCenters.x, target: otherCenters.x },
                       { moving: movingBox.x + movingBox.width, target: otherBox.x },
                       { moving: movingBox.x + movingBox.width, target: otherBox.x + otherBox.width }
                    ];
                    for (const t of xTargets) {
                        const diff = Math.abs(t.moving - t.target);
                        if (diff < minSnapDistX) {
                            minSnapDistX = diff;
                            bestDx = dx - (t.moving - t.target);
                            newSnapLines.x = t.target;
                        }
                    }

                    const yTargets = [
                       { moving: movingBox.y, target: otherBox.y },
                       { moving: movingBox.y, target: otherBox.y + otherBox.height },
                       { moving: movingCenters.y, target: otherCenters.y },
                       { moving: movingBox.y + movingBox.height, target: otherBox.y },
                       { moving: movingBox.y + movingBox.height, target: otherBox.y + otherBox.height }
                    ];
                    for (const t of yTargets) {
                        const diff = Math.abs(t.moving - t.target);
                        if (diff < minSnapDistY) {
                            minSnapDistY = diff;
                            bestDy = dy - (t.moving - t.target);
                            newSnapLines.y = t.target;
                        }
                    }
                }

                // Snap to canvas edges
                const canvasXTargets = [
                    { moving: movingBox.x, target: 0 },
                    { moving: movingBox.x + movingBox.width, target: 0 },
                    { moving: movingCenters.x, target: 0 },
                    { moving: movingBox.x, target: width },
                    { moving: movingBox.x + movingBox.width, target: width },
                    { moving: movingCenters.x, target: width }
                ];
                for (const t of canvasXTargets) {
                    const diff = Math.abs(t.moving - t.target);
                    if (diff < minSnapDistX) {
                        minSnapDistX = diff;
                        bestDx = dx - (t.moving - t.target);
                        newSnapLines.x = t.target;
                    }
                }

                const canvasYTargets = [
                    { moving: movingBox.y, target: 0 },
                    { moving: movingBox.y + movingBox.height, target: 0 },
                    { moving: movingCenters.y, target: 0 },
                    { moving: movingBox.y, target: height },
                    { moving: movingBox.y + movingBox.height, target: height },
                    { moving: movingCenters.y, target: height }
                ];
                for (const t of canvasYTargets) {
                    const diff = Math.abs(t.moving - t.target);
                    if (diff < minSnapDistY) {
                        minSnapDistY = diff;
                        bestDy = dy - (t.moving - t.target);
                        newSnapLines.y = t.target;
                    }
                }
            }

            if (showCenterGuides) {
                const centerTargetsX = [
                    { moving: movingCenters.x, target: width / 2 },
                    { moving: movingBox.x, target: width / 2 },
                    { moving: movingBox.x + movingBox.width, target: width / 2 }
                ];
                for (const t of centerTargetsX) {
                    const diff = Math.abs(t.moving - t.target);
                    if (diff < minSnapDistX) {
                        minSnapDistX = diff;
                        bestDx = dx - (t.moving - t.target);
                        newSnapLines.x = t.target;
                    }
                }

                const centerTargetsY = [
                    { moving: movingCenters.y, target: height / 2 },
                    { moving: movingBox.y, target: height / 2 },
                    { moving: movingBox.y + movingBox.height, target: height / 2 }
                ];
                for (const t of centerTargetsY) {
                    const diff = Math.abs(t.moving - t.target);
                    if (diff < minSnapDistY) {
                        minSnapDistY = diff;
                        bestDy = dy - (t.moving - t.target);
                        newSnapLines.y = t.target;
                    }
                }
            }
            
            if (action.type === 'edit-distribute-path') {
                pos = { x: action.startPoint.x + bestDx, y: action.startPoint.y + bestDy };
            } else {
                pos = { x: action.startPos.x + bestDx, y: action.startPos.y + bestDy };
            }
        }
    }

    if (action.type === 'edit-distribute-path') {
        const dx = pos.x - action.startPoint.x;
        const dy = pos.y - action.startPoint.y;
        
        let newPathState = { ...action.initialDistributePath };
        if (newPathState.type === 'circle') {
            if (action.handle === 'center' || action.handle === 'move-all') {
                newPathState.circleParams = { ...newPathState.circleParams, cx: newPathState.circleParams.cx + dx, cy: newPathState.circleParams.cy + dy };
            } else if (action.handle === 'radius') {
                const dist = Math.hypot(pos.x - newPathState.circleParams.cx, pos.y - newPathState.circleParams.cy);
                newPathState.circleParams = { ...newPathState.circleParams, radius: Math.max(10, dist) };
            } else if (action.handle === 'rotate') {
                const angle = Math.atan2(pos.y - newPathState.circleParams.cy, pos.x - newPathState.circleParams.cx);
                newPathState.angleOffset = (angle + Math.PI / 2) * (180 / Math.PI);
            }
        } else if (newPathState.type === 'line') {
            // Bake rotation into the start and end coordinates if angleOffset is not 0
            let startX = newPathState.lineParams.x1;
            let startY = newPathState.lineParams.y1;
            let endX = newPathState.lineParams.x2;
            let endY = newPathState.lineParams.y2;
            
            if (newPathState.angleOffset !== 0) {
                const mx = (startX + endX) / 2;
                const my = (startY + endY) / 2;
                const len = Math.hypot(endX - startX, endY - startY);
                const baseAngle = Math.atan2(endY - startY, endX - startX);
                const finalAngle = baseAngle + newPathState.angleOffset * Math.PI / 180;
                startX = mx - Math.cos(finalAngle) * (len / 2);
                startY = my - Math.sin(finalAngle) * (len / 2);
                endX = mx + Math.cos(finalAngle) * (len / 2);
                endY = my + Math.sin(finalAngle) * (len / 2);
                newPathState.angleOffset = 0;
                newPathState.lineParams = { ...newPathState.lineParams, x1: startX, y1: startY, x2: endX, y2: endY };
            }
            
            if (action.handle === 'start') {
                newPathState.lineParams = { ...newPathState.lineParams, x1: startX + dx, y1: startY + dy, x2: endX, y2: endY };
            } else if (action.handle === 'end') {
                newPathState.lineParams = { ...newPathState.lineParams, x1: startX, y1: startY, x2: endX + dx, y2: endY + dy };
            } else if (action.handle === 'move-all') {
                newPathState.lineParams = { ...newPathState.lineParams, x1: startX + dx, y1: startY + dy, x2: endX + dx, y2: endY + dy };
            } else if (action.handle === 'rotate') {
                const mx = (startX + endX) / 2;
                const my = (startY + endY) / 2;
                const angle = Math.atan2(pos.y - my, pos.x - mx);
                const baseAngle = Math.atan2(endY - startY, endX - startX);
                newPathState.angleOffset = (angle + Math.PI / 2 - baseAngle) * (180 / Math.PI);
            }
        } else if (newPathState.type === 'shape' && newPathState.shapePathParams?.pathShape) {
            const initialShape = action.initialDistributePath.shapePathParams!.pathShape;
            let updatedShape = { ...initialShape };
            const angleOffset = action.initialDistributePath.angleOffset || 0;
            const center = getShapeCenter(initialShape) || { x: 0, y: 0 };

            if (action.handle === 'shape-move' || action.handle === 'move-all' || action.handle === 'center') {
                updatedShape = translateShape(initialShape, dx, dy);
            } else if (action.handle.startsWith('shape-node-')) {
                const nodeIdx = parseInt(action.handle.replace('shape-node-', ''), 10);
                const localStart = rotatePoint(action.startPoint, center, -angleOffset);
                const localPos = rotatePoint(pos, center, -angleOffset);
                updatedShape = updateShapeNode(initialShape, nodeIdx, localStart, localPos);
            } else if (action.handle.startsWith('shape-resize-')) {
                const localStart = rotatePoint(action.startPoint, center, -angleOffset);
                const localPos = rotatePoint(pos, center, -angleOffset);
                updatedShape = resizeShapeFromCorner(initialShape, action.handle, localStart, localPos);
            } else if (action.handle === 'rotate') {
                const angle = Math.atan2(pos.y - center.y, pos.x - center.x);
                const initialAngle = Math.atan2(action.startPoint.y - center.y, action.startPoint.x - center.x);
                const deltaAngleDeg = (angle - initialAngle) * (180 / Math.PI);
                newPathState.angleOffset = (action.initialDistributePath.angleOffset + deltaAngleDeg);
            } else if (action.handle === 'contour-shift') {
                const localPos = rotatePoint(pos, center, -angleOffset);
                const res = getClosestPointOnShapeContour(initialShape, localPos);
                newPathState.shapePathParams = {
                    ...newPathState.shapePathParams,
                    contourShift: Math.round(res.fraction * 100)
                };
            } else if (action.handle === 'inner-radius' && initialShape.type === 'star') {
                const localPos = rotatePoint(pos, center, -angleOffset);
                const distance = Math.hypot(localPos.x - initialShape.cx, localPos.y - initialShape.cy);
                const newInnerRadius = Math.max(0, Math.min(distance, initialShape.radius));
                updatedShape = { ...initialShape, innerRadius: newInnerRadius };
            }

            newPathState.shapePathParams = {
                ...newPathState.shapePathParams,
                pathShape: updatedShape
            };
        }
        props.onDistributePathChange?.(newPathState);
        setSnapLines(newSnapLines);
        return;
    }
    
    const modifyingActions = ['point-editing', 'arc-angle-editing', 'triangle-vertex-editing', 'star-inner-radius-editing', 'trapezoid-offset-editing', 'parallelogram-angle-editing', 'edit-distribute-path'];
    const isSnappableModifyingAction = modifyingActions.includes(action.type) && (action.type === 'point-editing' || !('rotation' in (action as any).initialShape) || ((action as any).initialShape as any).rotation === 0);

    if ((enableSnapping || showCenterGuides) && (action.type === 'resizing' || action.type === 'drawing' || isSnappableModifyingAction) && !e.altKey && (action.type !== 'resizing' || !('rotation' in (action as any).initialShape) || (action as any).initialShape.rotation === 0)) {
        const SNAP_DIST = 5 / viewTransform.scale;
        
        let bestX = pos.x;
        let bestY = pos.y;
        let minSnapDistX = SNAP_DIST;
        let minSnapDistY = SNAP_DIST;
        
        let snapX = false;
        let snapY = false;
        
        let movingXPoints: { current: number, getPos: (t: number) => number, min?: number, max?: number }[] = [];
        let movingYPoints: { current: number, getPos: (t: number) => number, min?: number, max?: number }[] = [];

        if (action.type === 'resizing') {
            const isHorizontal = action.handle.includes('left') || action.handle.includes('right');
            const isVertical = action.handle.includes('top') || action.handle.includes('bottom');
            const isLineStart = action.handle === 'line-start';
            const isLineEnd = action.handle === 'line-end';

            snapX = isHorizontal || isLineStart || isLineEnd;
            snapY = isVertical || isLineStart || isLineEnd;
            
            if (snapX) {
                movingXPoints.push({ current: pos.x, getPos: t => t });
                if (!isLineStart && !isLineEnd && 'x' in (action as any).initialShape) {
                    const fixedX = action.handle.includes('right') ? (action as any).initialShape.x : (action as any).initialShape.x + (action as any).initialShape.width;
                    movingXPoints.push({ current: (fixedX + pos.x) / 2, getPos: t => 2 * t - fixedX });
                }
            }
            if (snapY) {
                movingYPoints.push({ current: pos.y, getPos: t => t });
                if (!isLineStart && !isLineEnd && 'y' in (action as any).initialShape) {
                    const fixedY = action.handle.includes('bottom') ? (action as any).initialShape.y : (action as any).initialShape.y + (action as any).initialShape.height;
                    movingYPoints.push({ current: (fixedY + pos.y) / 2, getPos: t => 2 * t - fixedY });
                }
            }
        } else if (action.type === 'drawing') {
            snapX = true;
            snapY = true;
            movingXPoints.push({ current: pos.x, getPos: t => t });
            movingYPoints.push({ current: pos.y, getPos: t => t });
            
            if (drawMode === 'corner') {
                movingXPoints.push({ current: (action.startPos.x + pos.x) / 2, getPos: t => 2 * t - action.startPos.x });
                movingYPoints.push({ current: (action.startPos.y + pos.y) / 2, getPos: t => 2 * t - action.startPos.y });
            }
        } else if (isSnappableModifyingAction) {
            snapX = true;
            snapY = true;
            
            const shape = (action as any).initialShape;
            
            let canSnapX = false;
            let canSnapY = false;
            
            let minX = -Infinity;
            let maxX = Infinity;
            let minY = -Infinity;
            let maxY = Infinity;
            
            let handlePos = { ...pos };

            if (action.type === 'point-editing') {
                canSnapX = true;
                canSnapY = true;
                handlePos = pos;
            } else if (action.type === 'trapezoid-offset-editing' && shape.type === 'trapezoid') {
                canSnapX = true;
                canSnapY = false;
                handlePos.y = shape.y;
                if (action.handle === 'left') {
                    minX = shape.x;
                    maxX = shape.x + shape.width * 0.5;
                    handlePos.x = Math.max(minX, Math.min(maxX, pos.x));
                } else if (action.handle === 'right') {
                    minX = shape.x + shape.width * 0.5;
                    maxX = shape.x + shape.width;
                    handlePos.x = Math.max(minX, Math.min(maxX, pos.x));
                }
            } else if (action.type === 'triangle-vertex-editing' && shape.type === 'triangle') {
                canSnapX = true;
                canSnapY = false;
                handlePos.y = shape.y;
                minX = shape.x;
                maxX = shape.x + shape.width;
                handlePos.x = Math.max(minX, Math.min(maxX, pos.x));
            } else if (action.type === 'parallelogram-angle-editing' && shape.type === 'parallelogram') {
                canSnapX = true;
                canSnapY = false;
                handlePos.y = shape.y;
                minX = shape.x;
                maxX = shape.x + shape.width;
                handlePos.x = Math.max(minX, Math.min(maxX, pos.x));
            }

            if (canSnapX) {
                movingXPoints.push({
                    current: handlePos.x,
                    getPos: (t) => t,
                    min: minX,
                    max: maxX
                });
            }
            if (canSnapY) {
                movingYPoints.push({
                    current: handlePos.y,
                    getPos: (t) => t,
                    min: minY,
                    max: maxY
                });
            }
        }

        if (snapX || snapY) {
            let xTargets: number[] = [];
            let yTargets: number[] = [];
            
            if (enableSnapping) {
                const otherShapes = shapes.filter(s => !selectedShapeIds.includes(s.id) && s.groupId === undefined);
                for (const other of otherShapes) {
                    const otherBox = getVisualBoundingBox(other, undefined, shapes);
                    if (!otherBox) continue;
                    const otherCenters = { x: otherBox.x + otherBox.width/2, y: otherBox.y + otherBox.height/2 };
                    if (snapX) xTargets.push(otherBox.x, otherBox.x + otherBox.width, otherCenters.x);
                    if (snapY) yTargets.push(otherBox.y, otherBox.y + otherBox.height, otherCenters.y);
                }
                // Snap to canvas edges
                if (snapX) xTargets.push(0, width);
                if (snapY) yTargets.push(0, height);
            }
            if (showCenterGuides) {
                if (snapX) xTargets.push(width / 2);
                if (snapY) yTargets.push(height / 2);
            }

            if (snapX) {
                for (const t of xTargets) {
                    for (const pt of movingXPoints) {
                        if (pt.min !== undefined && t < pt.min - 0.01) continue;
                        if (pt.max !== undefined && t > pt.max + 0.01) continue;
                        const diff = Math.abs(pt.current - t);
                        if (diff < minSnapDistX) {
                            minSnapDistX = diff;
                            bestX = pt.getPos(t);
                            newSnapLines.x = t;
                        }
                    }
                }
            }
            if (snapY) {
                for (const t of yTargets) {
                    for (const pt of movingYPoints) {
                        if (pt.min !== undefined && t < pt.min - 0.01) continue;
                        if (pt.max !== undefined && t > pt.max + 0.01) continue;
                        const diff = Math.abs(pt.current - t);
                        if (diff < minSnapDistY) {
                            minSnapDistY = diff;
                            bestY = pt.getPos(t);
                            newSnapLines.y = t;
                        }
                    }
                }
            }
            pos = { x: bestX, y: bestY };
        }
    }
    
    setSnapLines(newSnapLines);

    // Drawing action must be checked first
    if (action.type === 'drawing') {
        const { shape, startPos } = action;
        let updatedShape: Shape = shape;

        switch (shape.type) {
            case 'rectangle': {
                let width = Math.abs(pos.x - startPos.x);
                let height = Math.abs(pos.y - startPos.y);

                if (shape.isAspectRatioLocked || e.shiftKey) {
                    width = height = Math.max(width, height);
                }

                if (drawMode === 'corner') {
                    const x = pos.x < startPos.x ? startPos.x - width : startPos.x;
                    const y = pos.y < startPos.y ? startPos.y - height : startPos.y;
                    updatedShape = { ...shape, x, y, width, height };
                } else {
                    if (shape.isAspectRatioLocked || e.shiftKey) {
                      width = height = Math.max(Math.abs(pos.x - startPos.x), Math.abs(pos.y - startPos.y)) * 2;
                    } else {
                      width *= 2;
                      height *= 2;
                    }
                    updatedShape = { ...shape, x: startPos.x - width / 2, y: startPos.y - height / 2, width, height };
                }
                break;
            }
            case 'arc':
            case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': {
                let width = Math.abs(pos.x - startPos.x);
                let height = Math.abs(pos.y - startPos.y);
                
                if (('isAspectRatioLocked' in shape && shape.isAspectRatioLocked) || e.shiftKey) {
                    width = height = Math.max(width, height);
                }

                if (drawMode === 'corner') {
                     const x = pos.x < startPos.x ? startPos.x - width : startPos.x;
                     const y = pos.y < startPos.y ? startPos.y - height : startPos.y;
                     updatedShape = { ...shape, x, y, width, height };
                } else {
                    if (('isAspectRatioLocked' in shape && shape.isAspectRatioLocked) || e.shiftKey) {
                        width = height = Math.max(Math.abs(pos.x - startPos.x), Math.abs(pos.y - startPos.y)) * 2;
                    } else {
                        width *= 2;
                        height *= 2;
                    }
                    updatedShape = { ...shape, x: startPos.x - width / 2, y: startPos.y - height / 2, width, height };
                }
                break;
            }
            case 'ellipse': {
                const dx = pos.x - startPos.x;
                const dy = pos.y - startPos.y;

                if (shape.isAspectRatioLocked || e.shiftKey) {
                    const dist = Math.hypot(dx, dy);
                    const r = drawMode === 'center' ? dist : dist / 2;
                    const cx = drawMode === 'center' ? startPos.x : startPos.x + dx / 2;
                    const cy = drawMode === 'center' ? startPos.y : startPos.y + dy / 2;
                    updatedShape = { ...shape, cx, cy, rx: r, ry: r };
                } else {
                    const rx = drawMode === 'center' ? Math.abs(dx) : Math.abs(dx) / 2;
                    const ry = drawMode === 'center' ? Math.abs(dy) : Math.abs(dy) / 2;
                    const cx = drawMode === 'center' ? startPos.x : startPos.x + dx / 2;
                    const cy = drawMode === 'center' ? startPos.y + dy / 2 : startPos.y + dy / 2;
                    updatedShape = { ...shape, cx, cy, rx, ry };
                }
                break;
            }
            case 'line': {
                updatedShape = { ...shape, points: [startPos, pos] };
                break;
            }
            case 'pencil': {
                const lastPoint = shape.points[shape.points.length - 1];
                if (!lastPoint || Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y) >= 2) {
                    updatedShape = { ...shape, points: [...shape.points, pos] };
                } else {
                    return;
                }
                break;
            }
            case 'polygon': case 'star': {
                let cx: number, cy: number, radius: number;
                if (drawMode === 'corner') {
                    const width = Math.abs(pos.x - startPos.x);
                    const height = Math.abs(pos.y - startPos.y);
                    cx = startPos.x + (pos.x - startPos.x) / 2;
                    cy = startPos.y + (pos.y - startPos.y) / 2;
                    radius = Math.min(width, height) / 2;
                } else { // center mode
                    cx = startPos.x;
                    cy = startPos.y;
                    radius = Math.hypot(pos.x - startPos.x, pos.y - startPos.y);
                }
                const innerRadius = shape.type === 'star' ? radius / 2 : undefined;
                updatedShape = { ...shape, cx, cy, radius, innerRadius };
                break;
            }
        }
        setAction({ ...action, shape: updatedShape });
        return;
    }

    if (action.type === 'panning') {
        const dx = e.clientX - action.initialPos.x;
        const dy = e.clientY - action.initialPos.y;
        setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    if (action.type === 'selecting') {
        setAction({ ...action, currentPos: pos });
        return;
    }
        
    const shapeToTransform = activeTransformShape ?? ('initialShape' in action ? (action as any).initialShape : null);
    if (!shapeToTransform) return;
        
    let updatedShape: Shape = shapeToTransform!;

    switch(action.type) {
        case 'point-editing': {
            // The pointIndex and stable center are the only things needed from the action for this logic.
            const { pointIndex, center } = action;
            
            // CRITICAL FIX: Use shapeToTransform, which holds the cumulative changes from the drag,
            // as the base for the next update. Do NOT use (action as any).initialShape.
            const targetShape = shapeToTransform as PolylineShape | PathShape | BezierCurveShape | LineShape;
            
            // Get rotation from the current shape being transformed.
            const rotation = 'rotation' in targetShape ? targetShape.rotation : 0;
            
            // Un-rotate the current mouse position to find its location in the shape's local coordinate system.
            let finalPos = pos;
            if (rotation !== 0) {
                // Use the stable center from the action object.
                finalPos = rotatePoint(pos, center, -rotation);
            }

            // Update the single point that is being dragged.
            const newPoints = [...targetShape.points];
            newPoints[pointIndex] = finalPos;
            
            // Create the new temporary shape for this frame.
            updatedShape = { ...targetShape, points: newPoints as any };
            break;
        }
        
        case 'arc-angle-editing': {
            const { initialShape, handle, center, initialMouseAngle } = action;
            const isChiralityFlipped = (!!initialShape.isFlippedHorizontally) !== (!!initialShape.isFlippedVertically);

            // Get current angle in a CCW system (Y-up)
            const currentMouseAngle = Math.atan2(-(pos.y - center.y), pos.x - center.x) * 180 / Math.PI;
            
            // Calculate delta from the start of the drag, handling the -180/180 degree jump
            let angleDelta = currentMouseAngle - initialMouseAngle;
            if (angleDelta > 180) angleDelta -= 360;
            if (angleDelta < -180) angleDelta += 360;

            const effectiveDelta = isChiralityFlipped ? -angleDelta : angleDelta;
    
            if (handle === 'move' || initialShape.isExtentLocked) {
                updatedShape = { ...initialShape, start: initialShape.start + effectiveDelta };
            } else { // Unlocked and start/end handle
                if (handle === 'start') {
                    const newStart = initialShape.start + effectiveDelta;
                    const newExtent = initialShape.extent - effectiveDelta;
                    updatedShape = { ...initialShape, start: newStart, extent: wrapAngle(newExtent) };
                } else { // handle === 'end'
                    const newExtent = initialShape.extent + effectiveDelta;
                    updatedShape = { ...initialShape, extent: wrapAngle(newExtent) };
                }
            }
            break;
        }
        case 'triangle-vertex-editing': {
            const { initialShape } = action;
            const center = getShapeCenter(initialShape);
            if (!center || initialShape.width === 0) break;

            const unrotatedMousePos = rotatePoint(pos, center, -initialShape.rotation);
            
            // Calculate new offset relative to the center of the base
            const newOffset = (unrotatedMousePos.x - (initialShape.x + initialShape.width / 2)) / initialShape.width;

            updatedShape = { ...initialShape, topVertexOffset: newOffset };
            break;
        }
        case 'star-inner-radius-editing': {
            const { initialShape, center } = action;
            if (initialShape.type !== 'star') break;

            const distance = Math.hypot(pos.x - center.x, pos.y - center.y);
            
            // Clamp the inner radius to be between 0 and the outer radius.
            const newInnerRadius = Math.max(0, Math.min(distance, initialShape.radius));
            
            updatedShape = { ...initialShape, innerRadius: newInnerRadius };
            break;
        }
        case 'trapezoid-offset-editing': {
            const { initialShape, handle } = action;
            const center = getShapeCenter(initialShape);
            if (!center || initialShape.width === 0) break;

            const unrotatedMousePos = rotatePoint(pos, center, -initialShape.rotation);
            
            let newLeftRatio = initialShape.topLeftOffsetRatio;
            let newRightRatio = initialShape.topRightOffsetRatio;

            if (handle === 'left') {
                const newLeftOffset = unrotatedMousePos.x - initialShape.x;
                newLeftRatio = newLeftOffset / initialShape.width;
                if (initialShape.isSymmetrical) {
                    newRightRatio = newLeftRatio;
                }
            } else { // handle === 'right'
                const newRightOffset = (initialShape.x + initialShape.width) - unrotatedMousePos.x;
                newRightRatio = newRightOffset / initialShape.width;
                if (initialShape.isSymmetrical) {
                    newLeftRatio = newRightRatio;
                }
            }
            
            if (initialShape.isSymmetrical) {
                if (newLeftRatio >= 0.5) {
                    newLeftRatio = 0.49;
                    newRightRatio = 0.49;
                }
            } else {
                if (newLeftRatio + newRightRatio >= 1) {
                    if (handle === 'left') {
                        newLeftRatio = 0.99 - newRightRatio;
                    } else {
                        newRightRatio = 0.99 - newLeftRatio;
                    }
                }
            }

            updatedShape = { 
                ...initialShape, 
                topLeftOffsetRatio: newLeftRatio,
                topRightOffsetRatio: newRightRatio,
            };
            break;
        }
        case 'parallelogram-angle-editing': {
            const { initialShape } = action;
            const center = getShapeCenter(initialShape);
            if (!center || initialShape.height === 0) break;
    
            const unrotatedMousePos = rotatePoint(pos, center, -initialShape.rotation);
            
            // The horizontal position of the mouse determines the new offset.
            const newOffset = unrotatedMousePos.x - initialShape.x;

            // To prevent the base width from becoming negative, the absolute offset
            // must be less than the total visual width.
            // Calculate base width from the prospective new offset
            const baseWidth = initialShape.width - Math.abs(newOffset);
            
            // If base width would be zero or negative, stop the interaction.
            if (baseWidth <= 0) break;
            
            // Convert offset back to an angle
            let newAngle = Math.atan2(initialShape.height, newOffset) * 180 / Math.PI;

            // Clamp angle to valid range.
            newAngle = Math.max(1, Math.min(179, newAngle));
    
            updatedShape = { ...initialShape, angle: newAngle };
            break;
        }
        case 'duplicating':
        case 'dragging': {
            let dx = pos.x - action.startPos.x;
            let dy = pos.y - action.startPos.y;

            if (e.shiftKey) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    dy = 0; // Constrain to horizontal movement
                } else {
                    dx = 0; // Constrain to vertical movement
                }
            }

            const { initialShape } = action;

            switch (initialShape.type) {
                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                  updatedShape = { ...initialShape, x: initialShape.x + dx, y: initialShape.y + dy };
                  break;
                case 'ellipse': case 'polygon': case 'star':
                  updatedShape = { ...initialShape, cx: initialShape.cx + dx, cy: initialShape.cy + dy };
                  break;
                case 'line':
                case 'bezier':
                case 'pencil': 
                case 'polyline':
                  updatedShape = { ...initialShape, points: initialShape.points.map(p => ({ x: p.x + dx, y: p.y + dy })) as any };
                  break;
                case 'group':
                  updatedShape = { ...initialShape };
                  if ((updatedShape as any).rotationCenter) {
                      (updatedShape as any).rotationCenter = { x: (updatedShape as any).rotationCenter.x + dx, y: (updatedShape as any).rotationCenter.y + dy };
                  }
                  break;
            }
            break;
        }
        case 'resizing': {
            const { initialShape, handle, anchorPointGlobal, initialShapeProps } = action;
            const { bbox: initialBbox, rotationCenter, geometricCenter } = initialShapeProps;

            if (handle === 'line-start' || handle === 'line-end') {
                const newPoints = handle === 'line-start'
                    ? [pos, anchorPointGlobal]
                    : [anchorPointGlobal, pos];
                updatedShape = { ...(initialShape as LineShape), points: newPoints as any, rotation: 0 };
                break;
            }
        
            const mousePosLocal = rotatePoint(pos, rotationCenter, -initialShape.rotation);
            const anchorPointLocal = rotatePoint(anchorPointGlobal, rotationCenter, -initialShape.rotation);

            let isCrossedH = false;
            if (handle.includes('right')) {
                isCrossedH = mousePosLocal.x < anchorPointLocal.x;
            } else if (handle.includes('left')) {
                isCrossedH = mousePosLocal.x > anchorPointLocal.x;
            }

            let isCrossedV = false;
            if (handle.includes('bottom')) {
                isCrossedV = mousePosLocal.y < anchorPointLocal.y;
            } else if (handle.includes('top')) {
                isCrossedV = mousePosLocal.y > anchorPointLocal.y;
            }

            let newBbox: { x: number, y: number, width: number, height: number};
            
            const isHorizontalHandle = handle.includes('left') || handle.includes('right');
            const isVerticalHandle = handle.includes('top') || handle.includes('bottom');
            
            const isLocked = ('isAspectRatioLocked' in initialShape && initialShape.isAspectRatioLocked) || initialShape.type === 'text' || e.shiftKey;

            if (isHorizontalHandle && isVerticalHandle) { // Corner handle
                let width = Math.abs(mousePosLocal.x - anchorPointLocal.x);
                let height = Math.abs(mousePosLocal.y - anchorPointLocal.y);
                
                if (isLocked && (initialBbox.width > 0 || initialBbox.height > 0)) {
                     const aspectRatio = initialBbox.width / initialBbox.height;
                     if (width / initialBbox.width > height / initialBbox.height) {
                        height = width / aspectRatio;
                    } else {
                        width = height * aspectRatio;
                    }
                }
                
                let x = anchorPointLocal.x;
                if (handle.includes('right')) {
                    x = isCrossedH ? anchorPointLocal.x - width : anchorPointLocal.x;
                } else if (handle.includes('left')) {
                    x = isCrossedH ? anchorPointLocal.x : anchorPointLocal.x - width;
                }

                let y = anchorPointLocal.y;
                if (handle.includes('bottom')) {
                    y = isCrossedV ? anchorPointLocal.y - height : anchorPointLocal.y;
                } else if (handle.includes('top')) {
                    y = isCrossedV ? anchorPointLocal.y : anchorPointLocal.y - height;
                }

                newBbox = { x, y, width, height };
                
            } else if (isLocked) { // Locked side handle
                const aspectRatio = (initialBbox.height === 0 || initialBbox.width === 0) ? 1 : initialBbox.width / initialBbox.height;
                if (isHorizontalHandle) {
                    const width = Math.abs(mousePosLocal.x - anchorPointLocal.x);
                    const height = width / aspectRatio;
                    const x = handle.includes('right')
                        ? (isCrossedH ? anchorPointLocal.x - width : anchorPointLocal.x)
                        : (isCrossedH ? anchorPointLocal.x : anchorPointLocal.x - width);
                    newBbox = {
                        x,
                        y: (initialBbox.y + initialBbox.height / 2) - height / 2,
                        width,
                        height,
                    };
                } else { // Vertical handle
                    const height = Math.abs(mousePosLocal.y - anchorPointLocal.y);
                    const width = height * aspectRatio;
                    const y = handle.includes('bottom')
                        ? (isCrossedV ? anchorPointLocal.y - height : anchorPointLocal.y)
                        : (isCrossedV ? anchorPointLocal.y : anchorPointLocal.y - height);
                    newBbox = {
                        x: (initialBbox.x + initialBbox.width / 2) - width / 2,
                        y,
                        width,
                        height,
                    };
                }
            } else { // Unlocked side handle
                if (isHorizontalHandle) {
                    const width = Math.abs(mousePosLocal.x - anchorPointLocal.x);
                    const x = handle.includes('right')
                        ? (isCrossedH ? anchorPointLocal.x - width : anchorPointLocal.x)
                        : (isCrossedH ? anchorPointLocal.x : anchorPointLocal.x - width);
                    newBbox = {
                        x,
                        y: initialBbox.y,
                        width,
                        height: initialBbox.height
                    };
                } else { // Vertical handle
                     const height = Math.abs(mousePosLocal.y - anchorPointLocal.y);
                     const y = handle.includes('bottom')
                         ? (isCrossedV ? anchorPointLocal.y - height : anchorPointLocal.y)
                         : (isCrossedV ? anchorPointLocal.y : anchorPointLocal.y - height);
                     newBbox = {
                        x: initialBbox.x,
                        y,
                        width: initialBbox.width,
                        height
                    };
                }
            }
            
            const isShapeCollapsible = ['line', 'pencil', 'polyline', 'bezier'].includes(initialShape.type);
            if (isShapeCollapsible) {
                newBbox.width = Math.max(1, newBbox.width);
                newBbox.height = Math.max(1, newBbox.height);
            }

            const { width: newWidth, height: newHeight } = newBbox;
            
            const newLocalCenter = {
                x: newBbox.x + newWidth / 2,
                y: newBbox.y + newHeight / 2
            };
            
            const centerShift = {
                x: newLocalCenter.x - (initialBbox.x + initialBbox.width / 2),
                y: newLocalCenter.y - (initialBbox.y + initialBbox.height / 2),
            };

            const rotatedCenterShift = rotatePoint(centerShift, {x:0, y:0}, initialShape.rotation);
            const newGlobalCenter = {
                x: geometricCenter.x + rotatedCenterShift.x,
                y: geometricCenter.y + rotatedCenterShift.y,
            };
            
            const initialFlipH = ('isFlippedHorizontally' in initialShape) ? !!(initialShape as any).isFlippedHorizontally : false;
            const initialFlipV = ('isFlippedVertically' in initialShape) ? !!(initialShape as any).isFlippedVertically : false;

            const targetFlipH = isCrossedH ? !initialFlipH : initialFlipH;
            const targetFlipV = isCrossedV ? !initialFlipV : initialFlipV;

            switch(initialShape.type) {
                case 'text': {
                    const oldBbox = getTextBoundingBox(initialShape)!;
                    if (!oldBbox || oldBbox.width <= 0 || oldBbox.height <= 0) break;

                    const scale = (isVerticalHandle && !isHorizontalHandle)
                        ? newHeight / oldBbox.height
                        : newWidth / oldBbox.width;
                    const newFontSize = Math.max(0.1, initialShape.fontSize * scale);

                    const anchor = initialShape.anchor || 'nw';
                    let anchorRelX = 0;
                    if (['n', 's', 'center'].includes(anchor)) anchorRelX = 0.5;
                    else if (['ne', 'e', 'se'].includes(anchor)) anchorRelX = 1.0;

                    let anchorRelY = 0;
                    if (['w', 'e', 'center'].includes(anchor)) anchorRelY = 0.5;
                    else if (['sw', 's', 'se'].includes(anchor)) anchorRelY = 1.0;

                    const newAnchorLocalX = newBbox.x + anchorRelX * newWidth;
                    const newAnchorLocalY = newBbox.y + anchorRelY * newHeight;

                    const newAnchorGlobal = rotatePoint(
                        { x: newAnchorLocalX, y: newAnchorLocalY },
                        rotationCenter,
                        initialShape.rotation
                    );

                    updatedShape = { 
                        ...initialShape, 
                        fontSize: parseFloat(newFontSize.toFixed(1)), 
                        x: newAnchorGlobal.x, 
                        y: newAnchorGlobal.y,
                        isFlippedHorizontally: targetFlipH,
                        isFlippedVertically: targetFlipV
                    };
                    break;
                }
                case 'triangle': {
                    const tri = initialShape as IsoscelesTriangleShape;
                    const topVertexOffset = isCrossedH ? -(tri.topVertexOffset || 0) : (tri.topVertexOffset || 0);
                    const finalFlipV = isCrossedV ? !tri.isFlippedVertically : !!tri.isFlippedVertically;

                    const newVisualX_global = newGlobalCenter.x - newWidth / 2;
                    const newVisualY_global = newGlobalCenter.y - newHeight / 2;

                    updatedShape = {
                        ...tri,
                        x: newVisualX_global,
                        y: newVisualY_global,
                        width: newWidth,
                        height: newHeight,
                        topVertexOffset,
                        isFlippedVertically: finalFlipV
                    };
                    break;
                }
                case 'trapezoid': {
                    const trap = initialShape as TrapezoidShape;
                    let leftRatio = trap.topLeftOffsetRatio;
                    let rightRatio = trap.topRightOffsetRatio;
                    if (isCrossedH) {
                        leftRatio = trap.topRightOffsetRatio;
                        rightRatio = trap.topLeftOffsetRatio;
                    }
                    const finalFlipV = isCrossedV ? !trap.isFlippedVertically : !!trap.isFlippedVertically;

                    const newVisualX_global = newGlobalCenter.x - newWidth / 2;
                    const newVisualY_global = newGlobalCenter.y - newHeight / 2;

                    updatedShape = {
                        ...trap,
                        x: newVisualX_global,
                        y: newVisualY_global,
                        width: newWidth,
                        height: newHeight,
                        topLeftOffsetRatio: leftRatio,
                        topRightOffsetRatio: rightRatio,
                        isFlippedVertically: finalFlipV
                    };
                    break;
                }
                case 'rectangle':
                case 'right-triangle':
                case 'rhombus':
                case 'parallelogram':
                case 'arc':
                case 'image':
                case 'bitmap': {
                    const newX = newGlobalCenter.x - newWidth / 2;
                    const newY = newGlobalCenter.y - newHeight / 2;
                    let extraProps: any = {
                        isFlippedHorizontally: targetFlipH,
                        isFlippedVertically: targetFlipV,
                    };

                    if (initialShape.type === 'parallelogram') {
                        const angle = isCrossedH ? 180 - initialShape.angle : initialShape.angle;
                        extraProps.angle = angle;
                        extraProps.isFlippedVertically = isCrossedV ? !initialShape.isFlippedVertically : !!initialShape.isFlippedVertically;
                    }

                    updatedShape = { ...initialShape, x: newX, y: newY, width: newWidth, height: newHeight, ...extraProps };
                    break;
                }
                case 'ellipse': {
                    const newRx = newWidth / 2;
                    const newRy = newHeight / 2;
                    updatedShape = {
                        ...initialShape,
                        cx: newGlobalCenter.x,
                        cy: newGlobalCenter.y,
                        rx: newRx,
                        ry: newRy,
                        isFlippedHorizontally: targetFlipH,
                        isFlippedVertically: targetFlipV,
                    };
                    break;
                }
                case 'polygon':
                case 'star': {
                    const scaleX = initialBbox.width > 0 ? newWidth / initialBbox.width : 1;
                    const scaleY = initialBbox.height > 0 ? newHeight / initialBbox.height : 1;
                    const scale = Math.max(scaleX, scaleY);
                    
                    const newRadius = initialShape.radius * scale;
                    let newInnerRadius = initialShape.innerRadius;
                    if (initialShape.type === 'star' && initialShape.innerRadius !== undefined) {
                        newInnerRadius = initialShape.innerRadius * scale;
                    }
                    updatedShape = {
                        ...initialShape,
                        cx: newGlobalCenter.x,
                        cy: newGlobalCenter.y,
                        radius: newRadius,
                        innerRadius: newInnerRadius,
                        isFlippedHorizontally: targetFlipH,
                        isFlippedVertically: targetFlipV,
                    };
                    break;
                }
                case 'line':
                case 'bezier':
                case 'pencil':
                case 'polyline': {
                    const scaleX = initialBbox.width !== 0 ? newWidth / initialBbox.width : 1;
                    const scaleY = initialBbox.height !== 0 ? newHeight / initialBbox.height : 1;

                    const flipFactorX = isCrossedH ? -1 : 1;
                    const flipFactorY = isCrossedV ? -1 : 1;

                    const scaledPoints = initialShape.points.map(p => ({
                        x: anchorPointLocal.x + (p.x - anchorPointLocal.x) * scaleX * flipFactorX,
                        y: anchorPointLocal.y + (p.y - anchorPointLocal.y) * scaleY * flipFactorY,
                    }));

                    const newGlobalUnrotatedTopLeft = {
                        x: newGlobalCenter.x - newBbox.width / 2,
                        y: newGlobalCenter.y - newBbox.height / 2,
                    };

                    const translation = {
                        x: newGlobalUnrotatedTopLeft.x - newBbox.x,
                        y: newGlobalUnrotatedTopLeft.y - newBbox.y,
                    };

                    const finalPoints = scaledPoints.map(p => ({
                        x: p.x + translation.x,
                        y: p.y + translation.y,
                    }));
                    
                    updatedShape = { ...initialShape, points: finalPoints as any };
                    break;
                }
                case 'group': {
                    updatedShape = { ...initialShape, _newBbox: { x: newGlobalCenter.x - newWidth / 2, y: newGlobalCenter.y - newHeight / 2, width: newWidth, height: newHeight }, rotationCenter: newGlobalCenter } as any;
                    break;
                }
            }
            break;
        }
        case 'rotating': {
            const { center, startAngle: startAngleOffset, initialShape } = action;
            if (!('rotation' in initialShape)) break;

            const currentMouseAngleRad = Math.atan2(-(pos.y - center.y), pos.x - center.x);
            const newRotationRad = currentMouseAngleRad + startAngleOffset;
            let newRotationDeg = newRotationRad * 180 / Math.PI;

            // Round the rotation to the nearest integer for mouse rotation
            newRotationDeg = ((newRotationDeg % 360) + 360) % 360;
            newRotationDeg = Math.round(newRotationDeg);
            if (newRotationDeg === 360) newRotationDeg = 0;

            updatedShape = { ...initialShape, rotation: newRotationDeg };
            break;
        }
    }
    
    // Simulate resizing, rotating, or translating for other selected shapes
    let auxShapes: Shape[] = [];
    
    // Calculate affected shapes including children of groups
    const affectedShapeIds: string[] = [];
    const getAffectedIds = (id: string) => {
        const realId = id.replace('-preview', '');
        if (!affectedShapeIds.includes(realId)) affectedShapeIds.push(realId);
        const s = shapes.find(sh => sh.id === realId);
        if (s?.type === 'group' && s.shapeIds) {
            s.shapeIds.forEach(getAffectedIds);
        }
    };
    selectedShapeIds.forEach(getAffectedIds);
    if ((action as any).initialShape) getAffectedIds((action as any).initialShape.id);

    const getRootSelectedId = (id: string): string => {
        const realId = id.replace('-preview', '');
        if (selectedShapeIds.includes(realId)) return realId;
        const parent = shapes.find(g => g.type === 'group' && g.shapeIds?.includes(id));
        if (parent) return getRootSelectedId(parent.id);
        return id;
    };

    if ((action.type === 'resizing' || action.type === 'rotating' || action.type === 'dragging' || action.type === 'duplicating') && affectedShapeIds.length > 1 && updatedShape) {
        if (action.type === 'rotating') {
            const rotShape = updatedShape as Shape & RotatableShape;
            const initShape = (action as any).initialShape as Shape & RotatableShape;
            const deltaRot = (rotShape.rotation ?? 0) - (initShape.rotation ?? 0);
            
            auxShapes = affectedShapeIds
                .filter(id => id !== (action as any).initialShape.id.replace('-preview', ''))
                .map(id => {
                    const s = shapes.find(sh => sh.id === id);
                    if (!s) return null;
                    const c = getShapeCenter(s, shapes);
                    if (!c) return s;
                    
                    const rootId = getRootSelectedId(s.id);
                    let rotCenter = action.center;
                    if (rootId !== (action as any).initialShape.id) {
                        const rootShape = shapes.find(sh => sh.id === rootId);
                        rotCenter = rootShape ? (getShapeCenter(rootShape, shapes) || c) : c;
                    }
                    
                    const rotatedC = rotatePoint(c, rotCenter, deltaRot);
                    const dx = rotatedC.x - c.x;
                    const dy = rotatedC.y - c.y;
                    
                    let newS = { ...s };
                    if ('rotation' in newS) {
                        newS.rotation = ((newS.rotation || 0) + deltaRot) % 360;
                    }
                    switch (newS.type) {
                        case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                            newS.x += dx; newS.y += dy; break;
                        case 'ellipse': case 'polygon': case 'star':
                            (newS as any).cx += dx; (newS as any).cy += dy; break;
                        case 'line': case 'bezier': case 'pencil': case 'polyline':
                            (newS as any).points = (newS as any).points.map((p: any) => ({ x: p.x + dx, y: p.y + dy })); break;
                    }
                    return newS;
                }).filter(Boolean) as Shape[];
        } else if (action.type === 'resizing') {
            if (action.handle === 'line-start' || action.handle === 'line-end') {
                const initLine = (action as any).initialShape as LineShape;
                const newPoints = (updatedShape as LineShape).points;
                const dx = newPoints[0].x - initLine.points[0].x;
                const dy = newPoints[0].y - initLine.points[0].y;
                const dxEnd = newPoints[1].x - initLine.points[1].x;
                const dyEnd = newPoints[1].y - initLine.points[1].y;

                auxShapes = affectedShapeIds
                    .filter(id => id !== (action as any).initialShape.id.replace('-preview', ''))
                    .map(id => {
                        const s = shapes.find(sh => sh.id === id);
                        if (s && s.type === 'line') {
                            const pl = s as LineShape;
                            return { ...pl, points: [
                                { x: pl.points[0].x + dx, y: pl.points[0].y + dy },
                                { x: pl.points[1].x + dxEnd, y: pl.points[1].y + dyEnd }
                            ]};
                        }
                        return s;
                    }).filter(Boolean) as Shape[];
            } else {
                const oldBbox = (action as any).initialShapeProps.bbox;
                const newBbox = (updatedShape as any)._newBbox || getBoundingBox({ ...updatedShape, rotation: 0 }, shapes);
                // We shouldn't strictly require oldBbox.width > 0 && oldBbox.height > 0
                // For lines/rectangles it could be 0. But let's keep it safe.
                if (oldBbox && newBbox) {
                    const safeOldW = oldBbox.width === 0 ? 1 : oldBbox.width;
                    const safeOldH = oldBbox.height === 0 ? 1 : oldBbox.height;
                    const scaleX = newBbox.width / safeOldW;
                    const scaleY = newBbox.height / safeOldH;
                    
                    auxShapes = affectedShapeIds
                        .filter(id => id !== (action as any).initialShape.id.replace('-preview', ''))
                        .map(id => {
                            const s = shapes.find(sh => sh.id === id);
                            if (!s) return null;
                            
                            // Scale proportionally relative to corresponding anchor
                            const sBbox = getBoundingBox({ ...s, rotation: 0 }, shapes);
                            if (!sBbox) return s;
                            
                            // We approximate scaling for simple cases
                            const newW = sBbox.width * scaleX;
                            const newH = sBbox.height * scaleY;
                            
                            const rootId = getRootSelectedId(s.id);
                            let simulatedX, simulatedY;
                            
                            if (rootId === (action as any).initialShape.id) {
                                simulatedX = newBbox.x + (sBbox.x - oldBbox.x) * scaleX;
                                simulatedY = newBbox.y + (sBbox.y - oldBbox.y) * scaleY;
                            } else {
                                simulatedX = sBbox.x;
                                if (action.handle.includes('left')) {
                                    simulatedX = sBbox.x + sBbox.width - newW;
                                } else if (action.handle.includes('right')) {
                                    simulatedX = sBbox.x;
                                } else {
                                    simulatedX = sBbox.x + sBbox.width / 2 - newW / 2;
                                }
    
                                simulatedY = sBbox.y;
                                if (action.handle.includes('top')) {
                                    simulatedY = sBbox.y + sBbox.height - newH;
                                } else if (action.handle.includes('bottom')) {
                                    simulatedY = sBbox.y;
                                } else {
                                    simulatedY = sBbox.y + sBbox.height / 2 - newH / 2;
                                }
                            }
                            
                            if (['rectangle', 'image', 'bitmap', 'arc', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'text'].includes(s.type)) {
                                 return { ...s, x: simulatedX, y: simulatedY, width: newW, height: newH } as Shape;
                            } else if (s.type === 'ellipse') {
                                 const eShape = s as EllipseShape;
                                 return { ...eShape, cx: simulatedX + newW / 2, cy: simulatedY + newH / 2, rx: eShape.rx * scaleX, ry: eShape.ry * scaleY };
                            } else if (s.type === 'polygon' || s.type === 'star') {
                                 return { ...s, cx: simulatedX + newW / 2, cy: simulatedY + newH / 2, radius: (s as any).radius * Math.max(scaleX, scaleY) } as Shape;
                            } else if (['line', 'bezier', 'pencil', 'polyline'].includes(s.type)) {
                                const pl = s as PolylineShape;
                                return { ...pl, points: pl.points.map(p => ({ x: simulatedX + (p.x - sBbox.x) * scaleX, y: simulatedY + (p.y - sBbox.y) * scaleY })) };
                            }
                            
                            return s;
                        }).filter(Boolean) as Shape[];
                }
            }
        } else if (action.type === 'dragging' || action.type === 'duplicating') {
            const dx = pos.x - action.startPos.x;
            let finalDx = dx;
            let finalDy = pos.y - action.startPos.y;
            if (e.shiftKey) {
                if (Math.abs(finalDx) > Math.abs(finalDy)) {
                    finalDy = 0;
                } else {
                    finalDx = 0;
                }
            }
            
            auxShapes = affectedShapeIds
                .filter(id => id !== (action as any).initialShape.id.replace('-preview', ''))
                .map(id => {
                    const s = shapes.find(sh => sh.id === id);
                    if (!s) return null;
                    switch (s.type) {
                        case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'text': case 'image': case 'bitmap':
                            return { ...s, x: s.x + finalDx, y: s.y + finalDy };
                        case 'ellipse': case 'polygon': case 'star':
                            return { ...s, cx: s.cx + finalDx, cy: s.cy + finalDy };
                        case 'line': case 'bezier': case 'pencil': case 'polyline':
                            return { ...s, points: (s as any).points.map((p: any) => ({ x: p.x + finalDx, y: p.y + finalDy })) };
                        case 'group':
                            if ((s as any).rotationCenter) {
                                return { ...s, rotationCenter: { x: (s as any).rotationCenter.x + finalDx, y: (s as any).rotationCenter.y + finalDy } };
                            }
                            return s;
                        default:
                            return s;
                    }
                }).filter(Boolean) as Shape[];
        }
    }
    
    setActiveTransformShape(updatedShape);
    setAuxiliaryTransformShapes(auxShapes);
  }, [action, drawMode, activeTransformShape, getTransformedPointerPosition, setViewTransform, getPointerPosition, setCursorPos, shapes, selectedShapeIds]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingAnchorRef.current) {
        return;
    }
    if ((e as any).type === 'touchend' && props.touchDrawingMode === 'tap-drag') {
        const rawPos = getPointerPosition(e);
        const pos = getTransformedPointerPosition(rawPos);
        if (isDrawingBezier) {
            setBezierPoints(prev => [...prev, pos]);
            return;
        }
        if (isDrawingPolyline) {
            setPolylinePoints(prev => [...prev, pos]);
            return;
        }
    }

    // If a pan was started with the left mouse but not dragged, it's a click on empty space -> deselect.
    // This prevents deselecting when middle-mouse panning.
    if (action?.type === 'panning' && !hasDraggedRef.current && e.button === 0) {
        onSelectShape(null);
    }
    
    if (action?.type === 'selecting') {
        if (hasDraggedRef.current) {
            const minX = Math.min(action.startPos.x, action.currentPos.x);
            const minY = Math.min(action.startPos.y, action.currentPos.y);
            const maxX = Math.max(action.startPos.x, action.currentPos.x);
            const maxY = Math.max(action.startPos.y, action.currentPos.y);
            
            const rect = { minX, minY, maxX, maxY };
            const selectedSet = new Set<string>();

            const getRootId = (id: string): string => {
                const shape = shapes.find(s => s.id === id);
                if (shape && shape.groupId) {
                    return getRootId(shape.groupId);
                }
                const groupParent = shapes.find(g => g.type === 'group' && g.shapeIds?.includes(id));
                if (groupParent) {
                    return getRootId(groupParent.id);
                }
                return id;
            };

            shapes.forEach(shape => {
                if (shape.state === 'disabled' || shape.state === 'hidden' || lockedShapeIds.has(shape.id)) return;
                if (shape.type === 'group') return;

                if (isShapeIntersectingRect(shape, rect, shapes)) {
                    const rootId = getRootId(shape.id);
                    const rootShape = shapes.find(s => s.id === rootId);
                    if (rootShape && rootShape.state !== 'disabled' && rootShape.state !== 'hidden' && !lockedShapeIds.has(rootId)) {
                        selectedSet.add(rootId);
                    }
                }
            });

            let selectedIds = Array.from(selectedSet);
            if (isMultiSelectMode || e.shiftKey || e.ctrlKey || e.metaKey) {
                selectedIds = Array.from(new Set([...selectedShapeIds, ...selectedIds]));
            }
            if (selectedIds.length > 1) {
                setIsMultiSelectMode?.(true);
            }

            onSelectShape(selectedIds.length > 0 ? selectedIds : null);
        } else {
            onSelectShape(null);
            setIsMultiSelectMode?.(false);
        }
    }
    
    if (action?.type === 'drawing' && hasDraggedRef.current) {
        const { shape } = action;
        if (('width' in shape && 'height' in shape && (shape.width <= DRAG_THRESHOLD || shape.height <= DRAG_THRESHOLD)) ||
            ('rx' in shape && (shape.rx * 2 <= DRAG_THRESHOLD || shape.ry * 2 <= DRAG_THRESHOLD)) || 
            ('radius' in shape && shape.radius <= DRAG_THRESHOLD)) {
           // Shape too small
        } else if (shape.type === 'line' && Math.hypot(shape.points[1].x - shape.points[0].x, shape.points[1].y - shape.points[0].y) <= DRAG_THRESHOLD) {
          // Line too short
        } else if (shape.type === 'pencil' && shape.points.length <= 2) {
          // Pencil stroke too short
        } else {
            addShape(shape);
        }
    } else if (action?.type === 'duplicating' && activeTransformShapeRef.current) {
        if (hasDraggedRef.current) {
            const timeStr = new Date().getTime();
            const idMap = new Map<string, string>();
            
            const newShape = { 
                ...activeTransformShapeRef.current, 
                id: `dup-${timeStr}-0`,
                groupId: activeTransformShapeRef.current.groupId // Will be patched later if it belongs to a parent group, or kept if it's top-level
            };
            idMap.set(activeTransformShapeRef.current.id.replace('-preview', ''), newShape.id);
            
            const newAuxShapes = auxiliaryTransformShapesRef.current.map((shape, index) => {
                const newAux = {
                    ...shape,
                    id: `dup-${timeStr}-${index + 1}`
                };
                idMap.set(shape.id, newAux.id);
                return newAux;
            });
            
            const patchShape = (shape: Shape) => {
                if (shape.groupId && idMap.has(shape.groupId)) {
                    shape.groupId = idMap.get(shape.groupId);
                }
                if (shape.type === 'group' && shape.shapeIds) {
                    shape.shapeIds = shape.shapeIds.map(id => idMap.has(id) ? idMap.get(id)! : id);
                }
            };
            
            patchShape(newShape);
            newAuxShapes.forEach(patchShape);
            
            if (addShapes) {
                addShapes([newShape, ...newAuxShapes], true);
            } else {
                const newIds: string[] = [];
                addShape(newShape, true);
                newIds.push(newShape.id);
                
                newAuxShapes.forEach(aux => {
                    addShape(aux, true);
                    newIds.push(aux.id);
                });
                
                onSelectShape(newIds);
            }
            showNotification(t('canvas.shapeDuplicated'));
        }
    } else if (action?.type === 'point-editing' && activeTransformShapeRef.current) {
        const { initialShape, center } = action;
        let shapeToUpdate = activeTransformShapeRef.current;

        const originalName = initialShape.name;
        const isOriginalNameCustom = originalName && !isDefaultName(originalName);

        if ('rotation' in initialShape && initialShape.rotation !== 0) {
            const isSmoothCurve = (initialShape.type === 'bezier' || (initialShape.type === 'polyline' && initialShape.smooth));
            
            if (isSmoothCurve) {
                // For smooth curves, bake rotation into control points without spline approximation.
                const controlPoints = (activeTransformShapeRef.current as PolylineShape | BezierCurveShape).points;
                const finalPoints = controlPoints.map(p => rotatePoint(p, center, initialShape.rotation));
                
                const bakedShape = {
                    ...activeTransformShapeRef.current,
                    points: finalPoints,
                    rotation: 0,
                    name: undefined as string | undefined
                };
                bakedShape.name = isOriginalNameCustom ? originalName : getDefaultNameForShape(bakedShape as Shape, t);
                shapeToUpdate = bakedShape as Shape;
            } else {
                // For primitives converted to polylines, lines, etc., use getFinalPoints.
                // This correctly returns transformed vertices without creating extra points for non-smooth shapes.
                const finalPoints = getFinalPoints(activeTransformShapeRef.current, center);
                if (finalPoints) {
                    const bakedShape: PolylineShape = {
                        ...(activeTransformShapeRef.current as PolylineShape),
                        points: finalPoints,
                        rotation: 0,
                        name: undefined
                    };
                    bakedShape.name = isOriginalNameCustom ? originalName : getDefaultNameForShape(bakedShape, t);
                    shapeToUpdate = bakedShape;
                }
            }
        } else {
             // For unrotated shapes, just update the name if it has changed due to deformation.
            const finalShape = activeTransformShapeRef.current;
            const newName = isOriginalNameCustom ? originalName : getDefaultNameForShape(finalShape, t);
            if (finalShape.name !== newName) {
                shapeToUpdate = { ...finalShape, name: newName };
            }
        }
        updateShape(shapeToUpdate);
    } else if (activeTransformShapeRef.current) { 
        if (typeof updateShapes === 'function' && auxiliaryTransformShapesRef.current.length > 0) {
            updateShapes([activeTransformShapeRef.current, ...auxiliaryTransformShapesRef.current]);
        } else {
            updateShape(activeTransformShapeRef.current);
            auxiliaryTransformShapesRef.current.forEach(shape => updateShape(shape));
        }
    } else if (action?.type === 'edit-distribute-path') {
        props.onDistributePathChangeEnd?.();
    }
    
    setAction(null);
    setActiveTransformShape(null);
    setAuxiliaryTransformShapes([]);
    hasDraggedRef.current = false;
    mouseDownPosRef.current = null;
  }, [action, addShape, addShapes, updateShape, updateShapes, onSelectShape, activeTransformShape, auxiliaryTransformShapes, showNotification, props.onDistributePathChangeEnd]);
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawingPolyline) {
        onCompletePolyline(false);
        return;
    }
    if (isDrawingBezier) {
        onCompleteBezier(false);
        return;
    }
    
    const clickedShapeId = (e.target as SVGElement).dataset.id;
    const shape = shapes.find(s => s.id === clickedShapeId);
    if (shape && shape.type === 'text') {
        onStartInlineEdit(shape.id);
    } else if (shape && shape.groupId) {
        onSelectShape(shape.id, e.ctrlKey || e.metaKey, e.shiftKey, true);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setPreviewMousePos(null);
    setRawMousePos(null);
    setCursorPos(null);
    if (mouseDownPosRef.current) {
        handleMouseUp(e);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const { deltaY } = e;
    const scaleFactor = 1.1;
    const pos = getPointerPosition(e);

    setViewTransform(prev => {
        let newScale = deltaY < 0 ? prev.scale * scaleFactor : prev.scale / scaleFactor;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
        
        if (newScale === prev.scale) return prev;

        const newX = pos.x - (pos.x - prev.x) * (newScale / prev.scale);
        const newY = pos.y - (pos.y - prev.y) * (newScale / prev.scale);
        return { scale: newScale, x: newX, y: newY };
    });
  };

  // --- TOUCH EVENTS ---
    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement | undefined)?.closest?.('[data-magnifier="true"]') || (e.target as Element | undefined)?.closest?.('#magnifier-anchor-layer') || isDraggingAnchorRef.current) {
            return;
        }
        e.preventDefault();
        
        // If it's a multi-touch gesture (e.g. 2+ fingers for pinch-zoom/pan):
        // Cancel any pending single-touch actions and DO NOT alter existing shape selections!
        if (e.touches.length >= 2) {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
            isMultiTouchGestureRef.current = true;
            isLongPressTriggeredRef.current = false;
            pendingTouchRef.current = null;
            setAction(null); // Cancel any drag or drawing action immediately

            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

            // Guard against division by zero if fingers are at the same spot
            if (dist < 1) {
                touchStateRef.current = null;
                return;
            }

            const midpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            touchStateRef.current = { initialDist: dist, initialMidpoint: midpoint, initialTransform: viewTransform };
            return;
        }

        // Single touch start
        if (isMultiTouchGestureRef.current) {
            // Releasing multi-touch fingers, ignore intermediate single-touch
            return;
        }

        const touch = e.touches[0];
        const now = Date.now();
        const targetElement = e.target as SVGElement;
        const isHandle = Boolean(targetElement?.closest?.('[data-handle="true"]'));
        const clickedShapeId = targetElement?.dataset?.id;
        const clickedShape = clickedShapeId ? shapes.find(s => s?.id === clickedShapeId) : null;

        const getRootId = (id: string): string => {
            const shape = shapes.find(s => s.id === id);
            if (shape && shape.groupId) return getRootId(shape.groupId);
            const groupParent = shapes.find(g => g.type === 'group' && g.shapeIds?.includes(id));
            if (groupParent) return getRootId(groupParent.id);
            return id;
        };
        const resolvedClickedId = clickedShapeId ? getRootId(clickedShapeId) : undefined;
        const isAlreadySelected = resolvedClickedId ? (selectedShapeIds.includes(resolvedClickedId) || selectedShapeIds.includes(clickedShapeId!)) : false;

        const rawPos = getPointerPosition({ clientX: touch.clientX, clientY: touch.clientY } as any);
        const pos = getTransformedPointerPosition(rawPos);
        mouseDownPosRef.current = pos;
        hasDraggedRef.current = false;

        pendingTouchRef.current = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            time: now,
            shapeId: clickedShapeId,
            resolvedShapeId: resolvedClickedId,
            isAlreadySelected,
            isHandle,
            startCanvasPos: pos,
            hasMoved: false,
        };

        longPressPosRef.current = { x: touch.clientX, y: touch.clientY, shapeId: clickedShapeId };
        isLongPressTriggeredRef.current = false;
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        // Detect long press on shape in select mode (or when no active drawing tool)
        if (clickedShapeId && activeTool === 'select' && !isHandle) {
            longPressTimerRef.current = setTimeout(() => {
                isLongPressTriggeredRef.current = true;
                if (typeof navigator !== 'undefined' && navigator?.vibrate) {
                    try { navigator.vibrate(40); } catch (_) {}
                }
                const shape = shapes.find(s => s?.id === clickedShapeId);
                if (shape && shape.state !== 'disabled' && shape.state !== 'hidden' && !lockedShapeIds.has(shape.id)) {
                    if (isMultiSelectMode && selectedShapeIds.length > 0 && !selectedShapeIds.includes(clickedShapeId)) {
                        // Long press on another shape in multi-select mode: RANGE select (Shift analog)
                        onSelectShape(clickedShapeId, false, true);
                    } else {
                        // First long-press: enable multi-select mode (Ctrl analog)
                        setIsMultiSelectMode?.(true);
                        onSelectShape(clickedShapeId, true, false);
                    }
                    showNotification(t('shape.multiSelectEnabled') || 'Режим мультивибору увімкнено', 'info');
                }
            }, 450);
        }

        // Double-tap detection for polyline / bezier
        if (
            lastTapRef.current && 
            now - lastTapRef.current.time < 350 &&
            Math.hypot(touch.clientX - lastTapRef.current.x, touch.clientY - lastTapRef.current.y) < 30
        ) {
            if (isDrawingPolyline) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
                lastTapRef.current = null;
                onCompletePolyline(false);
                return;
            } else if (isDrawingBezier) {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
                lastTapRef.current = null;
                onCompleteBezier(false);
                return;
            }
        }

        setIsTouchDown(true);

        if (activeTool === 'select') {
            if (isHandle) {
                // User touched a transform handle
                const mockMouseEvent = { 
                    type: 'touchstart',
                    clientX: touch.clientX, 
                    clientY: touch.clientY, 
                    button: 0, 
                    target: e.target 
                } as unknown as React.MouseEvent<HTMLDivElement>;
                handleMouseDown(mockMouseEvent);
            } else if (isAlreadySelected && clickedShape && clickedShape.state !== 'disabled' && clickedShape.state !== 'hidden') {
                if (props.distributePathState) {
                    const clickedEntity = props.distributePathState.entities.find(ent => ent.ids.includes(clickedShape.id));
                    if (clickedEntity) {
                        setAction({ type: 'edit-distribute-path', handle: 'move-all', startPoint: pos, initialDistributePath: props.distributePathState });
                        return;
                    }
                }
                // Shape is already selected: prepare drag action if user moves finger
                setAction({ type: 'dragging', initialShape: clickedShape, startPos: pos });
            } else {
                // Unselected shape or empty canvas: DO NOT select immediately!
                // Wait for clean tap or deliberate drag gesture to avoid accidental selections during swipes/pinches.
                setAction(null);
            }
            return;
        }

        const mockMouseEvent = { 
            type: 'touchstart',
            clientX: touch.clientX, 
            clientY: touch.clientY, 
            button: 0, 
            target: e.target 
        } as unknown as React.MouseEvent<HTMLDivElement>;
        handleMouseDown(mockMouseEvent);
    }, [handleMouseDown, viewTransform, shapes, onSelectShape, isDrawingPolyline, isDrawingBezier, onCompletePolyline, onCompleteBezier, activeTool, isMultiSelectMode, selectedShapeIds, lockedShapeIds, setIsMultiSelectMode, showNotification, t, getPointerPosition, getTransformedPointerPosition, props.distributePathState]);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement | undefined)?.closest?.('[data-magnifier="true"]') || isDraggingAnchorRef.current) {
            return;
        }
        e.preventDefault();

        // Multi-touch gestures (pinch zoom & pan)
        if (e.touches.length >= 2) {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
            isMultiTouchGestureRef.current = true;
            isLongPressTriggeredRef.current = false;
            pendingTouchRef.current = null;
            setAction(null);

            if (touchStateRef.current) {
                const { initialDist, initialMidpoint, initialTransform } = touchStateRef.current;
                if (initialDist === 0) return;

                const [t1, t2] = [e.touches[0], e.touches[1]];
                const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const currentMidpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

                let scale = initialTransform.scale * (currentDist / initialDist);
                scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

                const dx = currentMidpoint.x - initialMidpoint.x;
                const dy = currentMidpoint.y - initialMidpoint.y;
                
                const newX = currentMidpoint.x - (currentMidpoint.x - (initialTransform.x + dx)) * (scale / initialTransform.scale);
                const newY = currentMidpoint.y - (currentMidpoint.y - (initialTransform.y + dy)) * (scale / initialTransform.scale);

                setViewTransform({ scale, x: newX, y: newY });
            }
            return;
        }

        if (isMultiTouchGestureRef.current) {
            // Ignore single-finger tracking during/immediately after multi-touch
            return;
        }

        const touch = e.touches[0];
        if (!touch) return;

        if (longPressPosRef.current && longPressTimerRef.current) {
            if (Math.hypot(touch.clientX - longPressPosRef.current.x, touch.clientY - longPressPosRef.current.y) > 10) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
        }

        const rawPos = getPointerPosition({ clientX: touch.clientX, clientY: touch.clientY } as any);
        const pos = getTransformedPointerPosition(rawPos);

        if (pendingTouchRef.current) {
            const moveDist = Math.hypot(touch.clientX - pendingTouchRef.current.clientX, touch.clientY - pendingTouchRef.current.clientY);
            if (moveDist > 10) {
                pendingTouchRef.current.hasMoved = true;
                hasDraggedRef.current = true;
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }

                if (activeTool === 'select' && !pendingTouchRef.current.isAlreadySelected && !pendingTouchRef.current.isHandle) {
                    if (!pendingTouchRef.current.shapeId) {
                        // Touched empty space and dragged -> start rubberband selection box
                        if (!action) {
                            setAction({ type: 'selecting', startPos: pendingTouchRef.current.startCanvasPos, currentPos: pos });
                        }
                    } else {
                        // Accidental swipe across an UNSELECTED shape -> do not drag or select it
                    }
                }
            }
        }

        const mockMouseEvent = { 
            type: 'touchmove', 
            clientX: touch.clientX, 
            clientY: touch.clientY, 
            button: 0 
        } as unknown as React.MouseEvent<HTMLDivElement>;
        handleMouseMove(mockMouseEvent);
    }, [handleMouseMove, setViewTransform, activeTool, action, getPointerPosition, getTransformedPointerPosition]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();

        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }

        // If multi-touch gesture was active, do not trigger tap or selection changes on release
        if (isMultiTouchGestureRef.current) {
            if (e.touches.length === 0) {
                isMultiTouchGestureRef.current = false;
                touchStateRef.current = null;
                pendingTouchRef.current = null;
                setIsTouchDown(false);
                setRawMousePos(null);
                setPreviewMousePos(null);
                setCursorPos(null);
            } else if (e.touches.length < 2) {
                touchStateRef.current = null;
            }
            return;
        }

        setIsTouchDown(false);

        if (e.changedTouches && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            const raw = getPointerPosition({ clientX: touch.clientX, clientY: touch.clientY } as any);
            const canvasPt = getTransformedPointerPosition(raw);
            setLastKnownCanvasPos(canvasPt);
        }

        if (e.touches.length === 0) {
            setRawMousePos(null);
            setPreviewMousePos(null);
            setCursorPos(null);
        }

        if (isLongPressTriggeredRef.current) {
            isLongPressTriggeredRef.current = false;
            pendingTouchRef.current = null;
            return;
        }

        const pending = pendingTouchRef.current;
        pendingTouchRef.current = null;

        const touch = e.changedTouches[0];

        if (activeTool === 'select') {
            if (pending && !pending.hasMoved) {
                // --- CLEAN SINGLE TAP GESTURE ---
                const now = Date.now();
                const clickedShapeId = pending.shapeId;
                const clickedShape = clickedShapeId ? shapes.find(s => s?.id === clickedShapeId) : null;

                // Double tap check on shape
                if (
                    lastTapRef.current && 
                    now - lastTapRef.current.time < 350 &&
                    Math.hypot(pending.clientX - lastTapRef.current.x, pending.clientY - lastTapRef.current.y) < 30
                ) {
                    lastTapRef.current = null;
                    if (clickedShape && clickedShape.type === 'text') {
                        onStartInlineEdit(clickedShape.id);
                        return;
                    } else if (clickedShape && clickedShape.groupId) {
                        onSelectShape(clickedShape.id, false, false, true);
                        return;
                    }
                } else {
                    lastTapRef.current = { time: now, x: pending.clientX, y: pending.clientY, shapeId: clickedShapeId };
                }

                if (clickedShape && clickedShape.state !== 'disabled' && clickedShape.state !== 'hidden' && !lockedShapeIds.has(clickedShape.id)) {
                    if (props.distributePathState) {
                        const clickedEntity = props.distributePathState.entities.find(ent => ent.ids.includes(clickedShape.id));
                        if (clickedEntity) {
                            // Keep distribution entity selection
                            return;
                        } else if (props.distributePathState.type === 'shape' || props.isSelectingPathShape) {
                            props.onSelectPathShape?.(clickedShape);
                            return;
                        }
                    } else if (props.isSelectingPathShape) {
                        props.onSelectPathShape?.(clickedShape);
                        return;
                    }

                    if (isMultiSelectMode) {
                        // In multi-select mode, tap toggles this shape in selection
                        onSelectShape(clickedShape.id, true, false);
                    } else {
                        // Standard tap selects this shape cleanly
                        onSelectShape(clickedShape.id, false, false);
                    }
                } else if (!clickedShape && !pending.isHandle) {
                    // Clean tap on empty canvas space -> deselect all
                    onSelectShape(null);
                    if (isMultiSelectMode) {
                        setIsMultiSelectMode?.(false);
                    }
                }
                return;
            } else if (pending?.hasMoved) {
                // Finger was swiped/dragged
                if (action?.type === 'dragging' || action?.type === 'selecting' || action?.type === 'resizing' || action?.type === 'rotating' || action?.type === 'edit-distribute-path') {
                    if (touch) {
                        const mockMouseEvent = {
                            type: 'touchend',
                            clientX: touch.clientX,
                            clientY: touch.clientY,
                            button: 0,
                            target: e.target
                        } as unknown as React.MouseEvent<HTMLDivElement>;
                        handleMouseUp(mockMouseEvent);
                    }
                } else {
                    // If it was an accidental swipe across an unselected shape with no active action,
                    // do nothing! Selection remains intact.
                    setAction(null);
                }
                return;
            }
        }

        // When other tools are active (drawing shapes, bezier, polyline, etc.)
        if (touch) {
            const mockMouseEvent = { 
                type: 'touchend',
                clientX: touch.clientX, 
                clientY: touch.clientY, 
                button: 0, 
                target: e.target,
            } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseUp(mockMouseEvent);
        } else {
            const mockMouseEvent = { type: 'touchend', button: 0 } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseUp(mockMouseEvent);
        }
    }, [handleMouseUp, setCursorPos, activeTool, shapes, lockedShapeIds, isMultiSelectMode, onSelectShape, onStartInlineEdit, setIsMultiSelectMode, props.distributePathState, props.isSelectingPathShape, props.onSelectPathShape, action]);
  
    const itemsToRender = useMemo(() => {
        let items = [...shapes];

        if (action?.type === 'drawing' && hasDraggedRef.current) {
            items.push(action.shape);
        } else if (action?.type === 'duplicating' && activeTransformShape) {
            items.push({ ...activeTransformShape, id: `${activeTransformShape.id}-preview` });
        } else if (activeTransformShape) {
            const index = items.findIndex(s => s?.id === activeTransformShape.id);
            if (index !== -1) {
                items[index] = activeTransformShape;
            }
        }
        
        auxiliaryTransformShapes.forEach(auxShape => {
            if (action?.type === 'duplicating') {
                items.push({ ...auxShape, id: `${auxShape.id}-preview` });
            } else {
                const index = items.findIndex(s => s?.id === auxShape.id);
                if (index !== -1) items[index] = auxShape;
            }
        });
    
    const activePreviewPos = previewMousePos || (props.touchDrawingMode === 'virtual-joystick' ? aimPos : null);

    if (isDrawingPolyline && polylinePoints.length > 0 && activePreviewPos) {
      const cleanPoints = polylinePoints.filter(Boolean);
      if (cleanPoints.length > 0) {
          items.push({
            id: 'temp-polyline-main', type: 'polyline', points: cleanPoints, isClosed: false,
            stroke: strokeColor, strokeWidth: strokeWidth, fill: 'none', state: 'normal', joinstyle: 'round', rotation: 0, capstyle: 'round'
          });
          items.push({
            id: 'temp-polyline-rubberband', type: 'line', points: [cleanPoints[cleanPoints.length-1], activePreviewPos],
            stroke: strokeColor, strokeWidth: 1, rotation: 0, state: 'normal', dash: [4, 4]
          } as LineShape);
      }
    }
    
    if (isDrawingBezier && bezierPoints.length > 0 && activePreviewPos) {
        const cleanPoints = bezierPoints.filter(Boolean);
        if (cleanPoints.length > 0) {
            const allPoints = [...cleanPoints, activePreviewPos];
            
            items.push({
                id: 'temp-bezier-preview-dashed',
                type: 'bezier',
                points: allPoints,
                smooth: true,
                splinesteps: 12,
                stroke: strokeColor,
                strokeWidth: 1, // Thin dashed line for preview
                dash: [4, 4],
                capstyle: 'round',
                rotation: 0,
                state: 'normal',
                isClosed: false,
                fill: 'none',
                joinstyle: 'round'
            } as BezierCurveShape);

            if (cleanPoints.length > 1) {
                items.push({
                    id: 'temp-bezier-main-solid',
                    type: 'bezier',
                    points: cleanPoints,
                    smooth: true,
                    splinesteps: 12,
                    stroke: strokeColor,
                    strokeWidth: strokeWidth,
                    capstyle: 'round',
                    rotation: 0,
                    state: 'normal',
                    isClosed: false,
                    fill: 'none',
                    joinstyle: 'round'
                } as BezierCurveShape);
            }
        }
    }
    
    return items;
  }, [shapes, action, hasDraggedRef, activeTransformShape, auxiliaryTransformShapes, isDrawingPolyline, polylinePoints, previewMousePos, strokeColor, strokeWidth, isDrawingBezier, bezierPoints]);
  
  const selectedShapes = useMemo(() => {
    const s = selectedShapeIds.map(id => {
       const aux = auxiliaryTransformShapes.find(a => a.id === id);
       if (aux) return aux;
       const s = shapes.find(s => s?.id === id);
       if (s?.id === activeTransformShape?.id) { return activeTransformShape; }
       return s;
    }).filter(Boolean) as Shape[];
    const uniqueIds = new Set();
    return s.filter(shape => {
        if (uniqueIds.has(shape.id)) return false;
        uniqueIds.add(shape.id);
        return true;
    });
  }, [shapes, selectedShapeIds, activeTransformShape, auxiliaryTransformShapes]);

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  const activeGroupIds = useMemo(() => {
        const ids = new Set<string>();
        selectedShapes.forEach(shape => {
            if (shape.groupId && !selectedShapeIds.includes(shape.groupId)) {
                ids.add(shape.groupId);
            }
        });
        return Array.from(ids);
  }, [selectedShapes, selectedShapeIds]);

  const computeGroupBounds = (groupId: string) => {
       const groupShape = itemsToRender.find(s => s.id === groupId);
       if (!groupShape || groupShape.type !== 'group') return null;
       const b = getBoundingBox(groupShape, itemsToRender);
       if (!b) return null;
       // Add a little padding to the group bounds so it frames the content nicely
       return { x: b.x - 2, y: b.y - 2, width: b.width + 4, height: b.height + 4 };
  };


    const getCursorStyle = () => {
        if (!action) {
          if (isSpacePressed) return 'grab';
          if (activeTool === 'select') return 'default'; // In select mode, empty space is default until hover (or box select)

          if (activeTool === 'edit-points') return 'default';
          if (activeTool === 'image' && pendingImage) return 'copy';
          if (['text', 'image', 'bitmap'].includes(activeTool) && activeTool !== 'image') return 'crosshair';
          if (activeTool === 'image' && !pendingImage) return 'default';
          return 'crosshair';
        }
    
        switch (action.type) {
            case 'panning':
            case 'dragging':
            case 'point-editing':
                return 'grabbing';
            case 'duplicating':
                return DUPLICATE_CURSOR_STYLE;
            case 'arc-angle-editing':
                return ADJUST_CURSOR_STYLE;
            case 'rotating':
                return ROTATE_CURSOR_STYLE;
            case 'resizing':
                return getCursorForHandle(action.handle);
            case 'trapezoid-offset-editing':
            case 'parallelogram-angle-editing':
            case 'triangle-vertex-editing':
            case 'star-inner-radius-editing':
                return ADJUST_CURSOR_STYLE;
            case 'drawing':
            case 'selecting':
                return 'crosshair';
            default:
                // Fallback, should ideally not be reached if action is not null
                if (activeTool === 'select') return 'grab';
                if (activeTool === 'edit-points') return 'default';
                return 'crosshair';
        }
    };
  const cursor = getCursorStyle();

  const getTransform = (shape: Shape) => {
    let transformStr = "";
    const isSpecialFlip = ['image', 'bitmap', 'arc'].includes(shape.type);
    const isFlippedH = isSpecialFlip && 'isFlippedHorizontally' in shape && (shape as any).isFlippedHorizontally;
    const isFlippedV = isSpecialFlip && 'isFlippedVertically' in shape && (shape as any).isFlippedVertically;
    const hasRotation = 'rotation' in shape && shape.rotation && shape.rotation !== 0;

    if (!isFlippedH && !isFlippedV && !hasRotation) return undefined;

    const center = getShapeCenter(shape, shapes);
    if (!center) return undefined;

    if (center.x !== 0 || center.y !== 0) {
        transformStr += `translate(${center.x} ${center.y}) `;
    }

    if (hasRotation) {
        transformStr += `rotate(${-shape.rotation}) `;
    }

    if (isFlippedH || isFlippedV) {
        const sx = isFlippedH ? -1 : 1;
        const sy = isFlippedV ? -1 : 1;
        transformStr += `scale(${sx} ${sy}) `;
    }

    if (center.x !== 0 || center.y !== 0) {
        transformStr += `translate(${-center.x} ${-center.y})`;
    }

    return ((transformStr) || "").trim() || undefined;
  };
  
    const arrowMarkers = useMemo(() => {
        const markers = new Map<string, { color: string; shapeParams: [number, number, number] }>();
        itemsToRender.forEach(shape => {
            if ((shape.type === 'line' || shape.type === 'bezier' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) && 'arrow' in shape && shape.arrow && shape.arrow !== 'none' && shape.stroke !== 'none' && shape.strokeWidth > 0 && shape.arrowshape) {
                const [d1m, d2m, d3m] = shape.arrowshape;
                const w = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
                const d1 = d1m * w; // tip dist
                const d2 = d2m * w; // wing dist
                const d3 = d3m * w; // width

                const key = JSON.stringify({ color: shape.stroke, shape: [d1, d2, d3] });
                if (!markers.has(key)) {
                    markers.set(key, { color: shape.stroke, shapeParams: [d1, d2, d3] });
                }
            }
        });
        return Array.from(markers.values());
    }, [itemsToRender]);

    const joinStyleProps = (s: { joinstyle?: JoinStyle }) => {
        const joinstyle = s.joinstyle ?? 'miter';
        return {
            strokeLinejoin: joinstyle,
            strokeMiterlimit: joinstyle === 'miter' ? 10 : undefined,
        };
    };
    
    const drawingControls = useMemo(() => {
        const points = isDrawingPolyline ? polylinePoints : bezierPoints;
        const show = (isDrawingPolyline || isDrawingBezier) && points.length > 0;
        if (!show) return null;

        const canComplete = points.length >= 2;
        const canClose = points.length >= 3;
        const canUndo = points.length >= 1;
        
        const buttonBaseClass = "flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold select-none active:scale-95 shadow-sm";
        const enabledBlueClass = "bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-[0_2px_10px_rgba(59,130,246,0.3)]";
        const enabledCyanClass = "bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_2px_10px_rgba(6,182,212,0.3)]";
        const enabledAmberClass = "bg-amber-600/90 text-white hover:bg-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.3)]";
        const enabledRedClass = "bg-red-600 text-white hover:bg-red-500 shadow-[0_2px_10px_rgba(239,68,68,0.3)]";
        const disabledClass = "bg-neutral-800 text-neutral-500 opacity-50 cursor-not-allowed pointer-events-none";

        const handleFinish = (e: React.SyntheticEvent, isClosed: boolean) => {
            e.stopPropagation();
            e.preventDefault();
            if (isDrawingPolyline) {
                onCompletePolyline(isClosed);
            } else {
                onCompleteBezier(isClosed);
            }
        };

        const handleUndo = (e: React.SyntheticEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (isDrawingPolyline) {
                if (props.onUndoPolylinePoint) props.onUndoPolylinePoint();
                else setPolylinePoints(prev => prev.slice(0, -1));
            } else {
                if (props.onUndoBezierPoint) props.onUndoBezierPoint();
                else setBezierPoints(prev => prev.slice(0, -1));
            }
        };

        const handleCancel = (e: React.SyntheticEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (isDrawingPolyline) {
                onCancelPolyline();
            } else {
                onCancelBezier();
            }
        };

        return (
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-neutral-950/90 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-2xl flex items-center gap-1.5 z-40 select-none animate-in fade-in slide-in-from-top-2"
              onPointerDown={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              onMouseUp={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              onTouchEnd={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            >
              {/* Points counter badge */}
              <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-[11px] font-mono font-bold text-cyan-300">
                <span>{isDrawingPolyline ? 'Ламана' : 'Крива'}:</span>
                <span>{points.length} т.</span>
              </div>

              {/* Complete (Open Path) */}
              <button
                type="button"
                onTouchEnd={(e) => canComplete && handleFinish(e, false)}
                onClick={(e) => canComplete && handleFinish(e, false)}
                title={t('canvas.finish') || 'Завершити відкритий контур'}
                disabled={!canComplete}
                className={`${buttonBaseClass} ${canComplete ? enabledBlueClass : disabledClass}`}
              >
                <CheckSquareIcon size={14} />
                <span>{t('canvas.finish') || 'Завершити'}</span>
              </button>

              {/* Close (Closed Path) */}
              <button
                type="button"
                onTouchEnd={(e) => canClose && handleFinish(e, true)}
                onClick={(e) => canClose && handleFinish(e, true)}
                title={t('canvas.closePoly') || 'Замкнути фігуру'}
                disabled={!canClose}
                className={`${buttonBaseClass} ${canClose ? enabledCyanClass : disabledClass}`}
              >
                <ClosePathIcon size={14} />
                <span>{t('canvas.closePoly') || 'Замкнути'}</span>
              </button>

              {/* Undo Last Point */}
              {canUndo && (
                <button
                  type="button"
                  onTouchEnd={handleUndo}
                  onClick={handleUndo}
                  title="Скасувати останню точку"
                  className={`${buttonBaseClass} ${enabledAmberClass}`}
                >
                  <UndoIcon size={14} />
                  <span className="hidden sm:inline">Крок назад</span>
                </button>
              )}

              {/* Cancel Drawing */}
              <button
                type="button"
                onTouchEnd={handleCancel}
                onClick={handleCancel}
                title={t('action.cancel') || 'Скасувати малювання'}
                className={`${buttonBaseClass} ${enabledRedClass}`}
              >
                <XSquareIcon size={14} />
                <span>{t('action.cancel') || 'Скасувати'}</span>
              </button>
            </div>
        );
    }, [isDrawingPolyline, isDrawingBezier, polylinePoints, bezierPoints, onCompletePolyline, onCompleteBezier, onCancelPolyline, onCancelBezier, props.onUndoPolylinePoint, props.onUndoBezierPoint, setPolylinePoints, setBezierPoints, t]);

    const gridStrokeColor = useMemo(() => {
        const hex = backgroundColor.replace('#', '');
        if (hex.length < 6) return 'rgba(0, 0, 0, 0.1)'; // Fallback
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        // Dynamically adjust opacity based on zoom level for better visibility
        const baseOpacity = 0.15;
        // Use a logarithmic function for smoother transition and more pronounced effect at higher zooms
        const scaleFactor = Math.log10(Math.max(1, viewTransform.scale));
        // Increase opacity, capping at 0.75 to prevent it from being too distracting
        const finalOpacity = Math.min(baseOpacity + scaleFactor * 0.25, 0.75);

        return brightness < 128 ? `rgba(255, 255, 255, ${finalOpacity})` : `rgba(0, 0, 0, ${finalOpacity})`;
    }, [backgroundColor, viewTransform.scale]);

    const fineGridStrokeColor = useMemo(() => {
        const hex = backgroundColor.replace('#', '');
        if (hex.length < 6) return 'rgba(0, 0, 0, 0.07)';
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        const baseOpacity = 0.07; // Lighter than the main grid's 0.15
        const scaleFactor = Math.log10(Math.max(1, viewTransform.scale));
        const finalOpacity = Math.min(baseOpacity + scaleFactor * 0.1, 0.5); // Increase opacity less aggressively

        return brightness < 128 ? `rgba(255, 255, 255, ${finalOpacity})` : `rgba(0, 0, 0, ${finalOpacity})`;
    }, [backgroundColor, viewTransform.scale]);
    
  const formatNumber = (num: number) => Math.round(num * 100) / 100;
  
  const isEngagedInRotation = action?.type === 'rotating' || (action?.type === 'edit-distribute-path' && action.handle === 'rotate');
  const isDuplicating = action?.type === 'duplicating';

  const rotationInfo = useMemo(() => {
    if (action?.type === 'rotating' && (action as any).initialShape && 'rotation' in (action as any).initialShape) {
        let currentRotation: number | null = null;
        if (activeTransformShape && 'rotation' in activeTransformShape) {
            currentRotation = (activeTransformShape as RotatableShape).rotation;
        } else if ((action as any).initialShape && 'rotation' in (action as any).initialShape) {
            currentRotation = ((action as any).initialShape as RotatableShape).rotation;
        }

        if (currentRotation !== null) {
            const initialRotation = (action as any).initialShape.rotation;
            let delta = currentRotation - initialRotation;
            
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            
            return {
                absolute: currentRotation,
                delta: delta
            };
        }
    } else if (action?.type === 'edit-distribute-path' && action.handle === 'rotate' && props.distributePathState) {
        let delta = props.distributePathState.angleOffset - action.initialDistributePath.angleOffset;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        
        return {
            absolute: props.distributePathState.angleOffset,
            delta: delta
        };
    }
    return null;
  }, [action, activeTransformShape, props.distributePathState]);
  
  const showInfoBox = (showCursorCoords || (showRotationAngle && isEngagedInRotation) || isDuplicating) && rawMousePos && previewMousePos;


  return (
      <div
        ref={containerRef}
        className="w-full h-full relative"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {drawingControls}
        {showInfoBox && (
          <div
            className="absolute p-1 px-2 text-xs rounded-md shadow-lg pointer-events-none z-20 bg-[var(--cursor-bg)] text-[var(--cursor-text)] font-mono"
            style={{
              left: rawMousePos.x + 15,
              top: rawMousePos.y - 15,
              transform: 'translateY(-100%)',
            }}
          >
            {isDuplicating && <div className="font-sans font-semibold">{t('canvas.duplicating')}</div>}
            {showRotationAngle && rotationInfo && (
                <div>{`${t('canvas.angle')}: ${rotationInfo.absolute.toFixed(0)}° (Δ: ${rotationInfo.delta.toFixed(0)}°)`}</div>
            )}
            {showCursorCoords && (
                <div>{`X: ${formatNumber(previewMousePos.x)}, Y: ${formatNumber(previewMousePos.y)}`}</div>
            )}
          </div>
        )}
        {(() => {
          const safeScale = (!viewTransform || isNaN(viewTransform.scale) || !isFinite(viewTransform.scale) || viewTransform.scale <= 0) ? 1 : viewTransform.scale;
          return (
            <svg
                ref={svgRef}
                className="rounded-md touch-none w-full h-full"
            >
            <defs>
                <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000000" floodOpacity="0.3"/>
                </filter>
                {showGrid && (
                    <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke={gridStrokeColor} strokeWidth={1 / safeScale}/>
                    </pattern>
                )}
                {showGrid && safeScale > 10 && (
                     <pattern id="fine-grid" width="1" height="1" patternUnits="userSpaceOnUse">
                        <path d="M 1 0 L 0 0 0 1" fill="none" stroke={fineGridStrokeColor} strokeWidth={1 / safeScale} />
                    </pattern>
                )}
                
                <pattern id="pattern-gray12" width="3" height="3" patternUnits="userSpaceOnUse">
                    <rect width="3" height="3" fill="black"/>
                    <rect x="1" y="1" width="1" height="1" fill="white"/>
                </pattern>
                <mask id="mask-gray12">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray12)"/>
                </mask>

                <pattern id="pattern-gray25" width="2" height="2" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="black"/>
                    <rect x="0" y="0" width="1" height="1" fill="white"/>
                </pattern>
                <mask id="mask-gray25">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray25)"/>
                </mask>

                <pattern id="pattern-gray50" width="2" height="2" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="black"/>
                    <rect x="0" y="0" width="1" height="1" fill="white"/>
                    <rect x="1" y="1" width="1" height="1" fill="white"/>
                </pattern>
                <mask id="mask-gray50">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/>
                </mask>
                    
                <pattern id="pattern-gray75" width="2" height="2" patternUnits="userSpaceOnUse">
                    <rect width="2" height="2" fill="white"/>
                    <rect x="1" y="1" width="1" height="1" fill="black"/>
                </pattern>
                <mask id="mask-gray75">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray75)"/>
                </mask>
                
                <pattern id="pattern-bitmap-error" width="8" height="8" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                    <path d="M0,0 L8,8 M8,0 L0,8" stroke="currentColor" strokeWidth="1" shapeRendering="crispEdges"/>
                </pattern>
                <mask id="mask-bitmap-error">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-bitmap-error)"/>
                </mask>
                <mask id="mask-bitmap-hourglass"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                <mask id="mask-bitmap-info"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                <mask id="mask-bitmap-questhead"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                <mask id="mask-bitmap-question"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                <mask id="mask-bitmap-warning"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>

                {arrowMarkers.map(({ color, shapeParams }) => {
                    const [d1, d2, d3] = shapeParams; // tip_dist, wing_dist, width
                    if (d2 === 0 || d3 === 0) return null;
                    const key = `${encodeURIComponent(color).replace(/%/g, '_')}-${d1}-${d2}-${d3}`;

                    // Path with tip at (0,0) pointing left (into negative X).
                    const arrowPath = `M 0,0 L ${-d2},${d3} L ${-d1},0 L ${-d2},${-d3} Z`;
                    
                    const viewBox = `${-d2 * 1.1} ${-d3 * 1.1} ${d2 * 1.1} ${d3 * 2.2}`;
                    const markerWidth = d2;
                    const markerHeight = d3 * 2;

                    return (
                        <React.Fragment key={key}>
                            <marker
                                id={`arrow-end-${key}`}
                                viewBox={viewBox}
                                refX={0} refY={0}
                                markerUnits="userSpaceOnUse"
                                markerWidth={markerWidth} markerHeight={markerHeight}
                                orient="auto"
                            >
                                <path d={arrowPath} fill={color} />
                            </marker>
                            <marker
                                id={`arrow-start-${key}`}
                                viewBox={viewBox}
                                refX={0} refY={0}
                                markerUnits="userSpaceOnUse"
                                markerWidth={markerWidth} markerHeight={markerHeight}
                                orient="auto-start-reverse"
                            >
                                <path d={arrowPath} fill={color} />
                            </marker>
                        </React.Fragment>
                    )
                })}
            </defs>

            <g id="canvas-main-content" transform={`translate(${viewTransform.x} ${viewTransform.y}) scale(${viewTransform.scale})`}>
                {/* Canvas background rect */}
                <rect 
                    x="0" 
                    y="0" 
                    width={width} 
                    height={height} 
                    fill={backgroundColor}
                    filter="url(#dropshadow)"
                />
                {/* Grid rect */}
                {showGrid && <rect x="0" y="0" width={width} height={height} fill="url(#grid)" style={{pointerEvents: 'none'}} />}
                {showGrid && viewTransform.scale > 10 && (
                    <rect x="0" y="0" width={width} height={height} fill="url(#fine-grid)" style={{ pointerEvents: 'none' }} />
                )}

            <g id="canvas-shapes-layer">
            {itemsToRender.filter(Boolean).map(shape => {
                const isSelected = selectedShapeIds.includes(shape.id) || (!!shape.groupId && selectedShapeIds.includes(shape.groupId));
                const isHidden = shape.state === 'hidden';
                const isLayerHidden = (shape as any).layerHidden;
                
                // If individually hidden and not selected, do not render at all.
                if (isHidden && !isSelected) return null;

                const isHiddenAndSelected = (isHidden || isLayerHidden) && isSelected;
                const isBeingEdited = inlineEditingShapeId === shape.id;
                
                if (isBeingEdited) return null;
                const isDisabled = shape.state === 'disabled';
                const isDrawing = activeTool !== 'select';
                const isDuplicationPreview = action?.type === 'duplicating' && shape.id.endsWith('-preview');
                const shapeCursor = (isDisabled || isHiddenAndSelected) ? 'default' : (isDrawing ? 'inherit' : 'move');
                const safeScale = (!viewTransform || isNaN(viewTransform.scale) || !isFinite(viewTransform.scale) || viewTransform.scale <= 0) ? 1 : viewTransform.scale;
                const safeStrokeWidth = isNaN((shape as any).strokeWidth) || typeof (shape as any).strokeWidth !== 'number' ? 0 : (shape as any).strokeWidth;
                const hitboxStrokeWidth = Math.max(safeStrokeWidth, 20 / safeScale);
                
                let transform = getTransform(shape);
                const isThisShapeBeingPointEdited = action?.type === 'point-editing' && shape.id === (action as any).initialShape.id;
                // FIX: Complete the variable name from `isThisShapeBeing` to `isThisShapeBeingPointEdited`.
                if (isThisShapeBeingPointEdited) {
                    transform = undefined;
                }

                // FIX: Removed explicit type React.SVGProps<any> to allow the 'data-id' attribute,
                // which was causing a TypeScript error. Type inference correctly handles validation on spread.
                const staticProps = {
                    'data-id': shape.id,
                    stroke: shape.stroke,
                    strokeWidth: safeStrokeWidth,
                    style: { 
                        opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : (isHidden ? 0.3 : 1),
                        cursor: shapeCursor,
                        pointerEvents: lockedShapeIds.has(shape.id) || isHidden ? 'none' : (isDisabled ? 'none' : 'auto'),
                     } as React.CSSProperties,
                    transform: transform,
                };

                const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | PathShape | ArcShape) => {
                    const sStrokeWidth = isNaN((s as any).strokeWidth) || typeof (s as any).strokeWidth !== 'number' ? 0 : (s as any).strokeWidth;
                    const hasVisibleStroke = s.stroke !== 'none' && sStrokeWidth > 0;
                    let dashArray;
                    const hasDash = 'dash' in s && s.dash && s.dash.length > 0 && sStrokeWidth > 0;
                    if (hasDash) {
                        dashArray = s.dash!.map(value => value * sStrokeWidth).join(' ');
                    }
                    const dashOffset = 'dashoffset' in s ? s.dashoffset : undefined;
                    const lineCap: 'butt' | 'round' | 'square' = (s.capstyle === 'projecting' ? 'square' : s.capstyle) ?? 'butt';
                    
                    let markerStart, markerEnd;
                    if (hasVisibleStroke && 'arrow' in s && s.arrow && s.arrow !== 'none' && s.arrowshape) {
                        const [d1m, d2m, d3m] = s.arrowshape;
                        const w = sStrokeWidth;
                        const d1 = d1m * w;
                        const d2 = d2m * w;
                        const d3 = d3m * w;
                        const key = `${encodeURIComponent(s.stroke).replace(/%/g, '_')}-${d1}-${d2}-${d3}`;
                        if (s.arrow === 'first' || s.arrow === 'both') markerStart = `url(#arrow-start-${key})`;
                        if (s.arrow === 'last' || s.arrow === 'both') markerEnd = `url(#arrow-end-${key})`;
                    }
                    return { strokeDasharray: dashArray, strokeDashoffset: dashOffset, markerStart, markerEnd, strokeLinecap: lineCap };
                };
                              const finalStaticProps: any = {
                    ...staticProps,
                    strokeWidth: safeStrokeWidth, // Завжди використовуємо візуальну товщину
                    pointerEvents: lockedShapeIds.has(shape.id) || isHidden || isDisabled ? 'none' : ((shape.type === 'line' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) ? 'stroke' : 'all'),
                }

                const renderedShape = (() => {
                switch (shape.type) {
                    case 'rectangle': {
                        const rx = typeof shape.x === 'number' && !isNaN(shape.x) ? shape.x : 0;
                        const ry = typeof shape.y === 'number' && !isNaN(shape.y) ? shape.y : 0;
                        const rw = typeof shape.width === 'number' && !isNaN(shape.width) ? Math.max(0, shape.width) : 0;
                        const rh = typeof shape.height === 'number' && !isNaN(shape.height) ? Math.max(0, shape.height) : 0;
                        const rectProps: any = { ...finalStaticProps, x: rx, y: ry, width: rw, height: rh, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') rectProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) rectProps.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) rectProps.strokeDashoffset = shape.dashoffset;
                        return <rect key={shape.id} {...rectProps} />;
                    }
                    case 'ellipse': {
                        const ellipse = shape as EllipseShape;
                        const ecx = typeof ellipse.cx === 'number' && !isNaN(ellipse.cx) ? ellipse.cx : 0;
                        const ecy = typeof ellipse.cy === 'number' && !isNaN(ellipse.cy) ? ellipse.cy : 0;
                        const erx = typeof ellipse.rx === 'number' && !isNaN(ellipse.rx) ? Math.max(0, ellipse.rx) : 0;
                        const ery = typeof ellipse.ry === 'number' && !isNaN(ellipse.ry) ? Math.max(0, ellipse.ry) : 0;
                        const ellipseProps: any = { ...finalStaticProps, cx: ecx, cy: ecy, rx: erx, ry: ery, fill: ellipse.fill };
                        if (ellipse.stipple && ellipse.fill !== 'none') ellipseProps.mask = `url(#mask-${ellipse.stipple})`;
                        if (ellipse.dash) ellipseProps.strokeDasharray = ellipse.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (ellipse.dashoffset) ellipseProps.strokeDashoffset = ellipse.dashoffset;
                        return <ellipse key={ellipse.id} {...ellipseProps} />;
                    }
                    case 'arc': {
                        const arcShape = shape as ArcShape;
                        const arcProps: any = { ...finalStaticProps, d: getArcPathData(arcShape), fill: arcShape.style === 'arc' ? 'none' : arcShape.fill };
                        if (arcShape.stipple && arcShape.fill !== 'none' && arcShape.style !== 'arc') arcProps.mask = `url(#mask-${arcShape.stipple})`;
                        if (arcShape.dash) arcProps.strokeDasharray = arcShape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (arcShape.dashoffset) arcProps.strokeDashoffset = arcShape.dashoffset;
                        return <path key={shape.id} {...arcProps} />;
                    }
                    case 'line':
                        if (!shape.points || !shape.points[0] || !shape.points[1] || isNaN(shape.points[0].x) || isNaN(shape.points[0].y) || isNaN(shape.points[1].x) || isNaN(shape.points[1].y)) return null;
                        return (
                            <React.Fragment key={shape.id}>
                                <line 
                                    x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} 
                                    stroke="transparent" strokeWidth={hitboxStrokeWidth}
                                    data-id={shape.id}
                                    strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'butt')}
                                    transform={finalStaticProps.transform}
                                    style={{ cursor: finalStaticProps.style.cursor, pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke' }}
                                />
                                <line {...finalStaticProps} stroke={shape.stroke} strokeWidth={safeStrokeWidth} x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} {...lineLikeProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
                            </React.Fragment>
                        );
                    case 'bezier': {
                        const fill = shape.isClosed ? shape.fill : 'none';
                        const pathData = getSmoothedPathData(shape.points, shape.smooth, shape.isClosed);
                        
                        if (!shape.isClosed) {
                             return (
                                <React.Fragment key={shape.id}>
                                    <path 
                                        d={pathData} 
                                        stroke="transparent" 
                                        strokeWidth={hitboxStrokeWidth} 
                                        fill="none" 
                                        strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'round')}
                                        strokeLinejoin={shape.joinstyle ?? 'round'}
                                        transform={finalStaticProps.transform}
                                        data-id={shape.id}
                                        style={{ cursor: finalStaticProps.style.cursor, pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke' }}
                                    />
                                    <path {...finalStaticProps} stroke={shape.stroke} strokeWidth={safeStrokeWidth} d={pathData} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
                                </React.Fragment>
                             )
                        }
                        return <path key={shape.id} {...finalStaticProps} stroke={shape.stroke} strokeWidth={safeStrokeWidth} d={pathData} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} />;
                    }
                    case 'pencil': {
                        const d = shape.smooth ? getSmoothedPathData(shape.points, true, false) : getPolylinePointsAsPath(shape.points);
                        return (
                            <React.Fragment key={shape.id}>
                                 <path 
                                    d={d} 
                                    stroke="transparent" 
                                    strokeWidth={hitboxStrokeWidth} 
                                    fill="none" 
                                    strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'round')}
                                    strokeLinejoin={shape.joinstyle ?? 'round'}
                                    transform={finalStaticProps.transform}
                                    data-id={shape.id}
                                    style={{ cursor: finalStaticProps.style.cursor, pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke' }}
                                 />
                                 <path {...finalStaticProps} stroke={shape.stroke} strokeWidth={safeStrokeWidth} d={d} fill="none" {...joinStyleProps(shape)} {...lineLikeProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
                            </React.Fragment>
                        );
                    }
                    case 'polyline': {
                        const polyProps: React.SVGProps<any> = { ...finalStaticProps, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.isClosed && shape.fill !== 'none') polyProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) polyProps.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) polyProps.strokeDashoffset = shape.dashoffset;
                        
                        if (!shape.isClosed) {
                            polyProps.fill = 'none';
                            Object.assign(polyProps, lineLikeProps(shape));
                            
                            const d = shape.smooth ? getSmoothedPathData(shape.points, true, shape.isClosed) : null;
                            const pointsStr = !shape.smooth ? formatPointsForSvg(shape.points) : null;

                            return (
                                <React.Fragment key={shape.id}>
                                    {/* Hitbox */}
                                    {shape.smooth ? (
                                        <path d={d!} stroke="transparent" strokeWidth={hitboxStrokeWidth} fill="none" strokeLinejoin={shape.joinstyle ?? 'miter'} transform={finalStaticProps.transform} data-id={shape.id} style={{ cursor: finalStaticProps.style.cursor, pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke' }} />
                                    ) : (
                                        <polyline points={pointsStr!} stroke="transparent" strokeWidth={hitboxStrokeWidth} fill="none" strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'butt')} strokeLinejoin={shape.joinstyle ?? 'miter'} transform={finalStaticProps.transform} data-id={shape.id} style={{ cursor: finalStaticProps.style.cursor, pointerEvents: finalStaticProps.pointerEvents === 'none' ? 'none' : 'stroke' }} />
                                    )}
                                    
                                    {/* Visual */}
                                    {shape.smooth ? (
                                        <path {...polyProps} d={d!} style={{ ...polyProps.style, pointerEvents: 'none' }} />
                                    ) : (
                                        <polyline {...polyProps} points={pointsStr!} fill="none" style={{ ...polyProps.style, pointerEvents: 'none' }} />
                                    )}
                                </React.Fragment>
                            )
                        } else {
                            polyProps.fill = shape.fill;
                        }

                        if (shape.smooth) return <path key={shape.id} {...polyProps} d={getSmoothedPathData(shape.points, true, shape.isClosed)} />;
                        if (shape.isClosed) return <polygon key={shape.id} {...polyProps} points={formatPointsForSvg(shape.points)} />;
                        return <polyline key={shape.id} {...polyProps} points={formatPointsForSvg(shape.points)} fill="none" />;
                    }
                    case 'triangle': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getIsoscelesTrianglePoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'right-triangle': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getRightTrianglePoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'rhombus': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getRhombusPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'trapezoid': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getTrapezoidPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'parallelogram': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getParallelogramPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'polygon':
                    case 'star': {
                        const polyShape = shape as PolygonShape;
                        const polyProps: any = { ...finalStaticProps, fill: polyShape.fill, ...joinStyleProps(polyShape) };
                        if (polyShape.stipple && polyShape.fill !== 'none') polyProps.mask = `url(#mask-${polyShape.stipple})`;
                        if (polyShape.dash) polyProps.strokeDasharray = polyShape.dash.map(v => v * safeStrokeWidth).join(' ');
                        if (polyShape.dashoffset) polyProps.strokeDashoffset = polyShape.dashoffset;

                        if(polyShape.smooth) return <path key={shape.id} {...polyProps} d={getSmoothedPathData(getFinalPoints(shape)!, true, true)} />
                        return <polygon key={shape.id} {...polyProps} points={formatPointsForSvg(getPolygonPointsAsArray(shape as PolygonShape))} />;
                    }
                    case 'text': {
                        const textShape = shape as TextShape;
                        const { font, fontSize, weight, slant, underline, overstrike, fill, justify } = textShape;
                        const lines = processTextLines(textShape);
                        const bbox = getTextBoundingBox(textShape);
                        if (!bbox) return null;

                        const textAnchor = justify === 'center' ? 'middle' : justify === 'right' ? 'end' : 'start';
                        
                        let textBlockX;
                        if (textAnchor === 'start') textBlockX = bbox.x;
                        else if (textAnchor === 'middle') textBlockX = bbox.x + bbox.width / 2;
                        else textBlockX = bbox.x + bbox.width;
                        
                        if (textShape.width > 0) {
                            if (textAnchor === 'middle') textBlockX = bbox.x + textShape.width / 2;
                            else if (textAnchor === 'end') textBlockX = bbox.x + textShape.width;
                            else textBlockX = bbox.x;
                        }

                        const textStyles: React.CSSProperties = {
                            fontFamily: getVisualFontFamily(font),
                            fontSize: fontSize,
                            fontWeight: weight,
                            fontStyle: slant === 'italic' ? 'italic' : 'normal',
                            textDecoration: `${underline ? 'underline' : ''} ${overstrike ? 'line-through' : ''}`.trim(),
                            whiteSpace: 'pre',
                        };

                        return (
                            <text
                                key={textShape.id}
                                {...staticProps}
                                x={textBlockX}
                                y={bbox.y}
                                fill={fill}
                                textAnchor={textAnchor}
                                
                                style={{ ...staticProps.style, ...textStyles }}
                            >
                                {lines.map((line, index) => (
                                    <tspan key={index} data-id={shape.id} x={textBlockX} dy={index === 0 ? `${fontSize * 0.88}px` : `${fontSize * 1.2}px`}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        );
                    }
                    case 'image': {
                        const imageShape = shape as ImageShape;
                        const ix = typeof imageShape.x === 'number' && !isNaN(imageShape.x) ? imageShape.x : 0;
                        const iy = typeof imageShape.y === 'number' && !isNaN(imageShape.y) ? imageShape.y : 0;
                        const iw = typeof imageShape.width === 'number' && !isNaN(imageShape.width) ? Math.max(0, imageShape.width) : 0;
                        const ih = typeof imageShape.height === 'number' && !isNaN(imageShape.height) ? Math.max(0, imageShape.height) : 0;
                        return (
                            <image
                                key={imageShape.id}
                                href={imageShape.src}
                                x={ix}
                                y={iy}
                                width={iw}
                                height={ih}
                                {...finalStaticProps}
                            />
                        );
                    }
                    case 'bitmap': {
                        const bitmapShape = shape as BitmapShape;
                        const { x, y, width: bmpWidth, height: bmpHeight, bitmapType, foreground, background } = bitmapShape;
                        const bx = typeof x === 'number' && !isNaN(x) ? x : 0;
                        const by = typeof y === 'number' && !isNaN(y) ? y : 0;
                        const bw = typeof bmpWidth === 'number' && !isNaN(bmpWidth) ? Math.max(0, bmpWidth) : 0;
                        const bh = typeof bmpHeight === 'number' && !isNaN(bmpHeight) ? Math.max(0, bmpHeight) : 0;
                        const maskId = bitmapType.startsWith('gray')
                            ? `url(#mask-${bitmapType})`
                            : `url(#mask-bitmap-${bitmapType})`;

                        return (
                            <g key={bitmapShape.id} {...staticProps} data-id={shape.id}>
                                <rect data-id={shape.id} x={bx} y={by} width={bw} height={bh} fill={background} />
                                <rect data-id={shape.id} x={bx} y={by} width={bw} height={bh} fill={foreground} mask={maskId} />
                            </g>
                        );
                    }
                    default: return null;
                }
                })();

                if (isLayerHidden && !isSelected) {
                    return (
                        <defs key={`defs-${shape.id}`}>
                            <g id={`shape-render-${shape.id}`}>
                                {renderedShape}
                            </g>
                        </defs>
                    );
                }

                return <g key={`g-${shape.id}`} id={`shape-render-${shape.id}`}>{renderedShape}</g>;
            })}
            </g>
             {action?.type === 'selecting' && action.startPos && action.currentPos && !isNaN(action.startPos.x) && !isNaN(action.startPos.y) && !isNaN(action.currentPos.x) && !isNaN(action.currentPos.y) && (
                 <rect 
                     x={Math.min(action.startPos.x, action.currentPos.x)}
                     y={Math.min(action.startPos.y, action.currentPos.y)}
                     width={Math.abs(action.currentPos.x - action.startPos.x)}
                     height={Math.abs(action.currentPos.y - action.startPos.y)}
                     fill="rgba(59, 130, 246, 0.1)"
                     stroke="rgba(59, 130, 246, 0.8)"
                     strokeWidth={1 / safeScale}
                     style={{ pointerEvents: 'none' }}
                 />
             )}
             {!props.distributePathState && selectedShapes.filter(s => s.state !== 'hidden').map((shape) => (
                 <SelectionControls
                     key={`selection-controls-${shape.id}`}
                     shape={shape}
                     allShapes={itemsToRender}
                     setAction={setAction}
                     svgRef={svgRef}
                     activeTool={activeTool}
                     getSnappedMousePosition={getTransformedPointerPosition}
                     viewTransform={viewTransform}
                     getPointerPosition={getPointerPosition}
                     activePointIndex={activePointIndex}
                     setActivePointIndex={setActivePointIndex}
                     updateShape={updateShape}
                     action={action}
                 />
             ))}
             {!props.distributePathState && activeGroupIds.length > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                    {activeGroupIds.map((groupId) => {
                        const groupBounds = computeGroupBounds(groupId);
                        if (!groupBounds || isNaN(groupBounds.x) || isNaN(groupBounds.y) || isNaN(groupBounds.width) || isNaN(groupBounds.height)) return null;
                        return (
                            <rect 
                                key={`group-bounds-${groupId}`}
                                x={groupBounds.x}
                                y={groupBounds.y}
                                width={groupBounds.width}
                                height={groupBounds.height}
                                fill="none"
                                stroke="var(--text-tertiary)"
                                strokeWidth={1 / safeScale}
                                strokeDasharray={`${3 / safeScale} ${3 / safeScale}`}
                            />
                        );
                    })}
                </g>
            )}

            {/* Distribute Path Handles */}
            {props.distributePathState && (
                <g className="distribute-path-controls">
                    {props.distributePathState.type === 'circle' && (
                        <>
                            <circle cx={props.distributePathState.circleParams.cx} cy={props.distributePathState.circleParams.cy} r={props.distributePathState.circleParams.radius} fill="none" stroke="#00d2ff" strokeWidth={2 / safeScale} strokeDasharray={`${5 / safeScale},${5 / safeScale}`} style={{ pointerEvents: 'none' }} />
                            {/* Center Handle */}
                            <circle cx={props.distributePathState.circleParams.cx} cy={props.distributePathState.circleParams.cy} r={6 / safeScale} fill="var(--bg-primary)" stroke="#00d2ff" strokeWidth={2 / safeScale} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e));
                                setAction({ type: 'edit-distribute-path', handle: 'center', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} onTouchStart={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                setAction({ type: 'edit-distribute-path', handle: 'center', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} />
                            {/* Radius Handle */}
                            <circle cx={props.distributePathState.circleParams.cx + props.distributePathState.circleParams.radius} cy={props.distributePathState.circleParams.cy} r={6 / safeScale} fill="var(--bg-primary)" stroke="#00d2ff" strokeWidth={2 / safeScale} style={{ cursor: 'ew-resize', pointerEvents: 'all' }} onMouseDown={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e));
                                setAction({ type: 'edit-distribute-path', handle: 'radius', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} onTouchStart={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                setAction({ type: 'edit-distribute-path', handle: 'radius', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} />
                            {/* Rotation Handle */}
                            <g>
                                <line 
                                    x1={props.distributePathState.circleParams.cx} 
                                    y1={props.distributePathState.circleParams.cy} 
                                    x2={props.distributePathState.circleParams.cx + Math.cos(props.distributePathState.angleOffset * Math.PI / 180 - Math.PI / 2) * (props.distributePathState.circleParams.radius + 30 / safeScale)} 
                                    y2={props.distributePathState.circleParams.cy + Math.sin(props.distributePathState.angleOffset * Math.PI / 180 - Math.PI / 2) * (props.distributePathState.circleParams.radius + 30 / safeScale)} 
                                    stroke="#00d2ff" strokeWidth={1 / safeScale} strokeDasharray={`${3 / safeScale},${3 / safeScale}`} style={{ pointerEvents: 'none' }} />
                                <circle 
                                    cx={props.distributePathState.circleParams.cx + Math.cos(props.distributePathState.angleOffset * Math.PI / 180 - Math.PI / 2) * (props.distributePathState.circleParams.radius + 30 / safeScale)} 
                                    cy={props.distributePathState.circleParams.cy + Math.sin(props.distributePathState.angleOffset * Math.PI / 180 - Math.PI / 2) * (props.distributePathState.circleParams.radius + 30 / safeScale)} 
                                    r={6 / safeScale} fill="#00d2ff" stroke="var(--bg-primary)" strokeWidth={2 / safeScale} style={{ cursor: ROTATE_CURSOR_STYLE, pointerEvents: 'all' }} 
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e));
                                        setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }} onTouchStart={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                        setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }} />
                            </g>
                        </>
                    )}
                    {props.distributePathState.type === 'line' && (() => {
                        const lp = props.distributePathState.lineParams;
                        if (!lp || isNaN(lp.x1) || isNaN(lp.y1) || isNaN(lp.x2) || isNaN(lp.y2)) return null;
                        const mx = (lp.x1 + lp.x2) / 2;
                        const my = (lp.y1 + lp.y2) / 2;
                        const len = Math.hypot(lp.x2 - lp.x1, lp.y2 - lp.y1);
                        const baseAngle = Math.atan2(lp.y2 - lp.y1, lp.x2 - lp.x1);
                        const finalAngle = baseAngle + (props.distributePathState.angleOffset || 0) * Math.PI / 180;
                        const startX = mx - Math.cos(finalAngle) * (len / 2);
                        const startY = my - Math.sin(finalAngle) * (len / 2);
                        const endX = mx + Math.cos(finalAngle) * (len / 2);
                        const endY = my + Math.sin(finalAngle) * (len / 2);
                        const rotX = mx + Math.cos(finalAngle - Math.PI / 2) * (30 / safeScale);
                        const rotY = my + Math.sin(finalAngle - Math.PI / 2) * (30 / safeScale);
                        if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY) || isNaN(rotX) || isNaN(rotY)) return null;
                        return (
                        <>
                            <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#00d2ff" strokeWidth={2 / safeScale} strokeDasharray={`${5 / safeScale},${5 / safeScale}`} style={{ pointerEvents: 'none' }} />
                            {/* Start Handle */}
                            <circle cx={startX} cy={startY} r={6 / safeScale} fill="var(--bg-primary)" stroke="#00d2ff" strokeWidth={2 / safeScale} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e));
                                setAction({ type: 'edit-distribute-path', handle: 'start', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} onTouchStart={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                setAction({ type: 'edit-distribute-path', handle: 'start', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} />
                            {/* End Handle */}
                            <circle cx={endX} cy={endY} r={6 / safeScale} fill="var(--bg-primary)" stroke="#00d2ff" strokeWidth={2 / safeScale} style={{ cursor: 'move', pointerEvents: 'all' }} onMouseDown={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e));
                                setAction({ type: 'edit-distribute-path', handle: 'end', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} onTouchStart={(e) => {
                                e.stopPropagation();
                                const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                setAction({ type: 'edit-distribute-path', handle: 'end', startPoint: pt, initialDistributePath: props.distributePathState! });
                            }} />
                            {/* Rotation Handle */}
                            <g>
                                <line 
                                    x1={mx} 
                                    y1={my} 
                                    x2={rotX} 
                                    y2={rotY} 
                                    stroke="#00d2ff" strokeWidth={1 / safeScale} strokeDasharray={`${3 / safeScale},${3 / safeScale}`} style={{ pointerEvents: 'none' }} />
                                <circle 
                                    cx={rotX} 
                                    cy={rotY} 
                                    r={6 / safeScale} fill="#00d2ff" stroke="var(--bg-primary)" strokeWidth={2 / safeScale} style={{ cursor: ROTATE_CURSOR_STYLE, pointerEvents: 'all' }} 
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e));
                                        setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }} onTouchStart={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                        setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }} />
                            </g>
                        </>
                        );
                    })()}
                    {props.distributePathState.type === 'shape' && props.distributePathState.shapePathParams?.pathShape && (() => {
                        const pShape = props.distributePathState.shapePathParams.pathShape;
                        const pts = getFinalPoints(pShape);
                        if (!pts || pts.length < 2) return null;
                        let pathString = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                        const isClosed = isShapeClosed(pShape);
                        if (isClosed) pathString += ' Z';

                        const center = getShapeCenter(pShape) || { x: 0, y: 0 };
                        const xs = pts.map(p => p.x);
                        const ys = pts.map(p => p.y);
                        const minX = Math.min(...xs);
                        const maxX = Math.max(...xs);
                        const minY = Math.min(...ys);
                        const maxY = Math.max(...ys);
                        if (!xs.length || !ys.length || isNaN(minX) || isNaN(minY) || isNaN(maxX) || isNaN(maxY) || !isFinite(minX) || !isFinite(minY)) return null;
                        const midX = (minX + maxX) / 2;
                        const midY = (minY + maxY) / 2;

                        const rotX = midX;
                        const rotY = minY - 30 / safeScale;
                        if (isNaN(rotX) || isNaN(rotY)) return null;

                        const angleOffset = props.distributePathState.angleOffset || 0;
                        const nodePoints = (('points' in pShape && Array.isArray((pShape as any).points)) ? (pShape as any).points : pts);

                        return (
                            <g transform={`rotate(${angleOffset} ${center.x} ${center.y})`}>
                                {/* Dashed Contour */}
                                <path
                                    d={pathString}
                                    fill="none"
                                    stroke="#00d2ff"
                                    strokeWidth={2 / safeScale}
                                    strokeDasharray={`${5 / safeScale},${5 / safeScale}`}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Bounding Box Frame */}
                                <rect
                                    x={minX}
                                    y={minY}
                                    width={Math.max(1, maxX - minX)}
                                    height={Math.max(1, maxY - minY)}
                                    fill="none"
                                    stroke="#00d2ff"
                                    strokeWidth={1 / safeScale}
                                    strokeDasharray={`${3 / safeScale},${3 / safeScale}`}
                                    style={{ pointerEvents: 'none' }}
                                />

                                {/* Center Move Handle */}
                                <circle
                                    cx={center.x}
                                    cy={center.y}
                                    r={6 / safeScale}
                                    fill="var(--bg-primary)"
                                    stroke="#00d2ff"
                                    strokeWidth={2 / safeScale}
                                    style={{ cursor: 'move', pointerEvents: 'all' }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e));
                                        setAction({ type: 'edit-distribute-path', handle: 'shape-move', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }}
                                    onTouchStart={(e) => {
                                        e.stopPropagation();
                                        const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                        setAction({ type: 'edit-distribute-path', handle: 'shape-move', startPoint: pt, initialDistributePath: props.distributePathState! });
                                    }}
                                />

                                {/* Bounding Box Corner & Middle Resize Handles */}
                                {[
                                    { x: minX, y: minY, cursor: 'nwse-resize', handle: 'shape-resize-top-left' },
                                    { x: midX, y: minY, cursor: 'ns-resize', handle: 'shape-resize-top-center' },
                                    { x: maxX, y: minY, cursor: 'nesw-resize', handle: 'shape-resize-top-right' },
                                    { x: minX, y: midY, cursor: 'ew-resize', handle: 'shape-resize-middle-left' },
                                    { x: maxX, y: midY, cursor: 'ew-resize', handle: 'shape-resize-middle-right' },
                                    { x: minX, y: maxY, cursor: 'nesw-resize', handle: 'shape-resize-bottom-left' },
                                    { x: midX, y: maxY, cursor: 'ns-resize', handle: 'shape-resize-bottom-center' },
                                    { x: maxX, y: maxY, cursor: 'nwse-resize', handle: 'shape-resize-bottom-right' }
                                ].map((h, i) => (
                                    <rect
                                        key={`resize-${i}`}
                                        x={h.x - 4 / safeScale}
                                        y={h.y - 4 / safeScale}
                                        width={8 / safeScale}
                                        height={8 / safeScale}
                                        fill="var(--bg-primary)"
                                        stroke="#00d2ff"
                                        strokeWidth={1.5 / safeScale}
                                        style={{ cursor: h.cursor, pointerEvents: 'all' }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            const pt = getTransformedPointerPosition(getPointerPosition(e));
                                            setAction({ type: 'edit-distribute-path', handle: h.handle, startPoint: pt, initialDistributePath: props.distributePathState! });
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                            setAction({ type: 'edit-distribute-path', handle: h.handle, startPoint: pt, initialDistributePath: props.distributePathState! });
                                        }}
                                    />
                                ))}

                                {/* Vertex / Node Handles */}
                                {activeTool === 'edit-points' && nodePoints.map((pt: {x: number, y: number}, idx: number) => {
                                    if (!pt) return null;
                                    return (
                                        <circle
                                            key={`node-${idx}`}
                                            cx={pt.x}
                                            cy={pt.y}
                                            r={5 / safeScale}
                                            fill="var(--bg-primary)"
                                            stroke="#00d2ff"
                                            strokeWidth={1.5 / safeScale}
                                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                const p = getTransformedPointerPosition(getPointerPosition(e));
                                                setAction({ type: 'edit-distribute-path', handle: `shape-node-${idx}`, startPoint: p, initialDistributePath: props.distributePathState! });
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                                const p = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                                setAction({ type: 'edit-distribute-path', handle: `shape-node-${idx}`, startPoint: p, initialDistributePath: props.distributePathState! });
                                            }}
                                        />
                                    );
                                })}

                                {/* Rotation Handle */}
                                <g>
                                    <line
                                        x1={rotX}
                                        y1={minY}
                                        x2={rotX}
                                        y2={rotY}
                                        stroke="#00d2ff"
                                        strokeWidth={1 / safeScale}
                                        strokeDasharray={`${3 / safeScale},${3 / safeScale}`}
                                        style={{ pointerEvents: 'none' }}
                                    />
                                    <circle
                                        cx={rotX}
                                        cy={rotY}
                                        r={6 / safeScale}
                                        fill="#00d2ff"
                                        stroke="var(--bg-primary)"
                                        strokeWidth={2 / safeScale}
                                        style={{ cursor: ROTATE_CURSOR_STYLE, pointerEvents: 'all' }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            const pt = getTransformedPointerPosition(getPointerPosition(e));
                                            setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                            setAction({ type: 'edit-distribute-path', handle: 'rotate', startPoint: pt, initialDistributePath: props.distributePathState! });
                                        }}
                                    />
                                </g>

                                {/* Contour Shift Marker Handle for Closed Shapes */}
                                {isClosed && (() => {
                                    const shiftPct = props.distributePathState?.shapePathParams?.contourShift || 0;
                                    const shiftFrac = ((shiftPct % 100) + 100) % 100 / 100;
                                    const res = evaluateShapeContourPointAndTangent(pShape, shiftFrac, 0, 0);
                                    return (
                                        <g key="contour-shift-handle">
                                            <title>{t('tool.distribute.path.contourShift') || 'Зсув'}</title>
                                            <circle
                                                cx={res.targetCX}
                                                cy={res.targetCY}
                                                r={7 / safeScale}
                                                fill="#ff9800"
                                                stroke="var(--bg-primary)"
                                                strokeWidth={2 / safeScale}
                                                style={{ cursor: 'grab', pointerEvents: 'all' }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const pt = getTransformedPointerPosition(getPointerPosition(e));
                                                    setAction({ type: 'edit-distribute-path', handle: 'contour-shift', startPoint: pt, initialDistributePath: props.distributePathState! });
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                                    setAction({ type: 'edit-distribute-path', handle: 'contour-shift', startPoint: pt, initialDistributePath: props.distributePathState! });
                                                }}
                                            />
                                        </g>
                                    );
                                })()}

                                {/* Inner Radius Marker Handle for Star */}
                                {pShape.type === 'star' && (() => {
                                    const sides = (pShape as any).sides || 5;
                                    const innerRadius = (pShape as any).innerRadius ?? (pShape.radius / 2);
                                    const angle = -Math.PI / 2 + Math.PI / sides;
                                    const hx = pShape.cx + Math.cos(angle) * innerRadius;
                                    const hy = pShape.cy + Math.sin(angle) * innerRadius;
                                    const rotatedPoint = rotatePoint({x: hx, y: hy}, {x: pShape.cx, y: pShape.cy}, pShape.rotation || 0);
                                    
                                    return (
                                        <g key="inner-radius-handle">
                                            <title>{t('tool.distribute.path.innerRadius') || 'Внутрішній радіус'}</title>
                                            <circle
                                                cx={rotatedPoint.x}
                                                cy={rotatedPoint.y}
                                                r={6 / safeScale}
                                                fill="var(--special-handle-fill)"
                                                stroke="var(--special-handle-stroke)"
                                                strokeWidth={2 / safeScale}
                                                style={{ cursor: ADJUST_CURSOR_STYLE, pointerEvents: 'all' }}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const pt = getTransformedPointerPosition(getPointerPosition(e));
                                                    setAction({ type: 'edit-distribute-path', handle: 'inner-radius', startPoint: pt, initialDistributePath: props.distributePathState! });
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    const pt = getTransformedPointerPosition(getPointerPosition(e.touches[0]));
                                                    setAction({ type: 'edit-distribute-path', handle: 'inner-radius', startPoint: pt, initialDistributePath: props.distributePathState! });
                                                }}
                                            />
                                        </g>
                                    );
                                })()}
                            </g>
                        );
                    })()}
                </g>
            )}
            
            {/* Center Guides */}
            {showCenterGuides && (
                <>
                    <line 
                        x1={width / 2} y1={-100000} x2={width / 2} y2={100000} 
                        stroke="var(--text-tertiary)"
                        strokeOpacity="0.4"
                        strokeWidth={1 / safeScale} 
                        pointerEvents="none"
                    />
                    <line 
                        x1={-100000} y1={height / 2} x2={100000} y2={height / 2} 
                        stroke="var(--text-tertiary)"
                        strokeOpacity="0.4"
                        strokeWidth={1 / safeScale} 
                        pointerEvents="none"
                    />
                </>
            )}

            {/* Snap Lines */}
            {(() => {
                const snapX = snapLines.x !== null && snapLines.x !== undefined && !isNaN(snapLines.x) 
                    ? snapLines.x 
                    : (keyboardSnapLines?.x !== null && keyboardSnapLines?.x !== undefined && !isNaN(keyboardSnapLines.x) ? keyboardSnapLines.x : null);
                if (snapX === null) return null;
                return (
                    <line 
                        x1={snapX} y1={-100000} x2={snapX} y2={100000} 
                        stroke="var(--accent-primary)" 
                        strokeWidth={1 / safeScale} 
                        strokeDasharray={`${5 / safeScale},${5 / safeScale}`} 
                        pointerEvents="none"
                    />
                );
            })()}
            {(() => {
                const snapY = snapLines.y !== null && snapLines.y !== undefined && !isNaN(snapLines.y) 
                    ? snapLines.y 
                    : (keyboardSnapLines?.y !== null && keyboardSnapLines?.y !== undefined && !isNaN(keyboardSnapLines.y) ? keyboardSnapLines.y : null);
                if (snapY === null) return null;
                return (
                    <line 
                        x1={-100000} y1={snapY} x2={100000} y2={snapY} 
                        stroke="var(--accent-primary)" 
                        strokeWidth={1 / safeScale} 
                        strokeDasharray={`${5 / safeScale},${5 / safeScale}`} 
                        pointerEvents="none"
                    />
                );
            })()}
            {/* Virtual Joystick Precision Reticle */}
            {props.touchDrawingMode === 'virtual-joystick' && (
              <g id="virtual-joystick-reticle" className="pointer-events-none select-none">
                {/* Horizontal Guide */}
                <line 
                  x1={0} y1={aimPos.y} x2={width} y2={aimPos.y} 
                  stroke="#00d2ff" 
                  strokeWidth={1 / safeScale} 
                  strokeDasharray={`${4 / safeScale},${4 / safeScale}`} 
                  opacity={0.65}
                />
                {/* Vertical Guide */}
                <line 
                  x1={aimPos.x} y1={0} x2={aimPos.x} y2={height} 
                  stroke="#00d2ff" 
                  strokeWidth={1 / safeScale} 
                  strokeDasharray={`${4 / safeScale},${4 / safeScale}`} 
                  opacity={0.65}
                />

                {/* Outer Crosshair Ring */}
                <circle 
                  cx={aimPos.x} 
                  cy={aimPos.y} 
                  r={16 / safeScale} 
                  fill="none" 
                  stroke="#00d2ff" 
                  strokeWidth={1.5 / safeScale} 
                  opacity={0.85}
                />
                {/* Inner Crosshair Ring */}
                <circle 
                  cx={aimPos.x} 
                  cy={aimPos.y} 
                  r={6 / safeScale} 
                  fill="rgba(0, 210, 255, 0.2)" 
                  stroke="#ffffff" 
                  strokeWidth={1 / safeScale} 
                />
                {/* Center laser point */}
                <circle 
                  cx={aimPos.x} 
                  cy={aimPos.y} 
                  r={2.2 / safeScale} 
                  fill="#00d2ff" 
                  stroke="#ffffff" 
                  strokeWidth={0.6 / safeScale}
                />
                {/* 4 Cardinal Tick Marks */}
                <line 
                  x1={aimPos.x} y1={aimPos.y - 20 / safeScale} 
                  x2={aimPos.x} y2={aimPos.y - 10 / safeScale} 
                  stroke="#00d2ff" strokeWidth={1.5 / safeScale} 
                />
                <line 
                  x1={aimPos.x} y1={aimPos.y + 10 / safeScale} 
                  x2={aimPos.x} y2={aimPos.y + 20 / safeScale} 
                  stroke="#00d2ff" strokeWidth={1.5 / safeScale} 
                />
                <line 
                  x1={aimPos.x - 20 / safeScale} y1={aimPos.y} 
                  x2={aimPos.x - 10 / safeScale} y2={aimPos.y} 
                  stroke="#00d2ff" strokeWidth={1.5 / safeScale} 
                />
                <line 
                  x1={aimPos.x + 10 / safeScale} y1={aimPos.y} 
                  x2={aimPos.x + 20 / safeScale} y2={aimPos.y} 
                  stroke="#00d2ff" strokeWidth={1.5 / safeScale} 
                />
              </g>
            )}
            {/* Draggable Anchor Target Marker & Visual Tether Line (Option 1 + Option 4) */}
            {anchorTarget && (() => {
              const magProp = props.showMagnifier;
              const magMode: MagnifierMode = typeof magProp === 'string' ? magProp : (magProp === false ? 'off' : 'auto');
              if (magMode === 'off') return null;

              const ax = anchorTarget.x;
              const ay = anchorTarget.y;

              // Compute Magnifier lens perimeter connection point in canvas space
              let tetherPath: { startX: number; startY: number; endX: number; endY: number } | null = null;

              if (magnifierCenter) {
                const magCanvasX = (magnifierCenter.x - viewTransform.x) / safeScale;
                const magCanvasY = (magnifierCenter.y - viewTransform.y) / safeScale;
                const magCanvasRadius = magnifierCenter.radius / safeScale;

                const dx = ax - magCanvasX;
                const dy = ay - magCanvasY;
                const dist = Math.hypot(dx, dy);

                if (dist > magCanvasRadius + 2) {
                  const startX = magCanvasX + (dx / dist) * magCanvasRadius;
                  const startY = magCanvasY + (dy / dist) * magCanvasRadius;
                  tetherPath = { startX, startY, endX: ax, endY: ay };
                }
              }

              return (
                <g id="magnifier-anchor-layer">
                  {/* Laser / Tether Line connecting Lens to Anchor Target */}
                  {tetherPath && (
                    <g className="pointer-events-none select-none">
                      {/* Outer soft ambient glow */}
                      <line
                        x1={tetherPath.startX}
                        y1={tetherPath.startY}
                        x2={tetherPath.endX}
                        y2={tetherPath.endY}
                        stroke="rgba(16, 185, 129, 0.4)"
                        strokeWidth={4 / safeScale}
                        strokeLinecap="round"
                      />
                      {/* Inner dashed laser tether line */}
                      <line
                        x1={tetherPath.startX}
                        y1={tetherPath.startY}
                        x2={tetherPath.endX}
                        y2={tetherPath.endY}
                        stroke="#10b981"
                        strokeWidth={1.6 / safeScale}
                        strokeDasharray={`${6 / safeScale},${4 / safeScale}`}
                        strokeLinecap="round"
                      />
                      {/* Rim anchor node */}
                      <circle
                        cx={tetherPath.startX}
                        cy={tetherPath.startY}
                        r={3 / safeScale}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1 / safeScale}
                      />
                    </g>
                  )}

                  {/* Interactive Draggable Anchor Reticle */}
                  <g
                    id="magnifier-anchor-layer"
                    className="cursor-move select-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      isDraggingAnchorRef.current = true;
                      try {
                        (e.currentTarget as Element).setPointerCapture(e.pointerId);
                      } catch {}
                      setIsDraggingAnchor(true);
                    }}
                    onPointerMove={(e) => {
                      if (!isDraggingAnchorRef.current) return;
                      e.stopPropagation();
                      e.preventDefault();
                      const raw = getPointerPosition(e);
                      const cPos = getTransformedPointerPosition(raw);
                      let fx = Math.round(cPos.x);
                      let fy = Math.round(cPos.y);
                      if (showGrid && gridSize > 0) {
                        const step = snapStep || 1;
                        fx = Math.round(fx / step) * step;
                        fy = Math.round(fy / step) * step;
                      }
                      setAnchorTarget({ x: fx, y: fy });
                    }}
                    onPointerUp={(e) => {
                      if (!isDraggingAnchorRef.current) return;
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
                      } catch {}
                      isDraggingAnchorRef.current = false;
                      setIsDraggingAnchor(false);
                    }}
                    onPointerCancel={(e) => {
                      if (!isDraggingAnchorRef.current) return;
                      try {
                        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
                      } catch {}
                      isDraggingAnchorRef.current = false;
                      setIsDraggingAnchor(false);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {/* Thin unobtrusive Crosshair Lines with open center */}
                    <line
                      x1={ax - 20 / safeScale}
                      y1={ay}
                      x2={ax - 5 / safeScale}
                      y2={ay}
                      stroke="#10b981"
                      strokeWidth={1.5 / safeScale}
                    />
                    <line
                      x1={ax + 5 / safeScale}
                      y1={ay}
                      x2={ax + 20 / safeScale}
                      y2={ay}
                      stroke="#10b981"
                      strokeWidth={1.5 / safeScale}
                    />
                    <line
                      x1={ax}
                      y1={ay - 20 / safeScale}
                      x2={ax}
                      y2={ay - 5 / safeScale}
                      stroke="#10b981"
                      strokeWidth={1.5 / safeScale}
                    />
                    <line
                      x1={ax}
                      y1={ay + 5 / safeScale}
                      x2={ax}
                      y2={ay + 20 / safeScale}
                      stroke="#10b981"
                      strokeWidth={1.5 / safeScale}
                    />

                    {/* Single subtle thin outer ring with clear transparent interior */}
                    <circle
                      cx={ax}
                      cy={ay}
                      r={12 / safeScale}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.2 / safeScale}
                      strokeDasharray={`${3 / safeScale},${2 / safeScale}`}
                      opacity={0.85}
                    />

                    {/* Generous touch / mouse drag hit area */}
                    <circle
                      cx={ax}
                      cy={ay}
                      r={30 / safeScale}
                      fill="transparent"
                    />
                  </g>
                </g>
              );
            })()}
            </g>
        </svg>
      );
    })()}
    {/* Precision Magnifier (Лупа) */}
    {(() => {
        const magProp = props.showMagnifier;
        const magMode: MagnifierMode = typeof magProp === 'string' ? magProp : (magProp === false ? 'off' : 'auto');
        
        if (magMode === 'off') return null;

        const isJoystickMode = props.touchDrawingMode === 'virtual-joystick';
        const isInteracting = isTouchDown || Boolean(action && action.type !== 'panning') || isDrawingPolyline || isDrawingBezier || isJoystickMode;
        const isPinned = magMode === 'pinned';
        const isAnchored = Boolean(anchorTarget);

        // Position calculation
        const fallbackPos = previewMousePos || lastKnownCanvasPos || { x: Math.round(width / 2), y: Math.round(height / 2) };
        const activeCanvasPos = isAnchored 
            ? anchorTarget 
            : (isJoystickMode ? aimPos : (previewMousePos || (isPinned ? fallbackPos : lastKnownCanvasPos)));
            
        const activePointerPos = isAnchored && anchorTarget ? {
            x: anchorTarget.x * viewTransform.scale + viewTransform.x,
            y: anchorTarget.y * viewTransform.scale + viewTransform.y
        } : (isJoystickMode && aimPos ? {
            x: aimPos.x * viewTransform.scale + viewTransform.x,
            y: aimPos.y * viewTransform.scale + viewTransform.y
        } : (rawMousePos || (activeCanvasPos ? {
            x: activeCanvasPos.x * viewTransform.scale + viewTransform.x,
            y: activeCanvasPos.y * viewTransform.scale + viewTransform.y
        } : null)));
        
        const showMag = isPinned || isAnchored || (isInteracting && activeCanvasPos);
        
        if (!showMag || !activeCanvasPos) return null;

        return (
            <Magnifier
                visible={Boolean(showMag)}
                canvasPos={activeCanvasPos}
                rawPointerPos={activePointerPos}
                viewTransform={viewTransform}
                containerRef={containerRef}
                canvasWidth={width}
                canvasHeight={height}
                canvasBgColor={backgroundColor}
                showGrid={showGrid}
                gridSize={gridSize}
                zoomLevel={3.0}
                isPinned={isPinned}
                onTogglePin={() => {
                    props.setShowMagnifier?.(isPinned ? 'auto' : 'pinned');
                }}
                isAnchored={isAnchored}
                anchorPos={anchorTarget}
                onToggleAnchor={() => {
                    setAnchorTarget(prev => {
                        if (prev) return null;
                        const target = activeCanvasPos || previewMousePos || lastKnownCanvasPos || aimPos || { x: Math.round(width / 2), y: Math.round(height / 2) };
                        return { x: Math.round(target.x), y: Math.round(target.y) };
                    });
                }}
                onMagnifierCenterChange={handleMagnifierCenterChange}
                onClose={() => {
                    setAnchorTarget(null);
                    props.setShowMagnifier?.('off');
                }}
            />
        );
    })()}
    {/* Virtual Joystick Controller */}
    {props.touchDrawingMode === 'virtual-joystick' && (
      <VirtualJoystick
        aimPos={aimPos}
        setAimPos={setAimPos}
        canvasWidth={width}
        canvasHeight={height}
        snapStep={snapStep}
        enableSnapping={enableSnapping}
        isDrawing={isDrawingPolyline || isDrawingBezier || Boolean(action && action.type === 'drawing')}
        pointsCount={isDrawingPolyline ? polylinePoints.length : isDrawingBezier ? bezierPoints.length : 0}
        isDrawingPolyline={isDrawingPolyline}
        isDrawingBezier={isDrawingBezier}
        onAddPoint={() => {
          if (isDrawingBezier) {
            setBezierPoints(prev => [...prev, aimPos]);
          } else if (isDrawingPolyline) {
            setPolylinePoints(prev => [...prev, aimPos]);
          } else if (action && action.type === 'drawing') {
            const screenX = aimPos.x * viewTransform.scale + viewTransform.x;
            const screenY = aimPos.y * viewTransform.scale + viewTransform.y;
            handleMouseUp({ clientX: screenX, clientY: screenY, button: 0, target: svgRef.current } as any);
          } else if (activeTool !== 'select' && activeTool !== 'pan') {
            const screenX = aimPos.x * viewTransform.scale + viewTransform.x;
            const screenY = aimPos.y * viewTransform.scale + viewTransform.y;
            handleMouseDown({ clientX: screenX, clientY: screenY, button: 0, target: svgRef.current } as any);
          }
        }}
        onUndoPoint={() => {
          if (isDrawingBezier) {
            if (props.onUndoBezierPoint) {
              props.onUndoBezierPoint();
            } else {
              setBezierPoints(prev => prev.slice(0, -1));
            }
          } else if (isDrawingPolyline) {
            if (props.onUndoPolylinePoint) {
              props.onUndoPolylinePoint();
            } else {
              setPolylinePoints(prev => prev.slice(0, -1));
            }
          }
        }}
        onComplete={(isClosed) => {
          if (isDrawingBezier) {
            onCompleteBezier(isClosed);
          } else if (isDrawingPolyline) {
            onCompletePolyline(isClosed);
          }
        }}
        onCancel={() => {
          if (isDrawingBezier) {
            onCancelBezier();
          } else if (isDrawingPolyline) {
            onCancelPolyline();
          } else if (action) {
            setAction(null);
          }
        }}
        showMagnifier={props.showMagnifier ?? 'auto'}
        setShowMagnifier={(mode) => props.setShowMagnifier?.(mode)}
        onAimMove={(pos) => {
          setPreviewMousePos(pos);
          props.setCursorPos(pos);
        }}
        activeToolName={activeTool}
      />
    )}
    </div>
  );
};
export default Canvas;
