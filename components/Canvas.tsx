import React, { useState, useRef, useMemo, useCallback } from 'react';
import { type Shape, type Tool, type CanvasAction, type RotatableShape, type RectangleShape, type EllipseShape, type PathShape, type LineShape, PolylineShape, PolygonShape, DrawMode, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, BezierCurveShape, ViewTransform, JoinStyle, ArcShape, RightTriangleShape, TransformHandle, TextShape, ImageShape, BitmapShape } from '../types';
import { SelectionControls } from './SelectionControls';
import { getShapeCenter, rotatePoint, getBoundingBox, getIsoscelesTrianglePoints, getPolylinePointsAsPath, getPolygonPointsAsArray, getRhombusPoints, getTrapezoidPoints, getParallelogramPoints, getSmoothedPathData, getFinalPoints, getArcPathData, getRightTrianglePoints, getTextBoundingBox, processTextLines } from '../lib/geometry';
import { CheckSquareIcon, ClosePathIcon, XSquareIcon } from './icons';
import { TOOL_TYPE_TO_NAME, ROTATE_CURSOR_STYLE, ADJUST_CURSOR_STYLE, getDefaultNameForShape, getVisualFontFamily, isDefaultName, DUPLICATE_CURSOR_STYLE } from '../lib/constants';

interface CanvasProps {
  width: number;
  height: number;
  backgroundColor: string;
  shapes: Shape[];
  addShape: (shape: Shape) => void;
  updateShape: (shape: Shape) => void;
  activeTool: Tool;
  drawMode: DrawMode;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  textColor: string;
  textFont: string;
  textFontSize: number;
  numberOfSides: number;
  selectedShapeId: string | null;
  onSelectShape: (id: string | null) => void;
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
  setCursorPos: (pos: {x:number, y:number} | null) => void;
  showNotification: (message: string, type?: 'info' | 'error') => void;
  onStartInlineEdit: (shapeId: string) => void;
  inlineEditingShapeId: string | null;
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
    const { 
        width, height, backgroundColor, shapes, addShape, updateShape, 
        activeTool, drawMode, fillColor, strokeColor, strokeWidth, 
        textColor, textFont, textFontSize,
        numberOfSides, selectedShapeId, onSelectShape,
        isDrawingPolyline, polylinePoints, setPolylinePoints, onCompletePolyline, onCancelPolyline,
        isDrawingBezier, bezierPoints, setBezierPoints, onCompleteBezier, onCancelBezier,
        showGrid, gridSize, snapStep,
        viewTransform, setViewTransform,
        activePointIndex, setActivePointIndex,
        showCursorCoords, showRotationAngle,
        pendingImage, setPendingImage,
        setCursorPos,
        showNotification,
        onStartInlineEdit,
        inlineEditingShapeId,
    } = props;
    
  const [action, setAction] = useState<CanvasAction>(null);
  const [activeTransformShape, setActiveTransformShape] = useState<Shape | null>(null);
  const [previewMousePos, setPreviewMousePos] = useState<{x: number, y: number} | null>(null);
  const [rawMousePos, setRawMousePos] = useState<{x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasDraggedRef = useRef(false);
  const mouseDownPosRef = useRef<{x: number, y: number} | null>(null);
  const touchStateRef = useRef<{ initialDist: number, initialMidpoint: {x:number, y:number}, initialTransform: ViewTransform } | null>(null);

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
            if (selectedShapeId !== clickedShapeId) {
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
          if (selectedShapeId !== clickedShape.id) onSelectShape(clickedShape.id);
        }
      return;
    }

    if (activeTool === 'select') {
        if (clickedShape && clickedShape.state !== 'disabled') {
            setAction({ type: 'dragging', initialShape: clickedShape, startPos: pos });
            if (selectedShapeId !== clickedShape.id) onSelectShape(clickedShape.id);
        } else {
            // Clicked on empty space, initiate pan. Deselection happens on mouseUp if it was just a click.
            setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        }
        return;
    }
    
