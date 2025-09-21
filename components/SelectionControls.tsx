import React, { useMemo } from 'react';
import { Shape, TransformHandle, CanvasAction, RotatableShape, Tool, BezierCurveShape, ViewTransform, RectangleShape, PolylineShape, ArcShape, TrapezoidShape, ParallelogramShape, IsoscelesTriangleShape, PathShape, EllipseShape, TextShape, PolygonShape } from '../types';
import { getBoundingBox, getShapeCenter, rotatePoint, getEditablePoints, getIsoscelesTrianglePoints, findClosestPointOnSegment, getFinalPoints, getVisualBoundingBox, getTrapezoidPoints, getParallelogramPoints, getPolygonPointsAsArray } from '../lib/geometry';
import { getDefaultNameForShape, ROTATE_CURSOR_STYLE, ADJUST_CURSOR_STYLE, isDefaultName } from '../lib/constants';

interface SelectionControlsProps {
    shape: Shape;
    setAction: React.Dispatch<React.SetStateAction<CanvasAction>>;
    svgRef: React.RefObject<SVGSVGElement>;
    activeTool: Tool;
    getSnappedMousePosition: (pos: {x:number, y:number}) => { x: number; y: number };
    viewTransform: ViewTransform;
    getPointerPosition: (event: MouseEvent | React.MouseEvent | React.Touch | Touch) => { x: number; y: number };
    activePointIndex: number | null;
    setActivePointIndex: (index: number | null) => void;
    updateShape: (shape: Shape) => void;
    action: CanvasAction;
}

const HANDLE_SIZE = 8;
const TOUCH_HANDLE_SIZE = 24; // Larger touch area for handles
const ROTATE_HANDLE_OFFSET = 20;

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
        default:
            return 'default';
    }
};

