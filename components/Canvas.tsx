
import React, {useContext} from 'react';
import { useLanguage } from './LanguageContext';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { type Shape, type Tool, type CanvasAction, type RotatableShape, type RectangleShape, type EllipseShape, type PathShape, type LineShape, PolylineShape, PolygonShape, DrawMode, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, BezierCurveShape, ViewTransform, JoinStyle, ArcShape, RightTriangleShape, TransformHandle, TextShape, ImageShape, BitmapShape } from '../types';
import { SelectionControls } from './SelectionControls';
import { getShapeCenter, rotatePoint, getBoundingBox, getIsoscelesTrianglePoints, getPolylinePointsAsPath, getPolygonPointsAsArray, getRhombusPoints, getTrapezoidPoints, getParallelogramPoints, getSmoothedPathData, getFinalPoints, getArcPathData, getRightTrianglePoints, getTextBoundingBox, processTextLines, getVisualBoundingBox } from '../lib/geometry';
import { CheckSquareIcon, ClosePathIcon, XSquareIcon } from './icons';
import { TOOL_TYPE_TO_NAME, ROTATE_CURSOR_STYLE, ADJUST_CURSOR_STYLE, getDefaultNameForShape, getVisualFontFamily, isDefaultName, DUPLICATE_CURSOR_STYLE } from '../lib/constants';