    onSelectShape(null);
    const id = new Date().toISOString();
    let newShape: Shape | null = null;
    switch (activeTool) {
        case 'rectangle': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: false }; break;
        case 'square': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'rectangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: true }; break;
        case 'circle': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: true }; break;
        case 'ellipse': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'ellipse', cx: pos.x, cy: pos.y, rx: 0, ry: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', isAspectRatioLocked: false }; break;
        case 'line': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'line', points: [{...pos}, {...pos}], stroke: strokeColor, strokeWidth, rotation: 0, capstyle: 'round', state: 'normal' }; break;
        case 'pencil': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'pencil', points: [pos], stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'round', capstyle: 'round', isAspectRatioLocked: false }; break;
        case 'triangle': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'triangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', topVertexOffset: 0, isAspectRatioLocked: false }; break;
        case 'right-triangle': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'right-triangle', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'rhombus': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'rhombus', x: pos.x, y: pos.y, width: 0, height: 0, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'trapezoid': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'trapezoid', x: pos.x, y: pos.y, width: 0, height: 0, topLeftOffsetRatio: 0.25, topRightOffsetRatio: 0.25, isSymmetrical: true, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'parallelogram': newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'parallelogram', x: pos.x, y: pos.y, width: 0, height: 0, angle: 75, fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter', isAspectRatioLocked: false }; break;
        case 'pieslice':
        case 'chord':
        case 'arc': {
            let style: 'pieslice' | 'chord' | 'arc';
            if (activeTool === 'pieslice') style = 'pieslice';
            else if (activeTool === 'chord') style = 'chord';
            else style = 'arc';
            
            const finalFillColor = style === 'arc' ? 'none' : fillColor;
            const extent = (style === 'pieslice' || style === 'chord') ? 270 : 90;
            
            newShape = { id, name: TOOL_TYPE_TO_NAME[activeTool], type: 'arc', x: pos.x, y: pos.y, width: 0, height: 0, fill: finalFillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', start: 0, extent, style, capstyle: 'round', isAspectRatioLocked: false };
            break;
        }
        case 'polygon':
        case 'star':
            newShape = {
                id, name: TOOL_TYPE_TO_NAME[activeTool], type: activeTool, cx: pos.x, cy: pos.y, radius: 0, sides: numberOfSides,
                fill: fillColor, stroke: strokeColor, strokeWidth, rotation: 0, state: 'normal', joinstyle: 'miter',
                innerRadius: activeTool === 'star' ? 0 : undefined, isAspectRatioLocked: true,
            };
            break;
        case 'text': {
            newShape = {
                id,
                name: TOOL_TYPE_TO_NAME[activeTool],
                type: 'text',
                x: pos.x,
                y: pos.y,
                text: 'Текст',
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
                        name: TOOL_TYPE_TO_NAME[activeTool],
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
                name: TOOL_TYPE_TO_NAME[activeTool],
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
  }, [activeTool, shapes, onSelectShape, fillColor, strokeColor, strokeWidth, textColor, textFont, textFontSize, numberOfSides, isDrawingPolyline, setPolylinePoints, isDrawingBezier, setBezierPoints, getTransformedPointerPosition, getPointerPosition, selectedShapeId, pendingImage, setPendingImage, addShape]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rawPos = getPointerPosition(e);
    setRawMousePos(rawPos);
    const pos = getTransformedPointerPosition(rawPos);
    setPreviewMousePos(pos);
    setCursorPos(pos);
    
    if (!hasDraggedRef.current && mouseDownPosRef.current) {
        const dist = Math.hypot(pos.x - mouseDownPosRef.current.x, pos.y - mouseDownPosRef.current.y);
        if (dist > DRAG_THRESHOLD) {
            hasDraggedRef.current = true;
        }
    }
    
    if (!action) return;

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
            const { initialShape, pointIndex, center } = action;
            const targetShape = initialShape as PolylineShape | PathShape | BezierCurveShape | LineShape;
            
            const rotation = 'rotation' in initialShape ? initialShape.rotation : 0;
            let finalPos = pos;
            if (rotation !== 0) {
                // Use the stable center from the action object
                finalPos = rotatePoint(pos, center, -rotation);
            }

            const newPoints = [...targetShape.points];
            newPoints[pointIndex] = finalPos;
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
            
            newLeftRatio = Math.max(0, newLeftRatio);
            newRightRatio = Math.max(0, newRightRatio);

            if (newLeftRatio + newRightRatio >= 1) {
                break;
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
                case 'rectangle':
                case 'right-triangle':
                case 'rhombus':
                case 'trapezoid':
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

            const currentMouseAngleRad = Math.atan2(pos.y - center.y, pos.x - center.x);
            const newRotationRad = currentMouseAngleRad + startAngleOffset;
            let newRotationDeg = newRotationRad * 180 / Math.PI;

            // Round the rotation to the nearest integer for mouse rotation
            newRotationDeg = Math.round(newRotationDeg);

            updatedShape = { ...initialShape, rotation: newRotationDeg };
            break;
        }
    }
    setActiveTransformShape(updatedShape);
  }, [action, drawMode, activeTransformShape, getTransformedPointerPosition, setViewTransform, getPointerPosition, setCursorPos]);

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
    } else if (action?.type === 'duplicating' && activeTransformShape) {
        if (hasDraggedRef.current) {
            // activeTransformShape contains the final geometry after dragging.
            // It was created from a deep copy of the original shape, so it has all the original properties (name, color, etc.).
            // We just need to assign a new unique ID before adding it to the canvas.
            const newShape = { 
                ...activeTransformShape, 
                id: new Date().toISOString() 
            };
            addShape(newShape);
            showNotification('Фігуру дубльовано.');
        }
    } else if (action?.type === 'point-editing' && activeTransformShape) {
        const { initialShape, center } = action;
        let shapeToUpdate = activeTransformShape;

        const originalName = initialShape.name;
        const isOriginalNameCustom = originalName && !isDefaultName(originalName);

        if ('rotation' in initialShape && initialShape.rotation !== 0) {
            const isSmoothCurve = (initialShape.type === 'bezier' || (initialShape.type === 'polyline' && initialShape.smooth));
            
            if (isSmoothCurve) {
                // For smooth curves, bake rotation into control points without spline approximation.
                const controlPoints = (activeTransformShape as PolylineShape | BezierCurveShape).points;
                const finalPoints = controlPoints.map(p => rotatePoint(p, center, initialShape.rotation));
                
                const bakedShape = {
                    ...activeTransformShape,
                    points: finalPoints,
                    rotation: 0,
                    name: undefined as string | undefined
                };
                bakedShape.name = isOriginalNameCustom ? originalName : getDefaultNameForShape(bakedShape as Shape);
                shapeToUpdate = bakedShape as Shape;
            } else {
                // For primitives converted to polylines, lines, etc., use getFinalPoints.
                // This correctly returns transformed vertices without creating extra points for non-smooth shapes.
                const finalPoints = getFinalPoints(activeTransformShape, center);
                if (finalPoints) {
                    const bakedShape: PolylineShape = {
                        ...(activeTransformShape as PolylineShape),
                        points: finalPoints,
                        rotation: 0,
                        name: undefined
                    };
                    bakedShape.name = isOriginalNameCustom ? originalName : getDefaultNameForShape(bakedShape);
                    shapeToUpdate = bakedShape;
                }
            }
        } else {
             // For unrotated shapes, just update the name if it has changed due to deformation.
            const finalShape = activeTransformShape;
            const newName = isOriginalNameCustom ? originalName : getDefaultNameForShape(finalShape);
            if (finalShape.name !== newName) {
                shapeToUpdate = { ...finalShape, name: newName };
            }
        }
        updateShape(shapeToUpdate);
    } else if (activeTransformShape) { 
        updateShape(activeTransformShape);
    }
    
    setAction(null);
    setActiveTransformShape(null);
    hasDraggedRef.current = false;
    mouseDownPosRef.current = null;
  }, [action, addShape, updateShape, onSelectShape, activeTransformShape, showNotification]);
  
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
  }, [shapes, action, hasDraggedRef, activeTransformShape, isDrawingPolyline, polylinePoints, previewMousePos, strokeColor, strokeWidth, isDrawingBezier, bezierPoints]);
  
  const selectedShape = useMemo(() => {
    const s = shapes.find(s => s?.id === selectedShapeId);
    if (s?.id === activeTransformShape?.id) { return activeTransformShape; }
    return s ?? null;
  }, [shapes, selectedShapeId, activeTransformShape]);

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
        if(center) return `rotate(${shape.rotation} ${center.x} ${center.y})`;
    }
    return undefined;
  };
  
    const arrowMarkers = useMemo(() => {
        const markers = new Map<string, { color: string; shapeParams: [number, number, number] }>();
        itemsToRender.forEach(shape => {
            if ((shape.type === 'line' || shape.type === 'bezier' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed) || (shape.type === 'arc' && shape.style === 'arc')) && shape.arrow && shape.arrow !== 'none' && shape.stroke !== 'none' && shape.strokeWidth > 0 && shape.arrowshape) {
                const [d1m, d2m, d3m] = shape.arrowshape;
                const w = shape.strokeWidth;
                const d1 = d1m * w;
                const d2 = d2m * w;
                const d3 = d3m * w;

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
                title="Завершити"
                disabled={!canComplete}
                className={`${buttonBaseClass} ${canComplete ? enabledBlueClass : disabledClass}`}
              >
                <CheckSquareIcon />
                <span>Завершити</span>
              </button>
              <button
                onClick={() => isDrawingPolyline ? onCompletePolyline(true) : onCompleteBezier(true)}
                title="Замкнути контур"
                disabled={!canClose}
                className={`${buttonBaseClass} ${canClose ? enabledBlueClass : disabledClass}`}
              >
                <ClosePathIcon />
                <span>Замкнути</span>
              </button>
              <button
                onClick={() => isDrawingPolyline ? onCancelPolyline() : onCancelBezier()}
                title="Скасувати"
                className={`${buttonBaseClass} ${enabledRedClass}`}
              >
                <XSquareIcon />
                <span>Скасувати</span>
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
            {isDuplicating && <div className="font-sans font-semibold">Дублювання</div>}
            {showRotationAngle && rotationInfo && (
                <div>{`Кут: ${rotationInfo.absolute.toFixed(0)}° (Δ: ${rotationInfo.delta.toFixed(0)}°)`}</div>
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
                    const [d1, d2, d3] = shapeParams;
                    if (d1 <= 0 || d2 <= 0) return null;
                    const key = `${color.replace(/[^a-zA-Z0-9]/g, '')}-${d1}-${d2}-${d3}`;
                    
                    return (
                        <React.Fragment key={key}>
                            <marker
                                id={`arrow-end-${key}`}
                                viewBox={`0 0 ${d1} ${d2}`}
                                refX={d1}
                                refY={d2 / 2}
                                markerUnits="userSpaceOnUse"
                                markerWidth={d1}
                                markerHeight={d2}
                                orient="auto"
                            >
                                <path d={`M 0,0 L ${d1},${d2/2} L 0,${d2} L ${d3},${d2/2} z`} fill={color} />
                            </marker>
                            <marker
                                id={`arrow-start-${key}`}
                                viewBox={`0 0 ${d1} ${d2}`}
                                refX={d1}
                                refY={d2 / 2}
                                markerUnits="userSpaceOnUse"
                                markerWidth={d1}
                                markerHeight={d2}
                                orient="auto-start-reverse"
                            >
                                <path d={`M 0,0 L ${d1},${d2/2} L 0,${d2} L ${d3},${d2/2} z`} fill={color} />
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

            {itemsToRender.filter(Boolean).map(shape => {
                if (shape.state === 'hidden') return null;

                const isDisabled = shape.state === 'disabled';
                const isDrawing = activeTool !== 'select';
                const isDuplicationPreview = action?.type === 'duplicating' && shape === activeTransformShape;
                const shapeCursor = isDisabled ? 'default' : (isDrawing ? 'inherit' : 'move');
                const hitboxStrokeWidth = Math.max(shape.strokeWidth, 20 / viewTransform.scale);
                
                let transform = getTransform(shape);
                const isThisShapeBeingPointEdited = action?.type === 'point-editing' && shape.id === action.initialShape.id;
                if (isThisShapeBeingPointEdited) {
                    const { center } = action;
                    const rotation = 'rotation' in shape && shape.rotation ? shape.rotation : 0;
                    if (rotation !== 0 && center) {
                        transform = `rotate(${rotation} ${center.x} ${center.y})`;
                    }
                }
                
                const commonVisibleProps = {
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    transform: transform,
                    style: {
                        pointerEvents: 'none',
                        opacity: isDisabled ? 0.5 : (isDuplicationPreview ? 0.6 : 1),
                    } as React.CSSProperties,
                };

                const commonHitboxProps = {
                    'data-id': shape.id,
                    key: `${shape.id}-hitbox`,
                    transform: transform,
                    stroke: 'transparent',
                    strokeWidth: hitboxStrokeWidth,
                    style: {
                        cursor: shapeCursor,
                    } as React.CSSProperties,
                };
                
                const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | PathShape | ArcShape) => {
                    const hasVisibleStroke = s.stroke !== 'none' && s.strokeWidth > 0;
                    let dashArray;
                    const hasDash = 'dash' in s && s.dash && s.dash.length > 0 && s.strokeWidth > 0;
                    if (hasDash) {
                        const cap = 'capstyle' in s && s.capstyle ? s.capstyle : 'butt';
                        dashArray = s.dash!.map((value, index) => {
                            const isDashSegment = index % 2 === 0;
                            if (isDashSegment) { // It's a dash
                                if (value <= 2) { // It's a "dot"
                                    if (cap === 'round') return 0.01; // Use cap to make a circle
                                    else return s.strokeWidth; // Use width to make a square
                                }
                            }
                            // It's a long dash or any gap
                            return value * s.strokeWidth;
                        }).join(' ');
                    }

                    const dashOffset = 'dashoffset' in s ? s.dashoffset : undefined;
                    const lineCap: 'butt' | 'round' | 'square' = (s.capstyle === 'projecting' ? 'square' : s.capstyle) ?? 'round';
                    
                    let markerStart, markerEnd;
                    if (hasVisibleStroke && s.arrow && s.arrow !== 'none' && s.arrowshape) {
                        const [d1m, d2m, d3m] = s.arrowshape;
                        const w = s.strokeWidth > 0 ? s.strokeWidth : 1;
                        const d1 = d1m * w;
                        const d2 = d2m * w;
                        const d3 = d3m * w;
                        const key = `${s.stroke.replace(/[^a-zA-Z0-9]/g, '')}-${d1}-${d2}-${d3}`;
                        if (s.arrow === 'first' || s.arrow === 'both') markerStart = `url(#arrow-start-${key})`;
                        if (s.arrow === 'last' || s.arrow === 'both') markerEnd = `url(#arrow-end-${key})`;
                    }
                    return { strokeDasharray: dashArray, strokeDashoffset: dashOffset, markerStart, markerEnd, strokeLinecap: lineCap };
                };

                switch (shape.type) {
                    case 'rectangle': {
                        const rectProps: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.fill !== 'none') rectProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) rectProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) rectProps.strokeDashoffset = shape.dashoffset;
                        return (
                            <g key={shape.id}>
                                <rect {...commonHitboxProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...rectProps} />
                            </g>
                        );
                    }
                    case 'ellipse': {
                        const ellipse = shape as EllipseShape;
                        const ellipseProps: any = { ...commonVisibleProps, fill: ellipse.fill };
                        if (ellipse.stipple && ellipse.fill !== 'none') ellipseProps.mask = `url(#mask-${ellipse.stipple})`;
                        if (ellipse.dash) ellipseProps.strokeDasharray = ellipse.dash.map(v => v * ellipse.strokeWidth).join(' ');
                        if (ellipse.dashoffset) ellipseProps.strokeDashoffset = ellipse.dashoffset;
                        return (
                            <g key={ellipse.id}>
                                <ellipse {...commonHitboxProps} cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (ellipse.fill === 'none' ? 'stroke' : 'all')}} />
                                <ellipse cx={ellipse.cx} cy={ellipse.cy} rx={ellipse.rx} ry={ellipse.ry} {...ellipseProps} />
                            </g>
                        );
                    }
                    case 'arc': {
                         const arcShape = shape as ArcShape;
                        const d = getArcPathData(arcShape);
                        const arcProps: any = { ...commonVisibleProps, fill: arcShape.style === 'arc' ? 'none' : arcShape.fill, ...lineLikeProps(arcShape) };
                        if (arcShape.stipple && arcShape.fill !== 'none' && arcShape.style !== 'arc') arcProps.mask = `url(#mask-${arcShape.stipple})`;
                        return (
                            <g key={shape.id}>
                                <path {...commonHitboxProps} d={d} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (arcShape.fill === 'none' || arcShape.style === 'arc' ? 'stroke' : 'all')}} />
                                <path d={d} {...arcProps} />
                            </g>
                        );
                    }
                    case 'line':
                        return (
                            <g key={shape.id}>
                                <line {...commonHitboxProps} x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'stroke'}} />
                                <line x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} {...commonVisibleProps} {...lineLikeProps(shape)} />
                            </g>
                        );
                     case 'bezier': {
                        const d = getSmoothedPathData(shape.points, shape.smooth, shape.isClosed);
                        const fill = shape.isClosed ? shape.fill : 'none';
                        return (
                            <g key={shape.id}>
                                <path {...commonHitboxProps} d={d} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (fill === 'none' ? 'stroke' : 'all')}} />
                                <path d={d} {...commonVisibleProps} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} />
                            </g>
                        );
                     }
                    case 'pencil': {
                        const d = getPolylinePointsAsPath(shape.points);
                        return (
                             <g key={shape.id}>
                                <path {...commonHitboxProps} d={d} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'stroke'}} />
                                <path d={d} {...commonVisibleProps} fill="none" strokeLinecap="round" {...joinStyleProps(shape)} {...lineLikeProps(shape)} />
                            </g>
                        );
                    }
                    case 'polyline': {
                        const polyProps: React.SVGProps<any> = { ...commonVisibleProps, ...joinStyleProps(shape) };
                        if (shape.stipple && shape.isClosed && shape.fill !== 'none') polyProps.mask = `url(#mask-${shape.stipple})`;
                        if (shape.dash) polyProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        if (shape.dashoffset) polyProps.strokeDashoffset = shape.dashoffset;
                        
                        const fill = shape.isClosed ? shape.fill : 'none';
                        
                        if (!shape.isClosed) {
                            Object.assign(polyProps, lineLikeProps(shape));
                        }

                        if (shape.smooth) {
                            const d = getSmoothedPathData(shape.points, true, shape.isClosed);
                            return (
                                <g key={shape.id}>
                                    <path {...commonHitboxProps} d={d} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (fill === 'none' ? 'stroke' : 'all')}} />
                                    <path {...polyProps} d={d} fill={fill} />
                                </g>
                            );
                        }
                        if (shape.isClosed) {
                            const points = formatPointsForSvg(shape.points);
                            return (
                                <g key={shape.id}>
                                    <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (fill === 'none' ? 'stroke' : 'all')}} />
                                    <polygon {...polyProps} points={points} fill={fill} />
                                </g>
                            );
                        }
                        return (
                            <g key={shape.id}>
                                <polyline {...commonHitboxProps} points={formatPointsForSvg(shape.points)} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'stroke'}} />
                                <polyline {...polyProps} points={formatPointsForSvg(shape.points)} fill="none" />
                            </g>
                        );
                    }
                    case 'triangle': {
                        const points = formatPointsForSvg(getIsoscelesTrianglePoints(shape));
                        const props: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                        return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...props} points={points} />
                            </g>
                        );
                    }
                    case 'right-triangle': {
                        const points = formatPointsForSvg(getRightTrianglePoints(shape));
                        const props: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                         return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...props} points={points} />
                            </g>
                        );
                    }
                    case 'rhombus': {
                        const points = formatPointsForSvg(getRhombusPoints(shape));
                        const props: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                         return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...props} points={points} />
                            </g>
                        );
                    }
                    case 'trapezoid': {
                         const points = formatPointsForSvg(getTrapezoidPoints(shape));
                         const props: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                         if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                         return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...props} points={points} />
                            </g>
                        );
                    }
                    case 'parallelogram': {
                        const points = formatPointsForSvg(getParallelogramPoints(shape));
                        const props: any = { ...commonVisibleProps, fill: shape.fill, ...joinStyleProps(shape) };
                        if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                         return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (shape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...props} points={points} />
                            </g>
                        );
                    }
                    case 'polygon':
                    case 'star': {
                        const polyShape = shape as PolygonShape;
                        const polyProps: any = { ...commonVisibleProps, fill: polyShape.fill, ...joinStyleProps(polyShape) };
                        if (polyShape.stipple && polyShape.fill !== 'none') polyProps.mask = `url(#mask-${polyShape.stipple})`;
                        if (polyShape.dash) polyProps.strokeDasharray = polyShape.dash.map(v => v * polyShape.strokeWidth).join(' ');
                        if (polyShape.dashoffset) polyProps.strokeDashoffset = polyShape.dashoffset;
                        
                        if(polyShape.smooth) {
                             const d = getSmoothedPathData(getPolygonPointsAsArray(shape as PolygonShape), true, true);
                             return (
                                <g key={shape.id}>
                                    <path {...commonHitboxProps} d={d} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (polyShape.fill === 'none' ? 'stroke' : 'all')}} />
                                    <path {...polyProps} d={d} />
                                </g>
                            )
                        }
                        
                        const points = formatPointsForSvg(getPolygonPointsAsArray(shape as PolygonShape));
                         return (
                            <g key={shape.id}>
                                <polygon {...commonHitboxProps} points={points} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : (polyShape.fill === 'none' ? 'stroke' : 'all')}} />
                                <polygon {...polyProps} points={points} />
                            </g>
                        );
                    }
                    case 'text': {
                        const { text, font, fontSize, weight, slant, underline, overstrike, fill, anchor, justify, width: wrapWidth } = shape;
                        const lines = processTextLines(shape);
                        const bbox = getTextBoundingBox(shape);
                        if (!bbox) return null;

                        const textAnchor = justify === 'center' ? 'middle' : justify === 'right' ? 'end' : 'start';

                        let textBlockX;
                        if (textAnchor === 'start') {
                            textBlockX = bbox.x;
                        } else if (textAnchor === 'middle') {
                            textBlockX = bbox.x + bbox.width / 2;
                        } else { // 'end'
                            textBlockX = bbox.x + bbox.width;
                        }

                        if (wrapWidth > 0) {
                            if (textAnchor === 'middle') {
                                textBlockX = bbox.x + wrapWidth / 2;
                            } else if (textAnchor === 'end') {
                                textBlockX = bbox.x + wrapWidth;
                            } else {
                                textBlockX = bbox.x;
                            }
                        }

                        const textStyles: React.CSSProperties = {
                            fontFamily: getVisualFontFamily(font),
                            fontSize: fontSize,
                            fontWeight: weight,
                            fontStyle: slant === 'italic' ? 'italic' : 'normal',
                            textDecoration: `${underline ? 'underline' : ''} ${overstrike ? 'line-through' : ''}`,
                            visibility: shape.id === inlineEditingShapeId ? 'hidden' : 'visible',
                        };

                        return (
                            <g key={shape.id} data-id={shape.id}>
                                {/* Hitbox for text is the bounding box */}
                                <rect 
                                    {...commonHitboxProps}
                                    x={bbox.x} y={bbox.y} width={bbox.width} height={bbox.height} 
                                    fill="transparent"
                                    style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'all'}}
                                />
                                <text
                                    {...commonVisibleProps}
                                    x={textBlockX}
                                    y={bbox.y}
                                    fill={fill}
                                    textAnchor={textAnchor}
                                    dominantBaseline="hanging"
                                    style={{ ...commonVisibleProps.style, ...textStyles, whiteSpace: 'pre' }}
                                >
                                     {lines.map((line, index) => {
                                        return (
                                            <tspan key={index} x={textBlockX} dy={index === 0 ? 0 : `${fontSize * 1.2}px`}>
                                                {line}
                                            </tspan>
                                        );
                                    })}
                                </text>
                            </g>
                        );
                    }
                    case 'image': {
                        return (
                             <g key={shape.id}>
                                <rect {...commonHitboxProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'all'}} />
                                <image href={shape.src} x={shape.x} y={shape.y} width={shape.width} height={shape.height} {...commonVisibleProps} />
                            </g>
                        );
                    }
                    case 'bitmap': {
                        const { x, y, width, height, bitmapType, foreground, background } = shape;
                        let maskId;
                        if (bitmapType.startsWith('gray')) maskId = `url(#mask-${bitmapType})`;
                        else maskId = `url(#mask-bitmap-${bitmapType})`;
                        
                        return (
                            <g key={shape.id}>
                                <rect {...commonHitboxProps} x={x} y={y} width={width} height={height} fill="transparent" style={{...commonHitboxProps.style, pointerEvents: isDisabled ? 'none' : 'all'}}/>
                                <g {...commonVisibleProps}>
                                    <rect x={x} y={y} width={width} height={height} fill={background} />
                                    <rect x={x} y={y} width={width} height={height} fill={foreground} mask={maskId} />
                                </g>
                            </g>
                        );
                    }
                    default:
                        return null;
                }
            })}
            
            {selectedShape && selectedShape.state === 'normal' && (
                <SelectionControls 
                    shape={selectedShape}
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
            )}
            </g>
        </svg>
      </div>
  );
};

export default Canvas;