export const SelectionControls: React.FC<SelectionControlsProps> = ({ shape, setAction, svgRef, activeTool, getSnappedMousePosition, viewTransform, getPointerPosition, activePointIndex, setActivePointIndex, updateShape, action }) => {
    if (!shape) return null;

    const scaledHandleSize = HANDLE_SIZE / viewTransform.scale;
    const scaledTouchHandleSize = TOUCH_HANDLE_SIZE / viewTransform.scale;
    const scaledStrokeWidth = 1 / viewTransform.scale;
    const scaledRotateOffset = ROTATE_HANDLE_OFFSET / viewTransform.scale;

    const center = shape.type === 'text' ? { x: shape.x, y: shape.y } : getShapeCenter(shape);
    if (!center) return null;

    const rotation = 'rotation' in shape ? shape.rotation ?? 0 : 0;
    
    // Calculate visual bounds early to use in both modes
    const visualBounds = useMemo(() => {
        if (!shape) return null;
        // If we are point-editing a rotated shape, use the stable center from the action
        // to prevent the bounding box from jumping around.
        if (action?.type === 'point-editing' && 'rotation' in action.initialShape && action.initialShape.rotation !== 0) {
            return getVisualBoundingBox(shape, action.center);
        }
        return getVisualBoundingBox(shape);
    }, [shape, action]);
    
    const VisualBoundsRect = visualBounds && (
        <g style={{ pointerEvents: 'none' }}>
            <rect
                x={visualBounds.x}
                y={visualBounds.y}
                width={visualBounds.width}
                height={visualBounds.height}
                fill="none"
                stroke="var(--text-tertiary)"
                strokeWidth={scaledStrokeWidth}
                strokeDasharray={`${3 / viewTransform.scale} ${3 / viewTransform.scale}`}
            />
            {/* Top-left dot */}
            <circle cx={visualBounds.x} cy={visualBounds.y} r={scaledHandleSize / 2.5} fill="var(--text-tertiary)" />
            {/* Bottom-right dot */}
            <circle cx={visualBounds.x + visualBounds.width} cy={visualBounds.y + visualBounds.height} r={scaledHandleSize / 2.5} fill="var(--text-tertiary)" />
        </g>
    );

    const AnchorMarker = useMemo(() => {
        if (shape.type !== 'text') {
            return null;
        }
        const textShape = shape as TextShape;
        const markerRadius = scaledHandleSize / 1.5;
        const crossOffset = markerRadius * 0.6;

        return (
            <g 
                style={{ pointerEvents: 'none' }}
                aria-label="Точка прив'язки тексту"
            >
                <circle
                    cx={textShape.x}
                    cy={textShape.y}
                    r={markerRadius}
                    fill="var(--special-handle-fill)"
                    stroke="var(--special-handle-stroke)"
                    strokeWidth={scaledStrokeWidth}
                />
                <line 
                    x1={textShape.x - crossOffset} y1={textShape.y} 
                    x2={textShape.x + crossOffset} y2={textShape.y} 
                    stroke="var(--special-handle-stroke)"
                    strokeWidth={scaledStrokeWidth}
                />
                 <line 
                    x1={textShape.x} y1={textShape.y - crossOffset}
                    x2={textShape.x} y2={textShape.y + crossOffset}
                    stroke="var(--special-handle-stroke)"
                    strokeWidth={scaledStrokeWidth}
                />
            </g>
        );
    }, [shape, scaledHandleSize, scaledStrokeWidth]);

    if (activeTool === 'edit-points') {
        // getEditablePoints returns LOCAL, UN-ROTATED points.
        const localPoints = getEditablePoints(shape);
        if (!localPoints) return null;

        // For display, we rotate these local points around the shape's center.
        let displayPoints: { x: number, y: number }[];
        if (action?.type === 'point-editing' && rotation !== 0) {
            // During a point-edit drag of a rotated shape, use the stable center.
            displayPoints = localPoints.map(p => rotatePoint(p, action.center, rotation));
        } else {
            // Otherwise, use the shape's current center.
            displayPoints = localPoints.map(p => rotatePoint(p, center, rotation));
        }
         
        const handleNodeDown = (e: React.MouseEvent | React.TouchEvent, pointIndex: number) => {
            e.stopPropagation();
            setActivePointIndex(pointIndex);
            const stableCenter = getShapeCenter(shape);
            if (!stableCenter) return;

            let shapeForAction = shape;
            // If it's a primitive shape, we need to convert it to a polyline before editing,
            // but we must preserve its rotation to avoid visual jumps.
            if (shape.type !== 'polyline' && shape.type !== 'line' && shape.type !== 'pencil' && shape.type !== 'bezier') {
                 const isClosed = shape.type !== 'arc' || shape.style !== 'arc';
                 const localPointsForPoly = getFinalPoints({ ...shape, rotation: 0 });
                 if (!localPointsForPoly) return;

                 const newPolyline: PolylineShape = {
                    id: shape.id,
                    name: undefined, // Will be set below
                    type: 'polyline',
                    points: localPointsForPoly,
                    isClosed,
                    rotation: 'rotation' in shape ? shape.rotation : 0,
                    state: shape.state,
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    fill: 'fill' in shape && typeof shape.fill === 'string' && isClosed ? shape.fill : 'none',
                    joinstyle: 'joinstyle' in shape && shape.joinstyle ? shape.joinstyle : undefined,
                    stipple: 'stipple' in shape ? shape.stipple : undefined,
                    dash: 'dash' in shape ? shape.dash : undefined,
                 };
                 
                 const oldName = shape.name;
                 const isOldNameDefault = !oldName || isDefaultName(oldName);
                 newPolyline.name = isOldNameDefault ? getDefaultNameForShape(newPolyline) : oldName;

                 updateShape(newPolyline);
                 shapeForAction = newPolyline;
            }
            // Create the action with the (potentially new) shape, but the original stable center.
            setAction({ type: 'point-editing', initialShape: shapeForAction, pointIndex, center: stableCenter });
        };

        const handleSegmentMouseDown = (e: React.MouseEvent, index1: number, index2: number) => {
            e.preventDefault();
            e.stopPropagation();
    
            const mousePos = getSnappedMousePosition(getPointerPosition(e));
        
            // We need to un-rotate the mouse position to find the closest point on the un-rotated segment
            const unrotatedMousePos = rotatePoint(mousePos, center, -rotation);
            const p1 = localPoints[index1];
            const p2 = localPoints[index2];
        
            const { point: newPointLocal } = findClosestPointOnSegment(unrotatedMousePos, p1, p2);
            
            const newPointsLocal = [...localPoints];
            newPointsLocal.splice(index2, 0, newPointLocal);

            let newShape: Shape;
            
            if (shape.type === 'bezier') {
                 newShape = { ...shape, points: newPointsLocal };
            } else if (shape.type === 'polyline' || shape.type === 'line' || shape.type === 'pencil') {
                 newShape = { ...shape, points: newPointsLocal as any };
            } else { // It's a primitive, must convert
                 const isClosed = shape.type !== 'arc' || shape.style !== 'arc';
                 const newPolyline: PolylineShape = {
                    id: shape.id,
                    name: undefined, // Will be set below
                    type: 'polyline',
                    points: newPointsLocal,
                    isClosed,
                    rotation: 'rotation' in shape ? shape.rotation : 0,
                    state: shape.state,
                    stroke: shape.stroke,
                    strokeWidth: shape.strokeWidth,
                    fill: 'fill' in shape && typeof shape.fill === 'string' && isClosed ? shape.fill : 'none',
                    joinstyle: 'joinstyle' in shape && shape.joinstyle ? shape.joinstyle : undefined,
                 };
                 const oldName = shape.name;
                 const isOldNameDefault = !oldName || isDefaultName(oldName);
                 newPolyline.name = isOldNameDefault ? getDefaultNameForShape(newPolyline) : oldName;
                 newShape = newPolyline;
            }
            
            updateShape(newShape);
            
            setActivePointIndex(index2);
            // The action needs the updated shape and its new center to work with
            const newCenter = getShapeCenter(newShape);
            if (!newCenter) return;
            setAction({ type: 'point-editing', initialShape: newShape, pointIndex: index2, center: newCenter });
        };

        const isShapeClosed = (
            (shape.type === 'polyline' && shape.isClosed) ||
            (shape.type === 'bezier' && shape.isClosed) ||
            ['rectangle', 'ellipse', 'polygon', 'star', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'arc', 'pieslice', 'chord'].includes(shape.type)
        );

        return (
            <g>
                {VisualBoundsRect}
                {displayPoints.map((p, index) => {
                    if (!isShapeClosed && index === displayPoints.length - 1) return null;
                    const nextIndex = (index + 1) % displayPoints.length;
                    const nextPoint = displayPoints[nextIndex];

                    return (
                        <line
                            key={`segment-${index}`}
                            x1={p.x} y1={p.y}
                            x2={nextPoint.x} y2={nextPoint.y}
                            stroke="transparent"
                            strokeWidth={scaledTouchHandleSize}
                            style={{ cursor: action ? 'inherit' : 'copy' }}
                            onMouseDown={(e) => handleSegmentMouseDown(e, index, nextIndex)}
                        />
                    );
                })}

                {displayPoints.map((p, index) => {
                    const isActive = index === activePointIndex;
                    return (
                        <g key={`point-${index}`} onMouseDown={(e) => handleNodeDown(e, index)} onTouchStart={(e) => handleNodeDown(e as any, index)} data-handle="true" style={{ cursor: action ? 'inherit' : 'grab' }} >
                            <circle 
                                cx={p.x} 
                                cy={p.y}
                                r={isActive ? scaledHandleSize * 0.75 : scaledHandleSize / 2}
                                fill={isActive ? 'var(--selection-stroke)' : 'var(--bg-primary)'}
                                stroke="var(--selection-stroke)" 
                                strokeWidth={scaledStrokeWidth}
                                style={{ pointerEvents: 'none' }} 
                            />
                             <circle
                                cx={p.x}
                                cy={p.y}
                                r={scaledTouchHandleSize / 2}
                                fill="transparent"
                            />
                        </g>
                    )
                })}
            </g>
        );
    }
    
    const bbox = getBoundingBox(shape);
    if (!bbox || (bbox.width <= 0 && bbox.height <= 0)) return null;


    if (shape.type === 'line') {
        const [start, end] = shape.points;
        const rotatedStart = rotatePoint(start, center, rotation);
        const rotatedEnd = rotatePoint(end, center, rotation);

        const lineBbox = getBoundingBox(shape)!;
    
        const handlePosition = (shape as RotatableShape).rotationHandlePosition;
        const unrotatedRotationHandlePos = {
            x: center.x,
            y: handlePosition === 'bottom'
                ? lineBbox.y + lineBbox.height + scaledRotateOffset
                : lineBbox.y - scaledRotateOffset
        };

        const rotationHandlePos = rotatePoint(unrotatedRotationHandlePos, center, rotation);

        const handleLineResizeDown = (e: React.MouseEvent | React.TouchEvent, handle: 'line-start' | 'line-end') => {
            e.stopPropagation();
            const geometricCenter = getShapeCenter(shape)!;
            setAction({
                type: 'resizing',
                handle,
                initialShape: shape,
                anchorPointGlobal: handle === 'line-start' ? rotatedEnd : rotatedStart,
                initialShapeProps: { rotationCenter: center, geometricCenter, bbox },
            });
        };
        
        const handleRotateDown = (e: React.MouseEvent | React.TouchEvent) => {
            e.stopPropagation();
            if (!svgRef.current) return;
            const handleCenter = getShapeCenter(shape);
            if (!handleCenter) return;
            const eventForPosition = 'touches' in e ? e.touches[0] : e;
            if (!eventForPosition) return;

            const initialMousePos = getSnappedMousePosition(getPointerPosition(eventForPosition));
            
            const mouseAngleRad = Math.atan2(
                initialMousePos.y - handleCenter.y,
                initialMousePos.x - handleCenter.x
            );
            const shapeAngleRad = shape.rotation * Math.PI / 180;
            const startAngleOffset = shapeAngleRad - mouseAngleRad;
            
            setAction({
                type: 'rotating',
                initialShape: shape,
                center: handleCenter,
                startAngle: startAngleOffset
            });
        }

        return (
            <React.Fragment>
                {VisualBoundsRect}
                <g>
                    <line x1={rotatedStart.x} y1={rotatedStart.y} x2={rotatedEnd.x} y2={rotatedEnd.y} stroke="var(--selection-stroke)" strokeWidth={6 / viewTransform.scale} strokeOpacity="0.3" strokeLinecap="round" style={{ pointerEvents: 'none' }} />
                    
                    <g onMouseDown={(e) => handleLineResizeDown(e, 'line-start')} onTouchStart={(e) => handleLineResizeDown(e as any, 'line-start')} data-handle="true" style={{ cursor: action ? 'inherit' : 'grab' }}>
                        <circle cx={rotatedStart.x} cy={rotatedStart.y} r={scaledHandleSize / 1.5} fill="var(--bg-primary)" stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{pointerEvents: 'none'}} />
                        <circle cx={rotatedStart.x} cy={rotatedStart.y} r={scaledTouchHandleSize / 2} fill="transparent" />
                    </g>

                    <g onMouseDown={(e) => handleLineResizeDown(e, 'line-end')} onTouchStart={(e) => handleLineResizeDown(e as any, 'line-end')} data-handle="true" style={{ cursor: action ? 'inherit' : 'grab' }}>
                        <circle cx={rotatedEnd.x} cy={rotatedEnd.y} r={scaledHandleSize / 1.5} fill="var(--bg-primary)" stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{pointerEvents: 'none'}} />
                        <circle cx={rotatedEnd.x} cy={rotatedEnd.y} r={scaledTouchHandleSize / 2} fill="transparent" />
                    </g>

                    <g onMouseDown={handleRotateDown} onTouchStart={handleRotateDown} data-handle="true" style={{ cursor: action ? 'inherit' : ROTATE_CURSOR_STYLE }}>
                        <line x1={center.x} y1={center.y} x2={rotationHandlePos.x} y2={rotationHandlePos.y} stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{ pointerEvents: 'none' }} />
                        <circle cx={rotationHandlePos.x} cy={rotationHandlePos.y} r={scaledHandleSize / 2} fill="var(--bg-primary)" stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{pointerEvents: 'none'}} transform={`rotate(${-rotation} ${rotationHandlePos.x} ${rotationHandlePos.y})`} />
                        <circle cx={rotationHandlePos.x} cy={rotationHandlePos.y} r={scaledTouchHandleSize / 2} fill="transparent" />
                    </g>
                </g>
            </React.Fragment>
        );
    }
    
    const handles: { name: TransformHandle, x: number, y: number }[] = [
        { name: 'top-left', x: bbox.x, y: bbox.y },
        { name: 'top-center', x: bbox.x + bbox.width / 2, y: bbox.y },
        { name: 'top-right', x: bbox.x + bbox.width, y: bbox.y },
        { name: 'middle-left', x: bbox.x, y: bbox.y + bbox.height / 2 },
        { name: 'middle-right', x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 },
        { name: 'bottom-left', x: bbox.x, y: bbox.y + bbox.height },
        { name: 'bottom-center', x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height },
        { name: 'bottom-right', x: bbox.x + bbox.width, y: bbox.y + bbox.height },
    ];

    const handleResizeDown = (e: React.MouseEvent | React.TouchEvent, handle: TransformHandle) => {
        e.stopPropagation();
        const geometricCenter = getShapeCenter(shape)!;
        
        const oppositeHandleMap: { [key in TransformHandle]?: TransformHandle } = {
            'top-left': 'bottom-right', 'top-center': 'bottom-center', 'top-right': 'bottom-left',
            'middle-left': 'middle-right', 'middle-right': 'middle-left',
            'bottom-left': 'top-right', 'bottom-center': 'top-center', 'bottom-right': 'top-left',
        };

        const oppositeHandleName = oppositeHandleMap[handle];
        const oppositeHandle = handles.find(h => h.name === oppositeHandleName);

        if (!oppositeHandle) return; // Should not happen for resize handles

        const anchorPointGlobal = rotatePoint({ x: oppositeHandle.x, y: oppositeHandle.y }, center, rotation);

        setAction({
            type: 'resizing',
            handle,
            initialShape: shape,
            anchorPointGlobal,
            initialShapeProps: { rotationCenter: center, geometricCenter, bbox },
        });
    };

    const rotationHandleX = shape.type === 'text' ? (bbox.x + bbox.width / 2) : center.x;
    
    const handlePosition = (shape as RotatableShape).rotationHandlePosition;
    const unrotatedRotationHandlePos = {
        x: rotationHandleX,
        y: handlePosition === 'bottom'
            ? bbox.y + bbox.height + scaledRotateOffset
            : bbox.y - scaledRotateOffset
    };
    const rotationHandlePos = rotatePoint(unrotatedRotationHandlePos, center, rotation);

    const handleRotateDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (!svgRef.current) return;
        const handleCenter = getShapeCenter(shape);
        if (!handleCenter) return;
        
        const eventForPosition = 'touches' in e ? e.touches[0] : e;
        if (!eventForPosition) return;

        const initialMousePos = getSnappedMousePosition(getPointerPosition(eventForPosition));
        
        const mouseAngleRad = Math.atan2(
            initialMousePos.y - handleCenter.y,
            initialMousePos.x - handleCenter.x
        );
        const shapeAngleRad = ('rotation' in shape ? shape.rotation : 0) * Math.PI / 180;
        const startAngleOffset = shapeAngleRad - mouseAngleRad;
        
        setAction({
            type: 'rotating',
            initialShape: shape as Shape & RotatableShape,
            center: handleCenter,
            startAngle: startAngleOffset
        });
    };

    const handleSpecialControlMouseDown = (e: React.MouseEvent | React.TouchEvent, type: 'arc-angle' | 'trapezoid-offset' | 'parallelogram-angle' | 'triangle-vertex' | 'star-inner-radius', handle: string) => {
        e.stopPropagation();
        
        const eventForPosition = 'touches' in e ? e.touches[0] : e;
        if (!eventForPosition) return;
        const initialMousePos = getSnappedMousePosition(getPointerPosition(eventForPosition));
        
        switch (type) {
            case 'arc-angle':
                if (shape.type !== 'arc') return;
                const arcCenter = getShapeCenter(shape)!;
                const initialMouseAngle = Math.atan2(-(initialMousePos.y - arcCenter.y), initialMousePos.x - arcCenter.x) * 180 / Math.PI;
                setAction({
                    type: 'arc-angle-editing',
                    handle: handle as 'start' | 'end' | 'move',
                    initialShape: shape,
                    center: arcCenter,
                    initialMouseAngle,
                });
                break;
            case 'trapezoid-offset':
                if (shape.type !== 'trapezoid') return;
                setAction({
                    type: 'trapezoid-offset-editing',
                    handle: handle as 'left' | 'right',
                    initialShape: shape,
                });
                break;
            case 'parallelogram-angle':
                if (shape.type !== 'parallelogram') return;
                setAction({
                    type: 'parallelogram-angle-editing',
                    initialShape: shape,
                });
                break;
            case 'triangle-vertex':
                if (shape.type !== 'triangle') return;
                setAction({
                    type: 'triangle-vertex-editing',
                    initialShape: shape,
                });
                break;
            case 'star-inner-radius':
                if (shape.type !== 'star') return;
                setAction({
                    type: 'star-inner-radius-editing',
                    initialShape: shape,
                    center: getShapeCenter(shape)!,
                });
                break;
        }
    }
    
    const renderSpecialHandle = (pos: { x: number, y: number }, onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void) => {
        return (
            <g onMouseDown={onMouseDown} onTouchStart={onMouseDown} data-handle="true" style={{ cursor: action ? 'inherit' : ADJUST_CURSOR_STYLE }}>
                <circle
                    cx={pos.x} cy={pos.y}
                    r={scaledHandleSize / 1.5}
                    fill="var(--special-handle-fill)"
                    stroke="var(--special-handle-stroke)"
                    strokeWidth={scaledStrokeWidth}
                    style={{ pointerEvents: 'none' }}
                />
                <circle
                    cx={pos.x} cy={pos.y}
                    r={scaledTouchHandleSize / 2}
                    fill="transparent"
                />
            </g>
        );
    };
    
    const renderArcHandles = (shape: ArcShape) => {
        const { x, y, width, height, start, extent } = shape;
        const rx = width / 2;
        const ry = height / 2;
        const cx = x + rx;
        const cy = y + ry;

        const startRad = (start * Math.PI) / 180;
        const endRad = ((start + extent) * Math.PI) / 180;
        const midRad = ((start + extent / 2) * Math.PI) / 180;

        const startHandlePos = { x: cx + rx * Math.cos(startRad), y: cy - ry * Math.sin(startRad) };
        const endHandlePos = { x: cx + rx * Math.cos(endRad), y: cy - ry * Math.sin(endRad) };
        const moveHandlePos = { x: cx + rx * Math.cos(midRad), y: cy - ry * Math.sin(midRad) };

        const rotatedStart = rotatePoint(startHandlePos, center, rotation);
        const rotatedEnd = rotatePoint(endHandlePos, center, rotation);
        const rotatedMove = rotatePoint(moveHandlePos, center, rotation);

        return (
            <>
                {renderSpecialHandle(rotatedStart, (e) => handleSpecialControlMouseDown(e, 'arc-angle', 'start'))}
                {renderSpecialHandle(rotatedEnd, (e) => handleSpecialControlMouseDown(e, 'arc-angle', 'end'))}
                {renderSpecialHandle(rotatedMove, (e) => handleSpecialControlMouseDown(e, 'arc-angle', 'move'))}
            </>
        );
    };

    const renderTrapezoidOffsetHandles = (shape: TrapezoidShape) => {
        const unrotatedPoints = getTrapezoidPoints(shape);
        // Points are [top-left, top-right, bottom-right, bottom-left] for non-flipped
        const topLeft = unrotatedPoints[shape.isFlippedVertically ? 3 : 0];
        const topRight = unrotatedPoints[shape.isFlippedVertically ? 2 : 1];
        
        const rotatedTopLeft = rotatePoint(topLeft, center, rotation);
        const rotatedTopRight = rotatePoint(topRight, center, rotation);

        return (
            <>
                {renderSpecialHandle(rotatedTopLeft, (e) => handleSpecialControlMouseDown(e, 'trapezoid-offset', 'left'))}
                {renderSpecialHandle(rotatedTopRight, (e) => handleSpecialControlMouseDown(e, 'trapezoid-offset', 'right'))}
            </>
        );
    };
    
    const renderParallelogramAngleHandle = (shape: ParallelogramShape) => {
        const unrotatedPoints = getParallelogramPoints(shape);
        // Use the top-left vertex as the handle for consistency with mouse logic
        const p1 = unrotatedPoints[shape.isFlippedVertically ? 3 : 0];
        
        const rotatedHandlePos = rotatePoint(p1, center, rotation);

        return renderSpecialHandle(
            rotatedHandlePos,
            (e) => handleSpecialControlMouseDown(e, 'parallelogram-angle', 'angle')
        );
    };

    const renderTriangleVertexHandle = (shape: IsoscelesTriangleShape) => {
        const unrotatedPoints = getIsoscelesTrianglePoints(shape);
        const topVertex = unrotatedPoints[0];
        const rotatedTopVertex = rotatePoint(topVertex, center, rotation);
        return renderSpecialHandle(
            rotatedTopVertex,
            (e) => handleSpecialControlMouseDown(e, 'triangle-vertex', 'top')
        );
    };

    const renderStarInnerRadiusHandle = (shape: PolygonShape) => {
        // getPolygonPointsAsArray returns unrotated points
        const unrotatedPoints = getPolygonPointsAsArray(shape);
        if (unrotatedPoints.length < 2 || shape.innerRadius === undefined) return null;
        
        // The first inner vertex is at index 1
        let innerVertex = unrotatedPoints[1];
        
        if (shape.innerRadius === 0) {
            const angleStep = (Math.PI * 2) / shape.sides;
            const rotationRad = -Math.PI / 2;
            const handleAngle = (angleStep / 2) + rotationRad;
            const smallOffset = 10 / viewTransform.scale;
            innerVertex = {
                x: shape.cx + Math.cos(handleAngle) * smallOffset,
                y: shape.cy + Math.sin(handleAngle) * smallOffset,
            };
        }
        
        const rotatedInnerVertex = rotatePoint(innerVertex, center, rotation);

        return renderSpecialHandle(
            rotatedInnerVertex,
            (e) => handleSpecialControlMouseDown(e, 'star-inner-radius', 'inner-radius')
        );
    };

    return (
        <React.Fragment>
            <g transform={`rotate(${rotation} ${center.x} ${center.y})`}>
                <rect 
                    x={bbox.x} y={bbox.y} width={bbox.width} height={bbox.height} 
                    fill="none" stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} 
                    style={{ pointerEvents: 'none' }} 
                />
            </g>
            {VisualBoundsRect}
            <g>
                {handles.map(({ name, x, y }) => {
                    const rotatedPos = rotatePoint({ x, y }, center, rotation);
                    const cursor = getCursorForHandle(name);
                    return (
                        <g 
                            key={name} 
                            onMouseDown={(e) => handleResizeDown(e, name)}
                            onTouchStart={(e) => handleResizeDown(e as any, name)}
                            data-handle="true" 
                            style={{ cursor: action ? 'inherit' : `${cursor}` }}
                        >
                            <rect 
                                x={rotatedPos.x - scaledHandleSize / 2} 
                                y={rotatedPos.y - scaledHandleSize / 2} 
                                width={scaledHandleSize} 
                                height={scaledHandleSize}
                                fill="var(--bg-primary)"
                                stroke="var(--selection-stroke)"
                                strokeWidth={scaledStrokeWidth}
                                style={{ pointerEvents: 'none' }} 
                                transform={`rotate(${-rotation} ${rotatedPos.x} ${rotatedPos.y})`}
                            />
                            <rect 
                                x={rotatedPos.x - scaledTouchHandleSize / 2} 
                                y={rotatedPos.y - scaledTouchHandleSize / 2} 
                                width={scaledTouchHandleSize} 
                                height={scaledTouchHandleSize}
                                fill="transparent"
                            />
                        </g>
                    )
                })}
            
                {('rotation' in shape) && shape.rotation !== undefined && (
                    <g onMouseDown={handleRotateDown} onTouchStart={handleRotateDown} data-handle="true" style={{ cursor: action ? 'inherit' : ROTATE_CURSOR_STYLE }}>
                        <line x1={center.x} y1={center.y} x2={rotationHandlePos.x} y2={rotationHandlePos.y} stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{ pointerEvents: 'none' }} />
                        <circle cx={rotationHandlePos.x} cy={rotationHandlePos.y} r={scaledHandleSize / 2} fill="var(--bg-primary)" stroke="var(--selection-stroke)" strokeWidth={scaledStrokeWidth} style={{pointerEvents: 'none'}} transform={`rotate(${-rotation} ${rotationHandlePos.x} ${rotationHandlePos.y})`} />
                        <circle cx={rotationHandlePos.x} cy={rotationHandlePos.y} r={scaledTouchHandleSize / 2} fill="transparent" />
                    </g>
                )}
                 
                {AnchorMarker}
                
                {shape.type === 'arc' && renderArcHandles(shape)}

                {shape.type === 'trapezoid' && renderTrapezoidOffsetHandles(shape)}

                {shape.type === 'parallelogram' && renderParallelogramAngleHandle(shape)}

                {shape.type === 'triangle' && renderTriangleVertexHandle(shape)}

                {shape.type === 'star' && renderStarInnerRadiusHandle(shape)}
            </g>
        </React.Fragment>
    );
};