interface CanvasProps {
  width: number;
  height: number;
  backgroundColor: string;
  shapes: Shape[];
  addShape: (shape: Shape, isDuplication?: boolean) => void;
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
  onSelectShape: (id: string | string[] | null, isShiftPressed?: boolean) => void;
  isDrawingPolyline: boolean;
  polylinePoints: {x: number, y: number}[];
  setPolylinePoints: React.Dispatch<React.SetStateAction<{x: number, y: number}[]>>;
  onCompletePolyline: (isClosed: boolean) => void;
  onCancelPolyline: () => void;
  isDrawingBezier: boolean;
  bezierPoints: {x: number, y: number}[];
  setBezierPoints: React.Dispatch<React.SetStateAction<{x: number, y: number}[]>>;
  onCompleteBezier: (isClosed: boolean) => void;
  onCancelBezier: () => void;
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
        width, height, backgroundColor, shapes, addShape, updateShape, updateShapes,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasDraggedRef = useRef(false);
  const mouseDownPosRef = useRef<{x: number, y: number} | null>(null);
  const touchStateRef = useRef<{ initialDist: number, initialMidpoint: {x:number, y:number}, initialTransform: ViewTransform } | null>(null);

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
    if (e.button === 1) { // Middle mouse button for panning
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    hasDraggedRef.current = false;
    const pos = getTransformedPointerPosition(getPointerPosition(e));
    mouseDownPosRef.current = pos;

    if (e.button === 2) { // Right mouse button for duplicating
        const clickedShapeId = (e.target as SVGElement).dataset.id;
        const shapeToDuplicate = clickedShapeId ? shapes.find(s => s.id === clickedShapeId) : null;

        if (shapeToDuplicate) {
             // If the right-clicked shape isn't the currently selected one, select it first.
            if (clickedShapeId && !selectedShapeIds.includes(clickedShapeId)) {
                onSelectShape(clickedShapeId);
            }
            // Use a type-safe deep copy to prevent mutation issues
            let deepCopiedShape: Shape;
            switch (shapeToDuplicate.type) {
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
    
    const targetElement = e.target as SVGElement;
    // Important: Check if the click is on a resize/rotate handle *first*.
    if (targetElement.closest('[data-handle="true"]')) {
      // The logic for this is handled by the onMouseDown in SelectionControls
      return;
    }

    if (isDrawingBezier) {
        setBezierPoints(prev => [...prev, pos]);
        return;
    }
    if (isDrawingPolyline) {
        setPolylinePoints(prev => [...prev, pos]);
        return;
    }

    const clickedShapeId = targetElement.dataset.id;
    const clickedShape = shapes.find(s => s?.id === clickedShapeId);

    if (activeTool === 'edit-points') {
        if (!clickedShape) {
          onSelectShape(null);
        } else if (clickedShape && clickedShape.state === 'normal') {
          if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.shiftKey);
          else if (e.shiftKey) onSelectShape(clickedShape.id, e.shiftKey);
        }
      return;
    }

    if (activeTool === 'select') {
        if (clickedShape && clickedShape.state !== 'disabled') {
            setAction({ type: 'dragging', initialShape: clickedShape, startPos: pos });
            if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.shiftKey);
            else if (e.shiftKey) onSelectShape(clickedShape.id, e.shiftKey);
        } else {
            // Clicked on empty space, initiate pan. Deselection happens on mouseUp if it was just a click.
            setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
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
  }, [activeTool, shapes, onSelectShape, fillColor, strokeColor, strokeWidth, textColor, textFont, textFontSize, numberOfSides, isDrawingPolyline, setPolylinePoints, isDrawingBezier, setBezierPoints, getTransformedPointerPosition, getPointerPosition, selectedShapeIds, pendingImage, setPendingImage, addShape, isImportingImage]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rawPos = getPointerPosition(e);
    setRawMousePos(rawPos);
    let pos = getTransformedPointerPosition(rawPos);
    setPreviewMousePos(pos);
    setCursorPos(pos);
    
    if (!hasDraggedRef.current && mouseDownPosRef.current) {
        const dist = Math.hypot(pos.x - mouseDownPosRef.current.x, pos.y - mouseDownPosRef.current.y);
        if (dist > DRAG_THRESHOLD) {
            hasDraggedRef.current = true;
        }
    }
    
    if (!action) return;

    let newSnapLines = { x: null as number | null, y: null as number | null };

    if ((enableSnapping || showCenterGuides) && (action.type === 'dragging' || action.type === 'duplicating') && !e.altKey) {
        let dx = pos.x - action.startPos.x;
        let dy = pos.y - action.startPos.y;
        if (e.shiftKey) {
            if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
        }

        const movingBboxOriginal = getVisualBoundingBox(action.initialShape, undefined, shapes);
        
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
                const otherShapes = shapes.filter(s => !selectedShapeIds.includes(s.id) && s.groupId === undefined);

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
            
            pos = { x: action.startPos.x + bestDx, y: action.startPos.y + bestDy };
        }
    }
    
    const modifyingActions = ['point-editing', 'arc-angle-editing', 'triangle-vertex-editing', 'star-inner-radius-editing', 'trapezoid-offset-editing', 'parallelogram-angle-editing'];
    const isSnappableModifyingAction = modifyingActions.includes(action.type) && (action.type === 'point-editing' || !('rotation' in action.initialShape) || (action.initialShape as any).rotation === 0);

    if ((enableSnapping || showCenterGuides) && (action.type === 'resizing' || action.type === 'drawing' || isSnappableModifyingAction) && !e.altKey && (action.type !== 'resizing' || !('rotation' in action.initialShape) || action.initialShape.rotation === 0)) {
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
                if (!isLineStart && !isLineEnd && 'x' in action.initialShape) {
                    const fixedX = action.handle.includes('right') ? action.initialShape.x : action.initialShape.x + action.initialShape.width;
                    movingXPoints.push({ current: (fixedX + pos.x) / 2, getPos: t => 2 * t - fixedX });
                }
            }
            if (snapY) {
                movingYPoints.push({ current: pos.y, getPos: t => t });
                if (!isLineStart && !isLineEnd && 'y' in action.initialShape) {
                    const fixedY = action.handle.includes('bottom') ? action.initialShape.y : action.initialShape.y + action.initialShape.height;
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
            
            const shape = action.initialShape;
            
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
                updatedShape = { ...shape, points: [...shape.points, pos] };
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
        
    const shapeToTransform = activeTransformShape ?? ('initialShape' in action ? action.initialShape : null);
    if (!shapeToTransform) return;
        
    let updatedShape: Shape = shapeToTransform!;

    switch(action.type) {
        case 'point-editing': {
            // The pointIndex and stable center are the only things needed from the action for this logic.
            const { pointIndex, center } = action;
            
            // CRITICAL FIX: Use shapeToTransform, which holds the cumulative changes from the drag,
            // as the base for the next update. Do NOT use action.initialShape.
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
            // Get current angle in a CCW system (Y-up)
            const currentMouseAngle = Math.atan2(-(pos.y - center.y), pos.x - center.x) * 180 / Math.PI;
            
            // Calculate delta from the start of the drag, handling the -180/180 degree jump
            let angleDelta = currentMouseAngle - initialMouseAngle;
            if (angleDelta > 180) angleDelta -= 360;
            if (angleDelta < -180) angleDelta += 360;
    
            if (handle === 'move' || initialShape.isExtentLocked) {
                updatedShape = { ...initialShape, start: initialShape.start + angleDelta };
            } else { // Unlocked and start/end handle
                if (handle === 'start') {
                    const newStart = initialShape.start + angleDelta;
                    const newExtent = initialShape.extent - angleDelta;
                    updatedShape = { ...initialShape, start: newStart, extent: wrapAngle(newExtent) };
                } else { // handle === 'end'
                    const newExtent = initialShape.extent + angleDelta;
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

            let newBbox: { x: number, y: number, width: number, height: number};
            
            const isHorizontalHandle = handle.includes('left') || handle.includes('right');
            const isVerticalHandle = handle.includes('top') || handle.includes('bottom');
            
            const isLocked = ('isAspectRatioLocked' in initialShape && initialShape.isAspectRatioLocked) || e.shiftKey;

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
                
                const x = handle.includes('left') ? anchorPointLocal.x - width : anchorPointLocal.x;
                const y = handle.includes('top') ? anchorPointLocal.y - height : anchorPointLocal.y;
                newBbox = { x, y, width, height };
                
            } else if (isLocked) { // Locked side handle
                const aspectRatio = (initialBbox.height === 0 || initialBbox.width === 0) ? 1 : initialBbox.width / initialBbox.height;
                if (isHorizontalHandle) {
                    const width = Math.abs(mousePosLocal.x - anchorPointLocal.x);
                    const height = width / aspectRatio;
                    newBbox = {
                        x: Math.min(mousePosLocal.x, anchorPointLocal.x),
                        y: (initialBbox.y + initialBbox.height / 2) - height / 2,
                        width,
                        height,
                    };
                } else { // Vertical handle
                    const height = Math.abs(mousePosLocal.y - anchorPointLocal.y);
                    const width = height * aspectRatio;
                    newBbox = {
                        x: (initialBbox.x + initialBbox.width / 2) - width / 2,
                        y: Math.min(mousePosLocal.y, anchorPointLocal.y),
                        width,
                        height,
                    };
                }
            } else { // Unlocked side handle
                if (isHorizontalHandle) {
                    newBbox = {
                        x: Math.min(mousePosLocal.x, anchorPointLocal.x),
                        y: initialBbox.y,
                        width: Math.abs(mousePosLocal.x - anchorPointLocal.x),
                        height: initialBbox.height
                    };
                } else { // Vertical handle
                     newBbox = {
                        x: initialBbox.x,
                        y: Math.min(mousePosLocal.y, anchorPointLocal.y),
                        width: initialBbox.width,
                        height: Math.abs(mousePosLocal.y - anchorPointLocal.y)
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
            
            switch(initialShape.type) {
                case 'text': {
                    const oldBbox = getTextBoundingBox(initialShape)!;
                    if (oldBbox.width <= 0) break;
                    const scale = newWidth / oldBbox.width;
                    const newFontSize = Math.max(0.1, initialShape.fontSize * scale);

                    const newVisualBbox = { 
                        x: newGlobalCenter.x - newWidth / 2, 
                        y: newGlobalCenter.y - newHeight / 2, 
                        width: newWidth, 
                        height: newHeight 
                    };

                    const anchor = initialShape.anchor;
                    let newX = newVisualBbox.x;
                    let newY = newVisualBbox.y;

                    if (['n', 's', 'center'].includes(anchor)) newX += newVisualBbox.width / 2;
                    if (['ne', 'e', 'se'].includes(anchor)) newX += newVisualBbox.width;
                    if (['w', 'e', 'center'].includes(anchor)) newY += newVisualBbox.height / 2;
                    if (['sw', 's', 'se'].includes(anchor)) newY += newVisualBbox.height;
                    
                    updatedShape = { ...initialShape, fontSize: parseFloat(newFontSize.toFixed(1)), x: newX, y: newY };
                    break;
                }
                case 'triangle': {
                    const tri = initialShape as IsoscelesTriangleShape;
                    const initialLocalVertices = getIsoscelesTrianglePoints(tri);
                    const visualBbox = getBoundingBox({ ...tri, rotation: 0 })!;

                    const scaleX = visualBbox.width > 0 ? newWidth / visualBbox.width : 1;
                    const scaleY = visualBbox.height > 0 ? newHeight / visualBbox.height : 1;

                    const scaledVertices = initialLocalVertices.map(v => ({
                        x: anchorPointLocal.x + (v.x - anchorPointLocal.x) * scaleX,
                        y: anchorPointLocal.y + (v.y - anchorPointLocal.y) * scaleY,
                    }));

                    const all_x = scaledVertices.map(v => v.x);
                    const all_y = scaledVertices.map(v => v.y);
                    const newVisualBboxLocal = {
                        x: Math.min(...all_x),
                        y: Math.min(...all_y),
                        width: Math.max(...all_x) - Math.min(...all_x),
                        height: Math.max(...all_y) - Math.min(...all_y),
                    };

                    const topVertex = scaledVertices[0];
                    const baseVertices = [scaledVertices[1], scaledVertices[2]];

                    const newShapeWidth = Math.abs(baseVertices[0].x - baseVertices[1].x);
                    const newShapeHeight = Math.abs(topVertex.y - baseVertices[0].y);
                    const newShapeX_local = Math.min(baseVertices[0].x, baseVertices[1].x);
                    const newShapeY_local = topVertex.y;
                    const newTopVertexOffset = newShapeWidth > 0 ? (topVertex.x - (newShapeX_local + newShapeWidth / 2)) / newShapeWidth : 0;
                    
                    const deltaX = newShapeX_local - newVisualBboxLocal.x;
                    const deltaY = newShapeY_local - newVisualBboxLocal.y;

                    const newVisualX_global = newGlobalCenter.x - newVisualBboxLocal.width / 2;
                    const newVisualY_global = newGlobalCenter.y - newVisualBboxLocal.height / 2;
                
                    const finalShapeX = newVisualX_global + deltaX;
                    const finalShapeY = newVisualY_global + deltaY;

                    updatedShape = {
                        ...tri,
                        x: finalShapeX,
                        y: finalShapeY,
                        width: newShapeWidth,
                        height: newShapeHeight,
                        topVertexOffset: newTopVertexOffset
                    };
                    break;
                }
                case 'trapezoid': {
                    const trap = initialShape as TrapezoidShape;
                    const initialLocalVertices = getTrapezoidPoints(trap);
                    const visualBbox = getBoundingBox({ ...trap, rotation: 0 })!;

                    const scaleX = visualBbox.width > 0 ? newWidth / visualBbox.width : 1;
                    const scaleY = visualBbox.height > 0 ? newHeight / visualBbox.height : 1;

                    const scaledVertices = initialLocalVertices.map(v => ({
                        x: anchorPointLocal.x + (v.x - anchorPointLocal.x) * scaleX,
                        y: anchorPointLocal.y + (v.y - anchorPointLocal.y) * scaleY,
                    }));

                    const all_x = scaledVertices.map(v => v.x);
                    const all_y = scaledVertices.map(v => v.y);
                    const newVisualBboxLocal = {
                        x: Math.min(...all_x),
                        y: Math.min(...all_y),
                        width: Math.max(...all_x) - Math.min(...all_x),
                        height: Math.max(...all_y) - Math.min(...all_y),
                    };

                    let newShapeWidth = 0;
                    let newShapeHeight = 0;
                    let newShapeX_local = 0;
                    let newShapeY_local = 0;
                    let newLeftOffsetRatio = trap.topLeftOffsetRatio;
                    let newRightOffsetRatio = trap.topRightOffsetRatio;

                    if (trap.isFlippedVertically) {
                        newShapeY_local = scaledVertices[0].y;
                        newShapeHeight = scaledVertices[3].y - scaledVertices[0].y;
                        newShapeX_local = scaledVertices[0].x;
                        newShapeWidth = scaledVertices[1].x - scaledVertices[0].x;
                        if (newShapeWidth > 0) {
                            newLeftOffsetRatio = (scaledVertices[3].x - scaledVertices[0].x) / newShapeWidth;
                            newRightOffsetRatio = (scaledVertices[1].x - scaledVertices[2].x) / newShapeWidth;
                        }
                    } else {
                        newShapeY_local = scaledVertices[0].y;
                        newShapeHeight = scaledVertices[3].y - scaledVertices[0].y;
                        newShapeX_local = scaledVertices[3].x;
                        newShapeWidth = scaledVertices[2].x - scaledVertices[3].x;
                        if (newShapeWidth > 0) {
                            newLeftOffsetRatio = (scaledVertices[0].x - scaledVertices[3].x) / newShapeWidth;
                            newRightOffsetRatio = (scaledVertices[2].x - scaledVertices[1].x) / newShapeWidth;
                        }
                    }
                    
                    const deltaX = newShapeX_local - newVisualBboxLocal.x;
                    const deltaY = newShapeY_local - newVisualBboxLocal.y;

                    const newVisualX_global = newGlobalCenter.x - newVisualBboxLocal.width / 2;
                    const newVisualY_global = newGlobalCenter.y - newVisualBboxLocal.height / 2;
                
                    const finalShapeX = newVisualX_global + deltaX;
                    const finalShapeY = newVisualY_global + deltaY;

                    updatedShape = {
                        ...trap,
                        x: finalShapeX,
                        y: finalShapeY,
                        width: Math.abs(newShapeWidth),
                        height: Math.abs(newShapeHeight),
                        topLeftOffsetRatio: newLeftOffsetRatio,
                        topRightOffsetRatio: newRightOffsetRatio
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
                    updatedShape = { ...initialShape, x: newX, y: newY, width: newWidth, height: newHeight };
                    break;
                }
                case 'ellipse': {
                    const newRx = newWidth / 2;
                    const newRy = newHeight / 2;
                    updatedShape = { ...initialShape, cx: newGlobalCenter.x, cy: newGlobalCenter.y, rx: newRx, ry: newRy };
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
                    updatedShape = { ...initialShape, cx: newGlobalCenter.x, cy: newGlobalCenter.y, radius: newRadius, innerRadius: newInnerRadius };
                    break;
                }
                case 'line': // Should be handled by the early exit, but as a fallback:
                case 'bezier':
                case 'pencil':
                case 'polyline': {
                    const scaleX = initialBbox.width !== 0 ? newWidth / initialBbox.width : 1;
                    const scaleY = initialBbox.height !== 0 ? newHeight / initialBbox.height : 1;
                
                    const scaledPoints = initialShape.points.map(p => ({
                        x: newBbox.x + (p.x - initialBbox.x) * scaleX,
                        y: newBbox.y + (p.y - initialBbox.y) * scaleY,
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
            newRotationDeg = Math.round(newRotationDeg);

            updatedShape = { ...initialShape, rotation: newRotationDeg };
            break;
        }
    }
    
    // Simulate resizing, rotating, or translating for other selected shapes
    let auxShapes: Shape[] = [];
    if ((action.type === 'resizing' || action.type === 'rotating' || action.type === 'dragging' || action.type === 'duplicating') && selectedShapeIds.length > 1 && updatedShape) {
        if (action.type === 'rotating') {
            const rotShape = updatedShape as Shape & RotatableShape;
            const initShape = action.initialShape as Shape & RotatableShape;
            const deltaRot = (rotShape.rotation ?? 0) - (initShape.rotation ?? 0);
            
            auxShapes = selectedShapeIds
                .filter(id => id !== action.initialShape.id)
                .map(id => {
                    const s = shapes.find(sh => sh.id === id);
                    if (s && 'rotation' in s) return { ...s, rotation: (s.rotation || 0) + deltaRot };
                    return s;
                }).filter(Boolean) as Shape[];
        } else if (action.type === 'resizing') {
            if (action.handle === 'line-start' || action.handle === 'line-end') {
                const initLine = action.initialShape as LineShape;
                const newPoints = (updatedShape as LineShape).points;
                const dx = newPoints[0].x - initLine.points[0].x;
                const dy = newPoints[0].y - initLine.points[0].y;
                const dxEnd = newPoints[1].x - initLine.points[1].x;
                const dyEnd = newPoints[1].y - initLine.points[1].y;

                auxShapes = selectedShapeIds
                    .filter(id => id !== action.initialShape.id)
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
                const oldBbox = action.initialShapeProps.bbox;
                const newBbox = getBoundingBox({ ...updatedShape, rotation: 0 });
                // We shouldn't strictly require oldBbox.width > 0 && oldBbox.height > 0
                // For lines/rectangles it could be 0. But let's keep it safe.
                if (oldBbox && newBbox) {
                    const safeOldW = oldBbox.width === 0 ? 1 : oldBbox.width;
                    const safeOldH = oldBbox.height === 0 ? 1 : oldBbox.height;
                    const scaleX = newBbox.width / safeOldW;
                    const scaleY = newBbox.height / safeOldH;
                    
                    auxShapes = selectedShapeIds
                        .filter(id => id !== action.initialShape.id)
                        .map(id => {
                            const s = shapes.find(sh => sh.id === id);
                            if (!s) return null;
                            
                            // Scale proportionally relative to corresponding anchor
                            const sBbox = getBoundingBox({ ...s, rotation: 0 });
                            if (!sBbox) return s;
                            
                            // We approximate scaling for simple cases
                            const newW = sBbox.width * scaleX;
                            const newH = sBbox.height * scaleY;
                            
                            let simulatedX = sBbox.x;
                            if (action.handle.includes('left')) {
                                simulatedX = sBbox.x + sBbox.width - newW;
                            } else if (action.handle.includes('right')) {
                                simulatedX = sBbox.x;
                            } else {
                                simulatedX = sBbox.x + sBbox.width / 2 - newW / 2;
                            }

                            let simulatedY = sBbox.y;
                            if (action.handle.includes('top')) {
                                simulatedY = sBbox.y + sBbox.height - newH;
                            } else if (action.handle.includes('bottom')) {
                                simulatedY = sBbox.y;
                            } else {
                                simulatedY = sBbox.y + sBbox.height / 2 - newH / 2;
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
            
            auxShapes = selectedShapeIds
                .filter(id => id !== action.initialShape.id)
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
    // If a pan was started with the left mouse but not dragged, it's a click on empty space -> deselect.
    // This prevents deselecting when middle-mouse panning.
    if (action?.type === 'panning' && !hasDraggedRef.current && e.button === 0) {
        onSelectShape(null);
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
            // activeTransformShape contains the final geometry after dragging.
            // It was created from a deep copy of the original shape, so it has all the original properties (name, color, etc.).
            // We just need to assign a new unique ID before adding it to the canvas.
            const newIds: string[] = [];
            const timeStr = new Date().getTime();
            
            const newShape = { 
                ...activeTransformShapeRef.current, 
                id: `dup-${timeStr}-0` 
            };
            addShape(newShape, true);
            newIds.push(newShape.id);
            
            auxiliaryTransformShapesRef.current.forEach((shape, index) => {
                const newAux = {
                    ...shape,
                    id: `dup-${timeStr}-${index + 1}`
                };
                addShape(newAux, true);
                newIds.push(newAux.id);
            });
            
            onSelectShape(newIds);
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
    }
    
    setAction(null);
    setActiveTransformShape(null);
    setAuxiliaryTransformShapes([]);
    hasDraggedRef.current = false;
    mouseDownPosRef.current = null;
  }, [action, addShape, updateShape, updateShapes, onSelectShape, activeTransformShape, auxiliaryTransformShapes, showNotification]);
  
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
        e.preventDefault();
        
        // If it's a multi-touch gesture, handle pan/zoom and stop.
        // This prevents the single-touch logic from deselecting the shape.
        if (e.touches.length >= 2) {
            const [t1, t2] = [e.touches[0], e.touches[1]];
            const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

            // Guard against division by zero if fingers are at the same spot
            if (dist < 1) {
                touchStateRef.current = null;
                return;
            }

            const midpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
            touchStateRef.current = { initialDist: dist, initialMidpoint: midpoint, initialTransform: viewTransform };
            setAction(null); // Cancel any drawing/dragging action
            return;
        }

        // Only handle single touches from here
        const touch = e.touches[0];
        const mockMouseEvent = { 
            clientX: touch.clientX, 
            clientY: touch.clientY, 
            button: 0, 
            target: e.target 
        } as unknown as React.MouseEvent<HTMLDivElement>;
        handleMouseDown(mockMouseEvent);

    }, [handleMouseDown, viewTransform]);

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const mockMouseEvent = { clientX: touch.clientX, clientY: touch.clientY, button: 0 } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseMove(mockMouseEvent);
        } else if (e.touches.length === 2 && touchStateRef.current) {
            const { initialDist, initialMidpoint, initialTransform } = touchStateRef.current;
            
            // Guard against division by zero
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
    }, [handleMouseMove, setViewTransform, getPointerPosition]);

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.touches.length < 2) {
            touchStateRef.current = null;
        }
        
        // When the last touch ends, we need to get its position to register a "click" or "tap".
        const touch = e.changedTouches[0];
        if (touch) {
            const mockMouseEvent = { 
                clientX: touch.clientX, 
                clientY: touch.clientY, 
                button: 0,
                target: e.target, // Pass target for selection logic
            } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseUp(mockMouseEvent);
        } else {
            // Fallback if there are no changed touches, though this is unlikely
            const mockMouseEvent = { button: 0 } as unknown as React.MouseEvent<HTMLDivElement>;
            handleMouseUp(mockMouseEvent);
        }
    }, [handleMouseUp]);
  
    const itemsToRender = useMemo(() => {
        let items = [...shapes];

        if (action?.type === 'drawing' && hasDraggedRef.current) {
            items.push(action.shape);
        } else if (action?.type === 'duplicating' && activeTransformShape) {
            items.push(activeTransformShape);
        } else if (activeTransformShape) {
            const index = items.findIndex(s => s?.id === activeTransformShape.id);
            if (index !== -1) {
                items[index] = activeTransformShape;
            }
        }
        
        auxiliaryTransformShapes.forEach(auxShape => {
            const index = items.findIndex(s => s?.id === auxShape.id);
            if (index !== -1) items[index] = auxShape;
        });
    
    if (isDrawingPolyline && polylinePoints.length > 0 && previewMousePos) {
      const cleanPoints = polylinePoints.filter(Boolean);
      if (cleanPoints.length > 0) {
          items.push({
            id: 'temp-polyline-main', type: 'polyline', points: cleanPoints, isClosed: false,
            stroke: strokeColor, strokeWidth: strokeWidth, fill: 'none', state: 'normal', joinstyle: 'round', rotation: 0, capstyle: 'round'
          });
          items.push({
            id: 'temp-polyline-rubberband', type: 'line', points: [cleanPoints[cleanPoints.length-1], previewMousePos],
            stroke: strokeColor, strokeWidth: 1, rotation: 0, state: 'normal', dash: [4, 4]
          } as LineShape);
      }
    }
    
    if (isDrawingBezier && bezierPoints.length > 0 && previewMousePos) {
        const cleanPoints = bezierPoints.filter(Boolean);
        if (cleanPoints.length > 0) {
            const allPoints = [...cleanPoints, previewMousePos];
            
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
    return selectedShapeIds.map(id => {
       const aux = auxiliaryTransformShapes.find(a => a.id === id);
       if (aux) return aux;
       const s = shapes.find(s => s?.id === id);
       if (s?.id === activeTransformShape?.id) { return activeTransformShape; }
       return s;
    }).filter(s => s != null) as Shape[];
  }, [shapes, selectedShapeIds, activeTransformShape, auxiliaryTransformShapes]);

  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;

  const shapesByGroup = useMemo(() => {
        const groups: Record<string, Shape[]> = {};
        const looseShapes: Shape[] = [];
        
        selectedShapes.forEach(shape => {
            if (shape.groupId) {
                if (!groups[shape.groupId]) groups[shape.groupId] = [];
                groups[shape.groupId].push(shape);
            } else {
                looseShapes.push(shape);
            }
        });
        return { groups, looseShapes };
  }, [selectedShapes]);

  const computeGroupBounds = (shapesArray: Shape[]) => {
       let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
       shapesArray.forEach(shape => {
           const b = getVisualBoundingBox(shape, undefined, shapes);
           if (!b) return;
           minX = Math.min(minX, b.x);
           minY = Math.min(minY, b.y);
           maxX = Math.max(maxX, b.x + b.width);
           maxY = Math.max(maxY, b.y + b.height);
       });
       if (minX === Infinity) return null;
       return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };


    const getCursorStyle = () => {
        if (!action) {
          if (activeTool === 'select') return 'grab';
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
    if ('rotation' in shape && shape.rotation && shape.rotation !== 0) {
        const center = shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape);
        if(center) return `rotate(${-shape.rotation} ${center.x} ${center.y})`;
    }
    return undefined;
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
        
        const buttonBaseClass = "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-200 text-sm font-semibold";
        const enabledBlueClass = "bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)]";
        const enabledRedClass = "bg-[var(--destructive-bg)] text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)]";
        const disabledClass = "bg-[var(--bg-disabled)] text-[var(--text-disabled)] cursor-not-allowed";

        return (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-[var(--bg-primary)]/80 backdrop-blur-sm p-1 rounded-lg shadow-lg flex items-center gap-2 z-10"
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              <button
                onClick={() => isDrawingPolyline ? onCompletePolyline(false) : onCompleteBezier(false)}
                title={t('canvas.finish')}
                disabled={!canComplete}
                className={`${buttonBaseClass} ${canComplete ? enabledBlueClass : disabledClass}`}
              >
                <CheckSquareIcon />
                <span>{t('canvas.finish')}</span>
              </button>
              <button
                onClick={() => isDrawingPolyline ? onCompletePolyline(true) : onCompleteBezier(true)}
                title={t('canvas.closePoly')}
                disabled={!canClose}
                className={`${buttonBaseClass} ${canClose ? enabledBlueClass : disabledClass}`}
              >
                <ClosePathIcon />
                <span>{t('canvas.closePoly')}</span>
              </button>
              <button
                onClick={() => isDrawingPolyline ? onCancelPolyline() : onCancelBezier()}
                title={t('action.cancel')}
                className={`${buttonBaseClass} ${enabledRedClass}`}
              >
                <XSquareIcon />
                <span>{t('action.cancel')}</span>
              </button>
            </div>
        );
    }, [isDrawingPolyline, isDrawingBezier, polylinePoints, bezierPoints, onCompletePolyline, onCompleteBezier, onCancelPolyline, onCancelBezier]);

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
  
  const isEngagedInRotation = action?.type === 'rotating';
  const isDuplicating = action?.type === 'duplicating';

  const rotationInfo = useMemo(() => {
    if (isEngagedInRotation && action.initialShape && 'rotation' in action.initialShape) {
        let currentRotation: number | null = null;
        if (activeTransformShape && 'rotation' in activeTransformShape) {
            currentRotation = (activeTransformShape as RotatableShape).rotation;
        } else if (action.initialShape && 'rotation' in action.initialShape) {
            currentRotation = (action.initialShape as RotatableShape).rotation;
        }

        if (currentRotation !== null) {
            const initialRotation = action.initialShape.rotation;
            let delta = currentRotation - initialRotation;
            
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;
            
            return {
                absolute: currentRotation,
                delta: delta
            };
        }
    }
    return null;
  }, [action, activeTransformShape, isEngagedInRotation]);
  
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
                        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke={gridStrokeColor} strokeWidth={1 / viewTransform.scale}/>
                    </pattern>
                )}
                {showGrid && viewTransform.scale > 10 && (
                     <pattern id="fine-grid" width="1" height="1" patternUnits="userSpaceOnUse">
                        <path d="M 1 0 L 0 0 0 1" fill="none" stroke={fineGridStrokeColor} strokeWidth={1 / viewTransform.scale} />
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

            <g transform={`translate(${viewTransform.x} ${viewTransform.y}) scale(${viewTransform.scale})`}>
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

            {itemsToRender.filter(Boolean).map(shape => {
                if (shape.state === 'hidden') return null;

                const isDisabled = shape.state === 'disabled';
                const isDrawing = activeTool !== 'select';
                const isDuplicationPreview = action?.type === 'duplicating' && shape === activeTransformShape;
                const shapeCursor = isDisabled ? 'default' : (isDrawing ? 'inherit' : 'move');
                const hitboxStrokeWidth = Math.max(shape.strokeWidth, 20 / viewTransform.scale);
                
                let transform = getTransform(shape);
                const isThisShapeBeingPointEdited = action?.type === 'point-editing' && shape.id === action.initialShape.id;
                // FIX: Complete the variable name from `isThisShapeBeing` to `isThisShapeBeingPointEdited`.
                if (isThisShapeBeingPointEdited) {
                    transform = undefined;
                }

                // FIX: Removed explicit type React.SVGProps<any> to allow the 'data-id' attribute,
                // which was causing a TypeScript error. Type inference correctly handles validation on spread.
                const staticProps = {
                    'data-id': shape.id,
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    style: { 
                        opacity: shape.state === 'disabled' || isDuplicationPreview ? 0.5 : 1,
                        cursor: shapeCursor,
                     },
                    transform: transform,
                };

                const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | PathShape | ArcShape) => {
                    const hasVisibleStroke = s.stroke !== 'none' && s.strokeWidth > 0;
                    let dashArray;
                    const hasDash = 'dash' in s && s.dash && s.dash.length > 0 && s.strokeWidth > 0;
                    if (hasDash) {
                        dashArray = s.dash!.map(value => value * s.strokeWidth).join(' ');
                    }
                    const dashOffset = 'dashoffset' in s ? s.dashoffset : undefined;
                    const lineCap: 'butt' | 'round' | 'square' = (s.capstyle === 'projecting' ? 'square' : s.capstyle) ?? 'butt';
                    
                    let markerStart, markerEnd;
                    if (hasVisibleStroke && 'arrow' in s && s.arrow && s.arrow !== 'none' && s.arrowshape) {
                        const [d1m, d2m, d3m] = s.arrowshape;
                        const w = s.strokeWidth;
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
                    strokeWidth: shape.strokeWidth, // Завжди використовуємо візуальну товщину
                    pointerEvents: (shape.type === 'line' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) ? 'stroke' : 'all',
                }

                switch (shape.type) {
                    case 'rectangle': {
                        const rectProps: any = { ...finalStaticProps, x: shape.x, y: shape.y, width: shape.width, height: shape.height, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') rectProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) rectProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) rectProps.strokeDashoffset = shape.dashoffset;
                        return <rect key={shape.id} {...rectProps} />;
                    }
                    case 'ellipse': {
                        const ellipse = shape as EllipseShape;
                        const ellipseProps: any = { ...finalStaticProps, cx: ellipse.cx, cy: ellipse.cy, rx: ellipse.rx, ry: ellipse.ry, fill: ellipse.fill };
                        if (ellipse.stipple && ellipse.fill !== 'none') ellipseProps.mask = `url(#mask-${ellipse.stipple})`;
                        if (ellipse.dash) ellipseProps.strokeDasharray = ellipse.dash.map(v => v * ellipse.strokeWidth).join(' ');
                        if (ellipse.dashoffset) ellipseProps.strokeDashoffset = ellipse.dashoffset;
                        return <ellipse key={ellipse.id} {...ellipseProps} />;
                    }
                    case 'arc': {
                        const arcShape = shape as ArcShape;
                        const arcProps: any = { ...finalStaticProps, d: getArcPathData(arcShape), fill: arcShape.style === 'arc' ? 'none' : arcShape.fill };
                        if (arcShape.stipple && arcShape.fill !== 'none' && arcShape.style !== 'arc') arcProps.mask = `url(#mask-${arcShape.stipple})`;
                        if (arcShape.dash) arcProps.strokeDasharray = arcShape.dash.map(v => v * arcShape.strokeWidth).join(' ');
                        if (arcShape.dashoffset) arcProps.strokeDashoffset = arcShape.dashoffset;
                        return <path key={shape.id} {...arcProps} />;
                    }
                    case 'line':
                        return (
                            <React.Fragment key={shape.id}>
                                <line 
                                    x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} 
                                    stroke="transparent" strokeWidth={hitboxStrokeWidth}
                                    data-id={shape.id}
                                    strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'butt')}
                                    transform={finalStaticProps.transform}
                                    style={{ cursor: finalStaticProps.style.cursor, pointerEvents: 'stroke' }}
                                />
                                <line {...finalStaticProps} stroke={shape.stroke} strokeWidth={shape.strokeWidth} x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} {...lineLikeProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
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
                                        style={{ cursor: finalStaticProps.style.cursor, pointerEvents: 'stroke' }}
                                    />
                                    <path {...finalStaticProps} stroke={shape.stroke} strokeWidth={shape.strokeWidth} d={pathData} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
                                </React.Fragment>
                             )
                        }
                        return <path key={shape.id} {...finalStaticProps} stroke={shape.stroke} strokeWidth={shape.strokeWidth} d={pathData} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} />;
                    }
                    case 'pencil': {
                        const d = getPolylinePointsAsPath(shape.points);
                        return (
                            <React.Fragment key={shape.id}>
                                 <path 
                                    d={d}
                                    stroke="transparent"
                                    strokeWidth={hitboxStrokeWidth}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin={shape.joinstyle ?? 'round'}
                                    transform={finalStaticProps.transform}
                                    data-id={shape.id}
                                    style={{ cursor: finalStaticProps.style.cursor, pointerEvents: 'stroke' }}
                                 />
                                 <path {...finalStaticProps} stroke={shape.stroke} strokeWidth={shape.strokeWidth} d={d} fill="none" strokeLinecap="round" {...joinStyleProps(shape)} {...lineLikeProps(shape)} style={{ ...finalStaticProps.style, pointerEvents: 'none' }} />
                            </React.Fragment>
                        );
                    }
                    case 'polyline': {
                        const polyProps: React.SVGProps<any> = { ...finalStaticProps, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.isClosed && shape.fill !== 'none') polyProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) polyProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
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
                                        <path d={d!} stroke="transparent" strokeWidth={hitboxStrokeWidth} fill="none" strokeLinecap="round" strokeLinejoin={shape.joinstyle ?? 'miter'} transform={finalStaticProps.transform} data-id={shape.id} style={{ cursor: finalStaticProps.style.cursor, pointerEvents: 'stroke' }} />
                                    ) : (
                                        <polyline points={pointsStr!} stroke="transparent" strokeWidth={hitboxStrokeWidth} fill="none" strokeLinecap={shape.capstyle === 'projecting' ? 'square' : (shape.capstyle ?? 'butt')} strokeLinejoin={shape.joinstyle ?? 'miter'} transform={finalStaticProps.transform} data-id={shape.id} style={{ cursor: finalStaticProps.style.cursor, pointerEvents: 'stroke' }} />
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
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'right-triangle': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getRightTrianglePoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'rhombus': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getRhombusPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'trapezoid': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getTrapezoidPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'parallelogram': {
                        const props: any = { ...finalStaticProps, points: formatPointsForSvg(getParallelogramPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                        return <polygon key={shape.id} {...props} />;
                    }
                    case 'polygon':
                    case 'star': {
                        const polyShape = shape as PolygonShape;
                        const polyProps: any = { ...finalStaticProps, fill: polyShape.fill, ...joinStyleProps(polyShape) };
                        if (polyShape.stipple && polyShape.fill !== 'none') polyProps.mask = `url(#mask-${polyShape.stipple})`;
                        if (polyShape.dash) polyProps.strokeDasharray = polyShape.dash.map(v => v * polyShape.strokeWidth).join(' ');
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
                                dominantBaseline="hanging"
                                style={{ ...staticProps.style, ...textStyles }}
                            >
                                {lines.map((line, index) => (
                                    <tspan key={index} data-id={shape.id} x={textBlockX} dy={index === 0 ? 0 : `${fontSize * 1.2}px`}>
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        );
                    }
                    case 'image': {
                        const imageShape = shape as ImageShape;
                        return (
                            <image
                                key={imageShape.id}
                                href={imageShape.src}
                                x={imageShape.x}
                                y={imageShape.y}
                                width={imageShape.width}
                                height={imageShape.height}
                                {...finalStaticProps}
                            />
                        );
                    }
                    case 'bitmap': {
                        const bitmapShape = shape as BitmapShape;
                        const { x, y, width: bmpWidth, height: bmpHeight, bitmapType, foreground, background } = bitmapShape;
                        const maskId = bitmapType.startsWith('gray')
                            ? `url(#mask-${bitmapType})`
                            : `url(#mask-bitmap-${bitmapType})`;

                        return (
                            <g key={bitmapShape.id} {...staticProps} data-id={shape.id}>
                                <rect data-id={shape.id} x={x} y={y} width={bmpWidth} height={bmpHeight} fill={background} />
                                <rect data-id={shape.id} x={x} y={y} width={bmpWidth} height={bmpHeight} fill={foreground} mask={maskId} />
                            </g>
                        );
                    }
                    default: return null;
                }
            })}
             {selectedShapes.map((shape) => (
                 <SelectionControls
                     key={`selection-controls-${shape.id}`}
                     shape={shape}
                     allShapes={shapes}
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
             {selectedShapes.length > 1 && (
                <g style={{ pointerEvents: 'none' }}>
                    {Object.entries(shapesByGroup.groups).map(([groupId, shapesInGroup]) => {
                        const groupBounds = computeGroupBounds(shapesInGroup);
                        if (!groupBounds) return null;
                        return (
                            <rect 
                                key={`group-bounds-${groupId}`}
                                x={groupBounds.x}
                                y={groupBounds.y}
                                width={groupBounds.width}
                                height={groupBounds.height}
                                fill="none"
                                stroke="var(--text-tertiary)"
                                strokeWidth={1 / viewTransform.scale}
                                strokeDasharray={`${3 / viewTransform.scale} ${3 / viewTransform.scale}`}
                            />
                        );
                    })}
                </g>
            )}
            
            {/* Center Guides */}
            {showCenterGuides && (
                <>
                    <line 
                        x1={width / 2} y1={-100000} x2={width / 2} y2={100000} 
                        stroke="var(--text-tertiary)"
                        strokeOpacity="0.4"
                        strokeWidth={1 / viewTransform.scale} 
                        pointerEvents="none"
                    />
                    <line 
                        x1={-100000} y1={height / 2} x2={100000} y2={height / 2} 
                        stroke="var(--text-tertiary)"
                        strokeOpacity="0.4"
                        strokeWidth={1 / viewTransform.scale} 
                        pointerEvents="none"
                    />
                </>
            )}

            {/* Snap Lines */}
            {(snapLines.x !== null || (keyboardSnapLines && keyboardSnapLines.x !== null)) && (
                <line 
                    x1={snapLines.x !== null ? snapLines.x : keyboardSnapLines?.x} y1={-100000} x2={snapLines.x !== null ? snapLines.x : keyboardSnapLines?.x} y2={100000} 
                    stroke="var(--accent-primary)" 
                    strokeWidth={1 / viewTransform.scale} 
                    strokeDasharray={`${5 / viewTransform.scale},${5 / viewTransform.scale}`} 
                    pointerEvents="none"
                />
            )}
            {(snapLines.y !== null || (keyboardSnapLines && keyboardSnapLines.y !== null)) && (
                <line 
                    x1={-100000} y1={snapLines.y !== null ? snapLines.y : keyboardSnapLines?.y} x2={100000} y2={snapLines.y !== null ? snapLines.y : keyboardSnapLines?.y} 
                    stroke="var(--accent-primary)" 
                    strokeWidth={1 / viewTransform.scale} 
                    strokeDasharray={`${5 / viewTransform.scale},${5 / viewTransform.scale}`} 
                    pointerEvents="none"
                />
            )}
            </g>
        </svg>
    </div>
  );
};
export default Canvas;
