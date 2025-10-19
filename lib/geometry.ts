import type React from 'react';
import { Shape, RectangleShape, EllipseShape, PathShape, PolygonShape, LineShape, IsoscelesTriangleShape, PolylineShape, RhombusShape, ParallelogramShape, TrapezoidShape, BezierCurveShape, ArcShape, RightTriangleShape, JoinStyle, TextShape, ImageShape, BitmapShape } from '../types';

export const getMousePosition = (svg: SVGSVGElement, event: MouseEvent | React.MouseEvent): { x: number; y: number } => {
  const CTM = svg.getScreenCTM();
  if (CTM) {
    return {
      x: (event.clientX - CTM.e) / CTM.a,
      y: (event.clientY - CTM.f) / CTM.d,
    };
  }
  return { x: 0, y: 0 };
};

// Helper to generate points for a quadratic Bezier curve segment.
// Starts from t=1/segments because the starting point is assumed to be already in the list.
const generateQuadraticBezierPoints = (p0: {x:number, y:number}, p1: {x:number, y:number}, p2: {x:number, y:number}, segments: number): {x:number, y:number}[] => {
    const points: {x:number, y:number}[] = [];
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const mt = 1 - t;
        const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
        const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
        points.push({x, y});
    }
    return points;
}

/**
 * Generates points for a quadratic B-spline that mimics Tkinter's `smooth=True` behavior.
 * @param userPoints The user-defined points that act as control points.
 * @param isClosed Whether the spline should form a closed loop.
 * @returns An array of points representing the smoothed curve.
 */
const getTkinterSplinePoints = (userPoints: { x: number; y: number }[], isClosed: boolean): {x: number, y:number}[] => {
    const n = userPoints.length;
    if (n < 2) return userPoints;
    
    const splinePoints: {x: number, y:number}[] = [];
    const segmentsPerCurve = 8; // How many line segments to use for each Bezier curve approximation

    if (isClosed) {
        if (n < 3) return userPoints; // Not enough points for a closed curve

        // The first start point is the midpoint between the last and first user points.
        const firstStartPoint = { x: (userPoints[n - 1].x + userPoints[0].x) / 2, y: (userPoints[n - 1].y + userPoints[0].y) / 2 };
        splinePoints.push(firstStartPoint);

        for (let i = 0; i < n; i++) {
            const p_curr = userPoints[i];
            const p_next = userPoints[(i + 1) % n];

            const controlPoint = p_curr;
            const endPoint = { x: (p_curr.x + p_next.x) / 2, y: (p_curr.y + p_next.y) / 2 };
            
            // The start point of the current segment is the end point of the previous one.
            const startPoint = splinePoints[splinePoints.length - 1]; 
            
            splinePoints.push(...generateQuadraticBezierPoints(startPoint, controlPoint, endPoint, segmentsPerCurve));
        }

    } else { // Open curve
        if (n < 3) {
            // For 2 points, it's just a straight line.
            return userPoints;
        }

        // The curve starts at the very first user point.
        splinePoints.push(userPoints[0]);
        
        // The first segment is a Bezier from P0 to (P0+P1)/2 with control point P0.
        // This effectively creates a straight line segment from P0 to the first midpoint.
        const firstMidpoint = { x: (userPoints[0].x + userPoints[1].x) / 2, y: (userPoints[0].y + userPoints[1].y) / 2 };
        splinePoints.push(...generateQuadraticBezierPoints(userPoints[0], userPoints[0], firstMidpoint, segmentsPerCurve));
        
        // Intermediate segments are true curves.
        for (let i = 1; i < n - 1; i++) {
            const p_prev = userPoints[i-1];
            const p_curr = userPoints[i];
            const p_next = userPoints[i+1];
            
            const startPoint = { x: (p_prev.x + p_curr.x) / 2, y: (p_prev.y + p_curr.y) / 2 };
            const controlPoint = p_curr;
            const endPoint = { x: (p_curr.x + p_next.x) / 2, y: (p_curr.y + p_next.y) / 2 };
            
            splinePoints.push(...generateQuadraticBezierPoints(startPoint, controlPoint, endPoint, segmentsPerCurve));
        }
        
        // The last segment is a Bezier from the last midpoint to Pn with control point Pn.
        // This creates a straight line segment from the last midpoint to the final user point.
        const lastMidpoint = { x: (userPoints[n-2].x + userPoints[n-1].x) / 2, y: (userPoints[n-2].y + userPoints[n-1].y) / 2 };
        splinePoints.push(...generateQuadraticBezierPoints(lastMidpoint, userPoints[n-1], userPoints[n-1], segmentsPerCurve));
    }

    return splinePoints;
}

export const getSplineApproximation = (shape: BezierCurveShape | PolylineShape): { x: number; y: number }[] => {
    const cleanPoints = shape.points.filter(p => p);
    if (cleanPoints.length < 2) return cleanPoints;
    if (shape.smooth) {
        return getTkinterSplinePoints(cleanPoints, shape.isClosed);
    }
    return cleanPoints;
}

export const getSmoothedPathData = (points: { x: number; y: number }[], smooth: boolean, isClosed: boolean): string => {
    const cleanPoints = points.filter(p => p);
    if (cleanPoints.length === 0) return '';
    if (cleanPoints.length < 2) {
         let path = `M ${cleanPoints[0].x} ${cleanPoints[0].y}`;
         if (isClosed) path += ' Z';
         return path;
    }
    const pointsToDraw = smooth ? getTkinterSplinePoints(cleanPoints, isClosed) : cleanPoints;
    let path = getPolylinePointsAsPath(pointsToDraw);
    if (isClosed) {
        path += ' Z';
    }
    return path;
}

export const getArcPathData = (shape: ArcShape): string => {
    const { x, y, width, height, start, extent, style } = shape;
    if (width <= 0 || height <= 0 || extent === 0) return '';

    const rx = width / 2;
    const ry = height / 2;
    const cx = x + rx;
    const cy = y + ry;

    // Handle extents of 360 degrees or more by drawing a full oval.
    // SVG can't draw a single arc of 360 degrees, as the start and end points are identical.
    if (Math.abs(extent) >= 360) {
        // We construct a full ellipse with two 180-degree arcs.
        const startPointX = cx + rx;
        const startPointY = cy;
        const midPointX = cx - rx;
        const midPointY = cy;

        // Draw one semi-ellipse (e.g., the top half, CCW)
        const path1 = `A ${rx} ${ry} 0 0 0 ${midPointX} ${midPointY}`;
        // Draw the other semi-ellipse to complete the circle
        const path2 = `A ${rx} ${ry} 0 0 0 ${startPointX} ${startPointY}`;

        return `M ${startPointX} ${startPointY} ${path1} ${path2}`;
    }

    // Convert Tkinter CCW angles (degrees) to radians
    const startRadTk = (start * Math.PI) / 180;
    const endRadTk = ((start + extent) * Math.PI) / 180;

    // Calculate SVG coordinates (Y is inverted from standard math coordinate system)
    const x1 = cx + rx * Math.cos(startRadTk);
    const y1 = cy - ry * Math.sin(startRadTk);
    const x2 = cx + rx * Math.cos(endRadTk);
    const y2 = cy - ry * Math.sin(endRadTk);

    const largeArcFlag = Math.abs(extent) > 180 ? 1 : 0;
    // sweepFlag: 0 for CCW (Tkinter's positive extent), 1 for CW (Tkinter's negative extent).
    const sweepFlag = extent > 0 ? 0 : 1;
    
    const arcPath = `A ${rx} ${ry} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;

    if (style === 'arc') {
        return `M ${x1} ${y1} ${arcPath}`;
    }
    if (style === 'chord') {
        return `M ${x1} ${y1} ${arcPath} Z`;
    }
    // style === 'pieslice'
    return `M ${cx} ${cy} L ${x1} ${y1} ${arcPath} Z`;
};


export const getIsoscelesTrianglePoints = (shape: IsoscelesTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height, topVertexOffset = 0, isFlippedVertically } = shape;
    const centerBasedX = x + width / 2;
    const topVertexX = centerBasedX + (topVertexOffset * width);

    if (isFlippedVertically) {
        return [
            { x: topVertexX, y: y + height }, // "Top" vertex is at the bottom
            { x: x + width, y: y },         // Base is at the top
            { x: x, y: y }                  // Base is at the top
        ];
    }

    return [
        { x: topVertexX, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};

export const getRightTrianglePoints = (shape: RightTriangleShape): {x: number, y: number}[] => {
    const { x, y, width, height, isFlippedHorizontally, isFlippedVertically } = shape;
    
    // Default shape: right angle at bottom-left of the bounding box
    let points = [
        { x: x, y: y + height },         // Bottom-left (right angle)
        { x: x, y: y },                  // Top-left
        { x: x + width, y: y + height }, // Bottom-right
    ];

    if (isFlippedHorizontally) {
        // Flip around vertical center line of the bounding box
        const centerX = x + width / 2;
        points = points.map(p => ({ x: centerX - (p.x - centerX), y: p.y }));
    }
    if (isFlippedVertically) {
        // Flip around horizontal center line of the bounding box
        const centerY = y + height / 2;
        points = points.map(p => ({ x: p.x, y: centerY - (p.y - centerY) }));
    }
    
    return points;
};

export const getRhombusPoints = (shape: RhombusShape): {x: number, y: number}[] => {
    const { x, y, width, height } = shape;
    return [
        { x: x + width / 2, y: y },
        { x: x + width, y: y + height / 2 },
        { x: x + width / 2, y: y + height },
        { x: x, y: y + height / 2 }
    ];
};

export const getTrapezoidPoints = (shape: TrapezoidShape): {x: number, y: number}[] => {
    const { x, y, width, height, topLeftOffsetRatio, topRightOffsetRatio, isFlippedVertically } = shape;
    const leftOffset = width * topLeftOffsetRatio;
    const rightOffset = width * topRightOffsetRatio;

    if (isFlippedVertically) {
        return [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width - rightOffset, y: y + height },
            { x: x + leftOffset, y: y + height }
        ];
    }

    return [
        { x: x + leftOffset, y: y },
        { x: x + width - rightOffset, y: y },
        { x: x + width, y: y + height },
        { x: x, y: y + height }
    ];
};

export const getParallelogramPoints = (shape: ParallelogramShape): {x: number, y: number}[] => {
    const { x, y, width: visualWidth, height, angle, isFlippedVertically } = shape;
    if (height === 0) { // Avoid division by zero
        return [ { x, y }, { x: x + visualWidth, y: y }, { x: x + visualWidth, y: y + height }, { x, y: y + height } ];
    }

    const clampedAngle = Math.max(1, Math.min(179, angle));
    const angleRad = clampedAngle * Math.PI / 180;
    
    const offset = height / Math.tan(angleRad);
    
    const baseWidth = visualWidth - Math.abs(offset);
    
    if (baseWidth < 0) {
        return [ {x: x, y: y}, {x: x, y: y}, {x: x, y: y}, {x: x, y: y} ];
    }
    
    if (isFlippedVertically) {
        if (offset >= 0) { // angle <= 90, hangs to the right
            return [
                { x: x, y: y }, // Top-left
                { x: x + baseWidth, y: y }, // Top-right
                { x: x + visualWidth, y: y + height }, // Bottom-right
                { x: x + offset, y: y + height }, // Bottom-left
            ];
        } else { // angle > 90, hangs to the left
            return [
                { x: x - offset, y: y }, // Top-left (x + abs(offset))
                { x: x + visualWidth, y: y }, // Top-right
                { x: x + baseWidth, y: y + height }, // Bottom-right
                { x: x, y: y + height }, // Bottom-left
            ];
        }
    }

    if (offset >= 0) { // angle <= 90
        return [
            { x: x + offset, y: y }, // Top-left
            { x: x + visualWidth, y: y }, // Top-right
            { x: x + baseWidth, y: y + height }, // Bottom-right
            { x: x, y: y + height }, // Bottom-left
        ];
    } else { // angle > 90
        return [
            { x: x, y: y }, // Top-left
            { x: x + baseWidth, y: y }, // Top-right
            { x: x + visualWidth, y: y + height }, // Bottom-right
            { x: x - offset, y: y + height }, // Bottom-left (x + abs(offset))
        ];
    }
};

export const getPolygonPointsAsArray = (shape: PolygonShape): {x: number, y: number}[] => {
    const points = [];
    const { cx, cy, radius, sides, innerRadius, isFlippedHorizontally, isFlippedVertically } = shape;
    const angleStep = (Math.PI * 2) / sides;
    const rotationRad = -Math.PI / 2; // Start from top, rotation is handled by getFinalPoints

    const isStar = innerRadius !== undefined;
    const totalPoints = isStar ? sides * 2 : sides;
    for (let i = 0; i < totalPoints; i++) {
        const currentRadius = (isStar && i % 2 !== 0) ? innerRadius : radius;
        if (currentRadius === undefined) continue;
        const angle = (i * angleStep / (isStar ? 2 : 1)) + rotationRad;
        
        let pointX = cx + Math.cos(angle) * currentRadius;
        let pointY = cy + Math.sin(angle) * currentRadius;
        
        if (isFlippedHorizontally) {
            pointX = cx - (pointX - cx);
        }
        if (isFlippedVertically) {
            pointY = cy - (pointY - cy);
        }

        points.push({ x: pointX, y: pointY });
    }
    return points;
}

export const getPolylinePointsAsPath = (points: { x: number; y: number }[]): string => {
    const cleanPoints = points.filter(p => p);
    if (cleanPoints.length === 0) return '';
    const [start, ...rest] = cleanPoints;
    return `M ${start.x} ${start.y} ${rest.map(p => `L ${p.x} ${p.y}`).join(' ')}`;
};

export const isPolylineAxisAlignedRectangle = (shape: PolylineShape): boolean => {
    if (!shape.isClosed) return false;

    // Normalize points to remove duplicate at the end if it's closed
    let points = [...shape.points].filter(p => p);
    if (points.length > 1 && points[0].x === points[points.length - 1].x && points[0].y === points[points.length - 1].y) {
        points.pop();
    }
    
    if (points.length !== 4) return false;

    const xs = new Set(points.map(p => p.x));
    const ys = new Set(points.map(p => p.y));

    // For an axis-aligned rectangle, there must be exactly 2 unique x and 2 unique y coordinates.
    if (xs.size !== 2 || ys.size !== 2) return false;
    
    // This check is sufficient. If there are 4 points and only 2 unique x and y values, they must form an axis-aligned rectangle.
    return true;
};

export const getPolygonSideLength = (shape: PolygonShape): number => {
    const { radius, sides } = shape;
    if (sides < 2) return 0;
    // For stars, this is an approximation based on the outer radius, matching the behavior of the property editor's inverse function.
    return 2 * radius * Math.sin(Math.PI / sides);
};

export const getPolygonRadiusFromSideLength = (params: { sideLength: number; sides: number }): number => {
    const { sideLength, sides } = params;
    if (sides < 2) return 0;
    return sideLength / (2 * Math.sin(Math.PI / sides));
};

const getCanvasContext = (font: string): CanvasRenderingContext2D | null => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
        context.font = font;
    }
    return context;
};

export const processTextLines = (shape: TextShape): string[] => {
    const { text, font, fontSize, weight, slant, width } = shape;
    const fontString = `${slant === 'italic' ? 'italic' : 'normal'} ${weight} ${fontSize}px ${font}`;
    const context = getCanvasContext(fontString);

    if (!context) return text.split('\n'); // Fallback for environments without canvas support

    const paragraphs = text.split('\n');
    const lines: string[] = [];

    paragraphs.forEach(paragraph => {
        if (width <= 0) {
            lines.push(paragraph);
            return;
        }

        const words = paragraph.split(' ');
        let currentLine = '';
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = context.measureText(testLine);
            if (metrics.width > width && i > 0) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
    });

    return lines;
};

export const getTextBoundingBox = (shape: TextShape): { x: number, y: number, width: number, height: number } | null => {
    const { font, fontSize, weight, slant } = shape;
    const lines = processTextLines(shape);
    
    if (lines.length === 0) {
        return { x: shape.x, y: shape.y, width: 0, height: 0 };
    }

    const fontString = `${slant === 'italic' ? 'italic' : 'normal'} ${weight} ${fontSize}px ${font}`;
    const context = getCanvasContext(fontString);
    if (!context) { // Fallback
        const roughWidth = Math.max(...lines.map(l => l.length)) * fontSize * 0.6;
        return { x: shape.x, y: shape.y, width: roughWidth, height: lines.length * fontSize * 1.2 };
    }
    
    const metrics = context.measureText('M'); // Measure a representative character
    const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.2;
    const singleLineHeight = ascent + descent;
    const leading = fontSize * 0.2; // The 1.2 line-height factor
    
    // Total height is the height of the first line plus the height of subsequent lines with leading.
    const blockHeight = singleLineHeight + (lines.length - 1) * (singleLineHeight + leading);
    const blockWidth = Math.max(...lines.map(line => context.measureText(line).width));

    let { x, y } = shape;
    
    // Horizontal adjustment to find top-left corner from anchor point
    if (['n', 's', 'center'].includes(shape.anchor)) {
        x -= blockWidth / 2;
    } else if (['ne', 'e', 'se'].includes(shape.anchor)) {
        x -= blockWidth;
    }
    
    // Vertical adjustment to find top-left corner from anchor point
    // The top-left corner should be at the top of the ascent of the first line.
    if (['w', 'e', 'center'].includes(shape.anchor)) {
        y -= blockHeight / 2;
    } else if (['sw', 's', 'se'].includes(shape.anchor)) {
        y -= blockHeight;
    }

    return { x, y, width: blockWidth, height: blockHeight };
};

export const getBoundingBox = (shape: Shape): { x: number, y: number, width: number, height: number } | null => {
    let points: ({x:number, y:number} | null | undefined)[];
    
    switch (shape.type) {
        case 'rectangle':
        case 'arc':
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        case 'ellipse':
            return { x: shape.cx - shape.rx, y: shape.cy - shape.ry, width: shape.rx * 2, height: shape.ry * 2 };
        case 'text':
            return getTextBoundingBox(shape);
        case 'image':
        case 'bitmap':
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        
        case 'triangle':
        case 'right-triangle':
        case 'rhombus':
        case 'trapezoid':
        case 'parallelogram':
        case 'polygon':
        case 'star':
            points = getFinalPoints({ ...shape, rotation: 0 }) ?? [];
            break;
        case 'bezier':
        case 'polyline':
             // Bounding box for editing should be based on control points for stability, not the smoothed approximation
             points = shape.points;
             break;
        case 'line':
        case 'pencil':
            points = shape.points;
            break;
        default:
            return null;
    }
    
    if (!points || points.length === 0) return null;
    
    const validPoints = points.filter((p): p is {x: number, y: number} => !!p);
    if (validPoints.length === 0) return null;

    const xs = validPoints.map(p => p.x);
    const ys = validPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
};

export const getShapeCenter = (shape: Shape): { x: number; y: number } | null => {
    // Prioritize explicit center properties for accuracy, as they are the geometric center.
    if ('cx' in shape && 'cy' in shape) {
        return { x: shape.cx, y: shape.cy };
    }

    const unrotatedShape = 'rotation' in shape && shape.rotation !== 0 ? { ...shape, rotation: 0 } : shape;
    const box = getBoundingBox(unrotatedShape);

    if (!box) {
        // Fallback for shapes without a calculable bounding box (e.g., zero-size)
        if ('x' in shape && 'y' in shape && 'width' in shape && 'height' in shape) {
            return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
        }
        return null;
    }
    // For other shapes, the center of the bounding box is the best approximation.
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

export const rotatePoint = (point: { x: number; y: number }, center: { x: number; y: number }, angleDegrees: number): { x: number; y: number } => {
  const angleRad = -angleDegrees * (Math.PI / 180);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  return {
    x: translatedX * cos - translatedY * sin + center.x,
    y: translatedX * sin + translatedY * cos + center.y,
  };
};

export function getFinalPoints(shape: Shape, overrideCenter?: { x: number; y: number }): { x: number; y: number }[] | null {
    let points: { x: number; y: number }[];

    switch (shape.type) {
        case 'line':
        case 'pencil':
            points = shape.points.filter(p => p);
            break;
        case 'polyline':
        case 'bezier':
            points = getSplineApproximation(shape);
            break;
        case 'rectangle':
        case 'image':
        case 'bitmap':
            points = [
                { x: shape.x, y: shape.y },
                { x: shape.x + shape.width, y: shape.y },
                { x: shape.x + shape.width, y: shape.y + shape.height },
                { x: shape.x, y: shape.y + shape.height },
            ];
            break;
        case 'text':
            {
                const box = getTextBoundingBox(shape);
                if (!box) return null;
                points = [
                    { x: box.x, y: box.y },
                    { x: box.x + box.width, y: box.y },
                    { x: box.x + box.width, y: box.y + box.height },
                    { x: box.x, y: box.y + box.height },
                ];
            }
            break;
        case 'triangle':
            points = getIsoscelesTrianglePoints(shape);
            break;
        case 'right-triangle':
            points = getRightTrianglePoints(shape);
            break;
        case 'rhombus':
            points = getRhombusPoints(shape);
            break;
        case 'trapezoid':
            points = getTrapezoidPoints(shape);
            break;
        case 'parallelogram':
            points = getParallelogramPoints(shape);
            break;
        case 'polygon':
        case 'star':
            points = getPolygonPointsAsArray(shape);
            break;
        case 'ellipse':
            // For an ellipse, we can approximate with a polygon
            const ellipseShape = shape as EllipseShape;
            const sides = Math.max(24, Math.round(Math.max(ellipseShape.rx, ellipseShape.ry) / 4));
            points = getPolygonPointsAsArray({
                type: 'polygon',
                id: shape.id,
                cx: ellipseShape.cx,
                cy: ellipseShape.cy,
                radius: ellipseShape.rx, // Use rx as primary radius
                sides,
                fill: ellipseShape.fill,
                stroke: ellipseShape.stroke,
                strokeWidth: ellipseShape.strokeWidth,
                state: 'normal',
                rotation: 0
            }).map(p => ({
                x: p.x,
                // Scale y points to match ry
                y: ellipseShape.cy + (p.y - ellipseShape.cy) * (ellipseShape.ry / ellipseShape.rx)
            }));
            break;
        case 'arc':
            // Approximate arc with line segments
            const { x, y, width, height, start, extent, style } = shape;
            const rx = width / 2;
            const ry = height / 2;
            const cx = x + rx;
            const cy = y + ry;
            const segments = 32;
            const angleStep = extent / segments;
            points = [];

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }

            for (let i = 0; i <= segments; i++) {
                const angle = start + i * angleStep;
                const rad = (angle * Math.PI) / 180;
                points.push({
                    x: cx + rx * Math.cos(rad),
                    y: cy - ry * Math.sin(rad), // SVG Y-axis is inverted
                });
            }

            if (style === 'pieslice') {
                points.push({ x: cx, y: cy });
            }
            break;
        default:
            return null;
    }

    if (('rotation' in shape) && shape.rotation !== 0) {
        const center = overrideCenter ?? (shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape));
        if (!center) return points;
        return points.map(p => rotatePoint(p, center, shape.rotation));
    }

    return points;
}

export const getVisualBoundingBox = (shape: Shape, overrideCenter?: { x: number; y: number }): { x: number, y: number, width: number, height: number } | null => {
    // Optimization for rotated ellipses and circles.
    if (shape.type === 'ellipse') {
        const { cx, cy, rx, ry, rotation = 0 } = shape;
        const angleRad = (rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const term1 = Math.pow(rx * cos, 2) + Math.pow(ry * sin, 2);
        const term2 = Math.pow(rx * sin, 2) + Math.pow(ry * cos, 2);
        
        const width = 2 * Math.sqrt(term1);
        const height = 2 * Math.sqrt(term2);

        return {
            x: cx - width / 2,
            y: cy - height / 2,
            width: width,
            height: height,
        };
    }
    
    const finalPoints = getFinalPoints(shape, overrideCenter);
    if (!finalPoints || finalPoints.length === 0) {
        // Fallback for shapes without points (like a zero-size rectangle)
        if ('x' in shape && 'y' in shape && 'width' in shape && 'height' in shape) {
            return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
        }
        if ('cx' in shape && 'cy' in shape) {
            return { x: shape.cx, y: shape.cy, width: 0, height: 0 };
        }
        return null;
    }

    const xs = finalPoints.map(p => p.x);
    const ys = finalPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const getEditablePoints = (shape: Shape): {x: number, y:number}[] | null => {
    // For bezier and polyline, we MUST edit the raw control points, not the smoothed output.
    if (shape.type === 'bezier' || shape.type === 'polyline' || shape.type === 'pencil' || shape.type === 'line') {
        // Return the LOCAL, UNROTATED points
        return shape.points.filter(p => p);
    }
    
    // For other shapes, we generate their vertices in LOCAL, UNROTATED space
    const unrotatedShape = { ...shape, rotation: 0 };
    const points = getFinalPoints(unrotatedShape);
    if (!points || points.length === 0) return null;
    
    let isClosed = (
        (shape.type === 'arc' && (shape.style === 'pieslice' || shape.style === 'chord')) ||
        ['rectangle', 'ellipse', 'polygon', 'star', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'text'].includes(shape.type)
    );

    // Special case for open arcs, which are not closed.
    if (shape.type === 'arc' && shape.style === 'arc') {
        isClosed = false;
    }

    // For closed shapes, the last point from getFinalPoints might be a duplicate of the first for rendering.
    // The editor should not show this duplicate point.
    if (isClosed && points.length > 1) {
        const first = points[0];
        const last = points[points.length - 1];
        if (Math.abs(first.x - last.x) < 0.01 && Math.abs(first.y - last.y) < 0.01) {
            return points.slice(0, -1);
        }
    }

    return points;
};

export function findClosestPointOnSegment(p: {x:number, y:number}, a: {x:number, y:number}, b: {x:number, y:number}): { point: {x:number, y:number}, t: number } {
  const ap = { x: p.x - a.x, y: p.y - a.y };
  const ab = { x: b.x - a.x, y: b.y - a.y };

  const ab2 = ab.x * ab.x + ab.y * ab.y;
  if (ab2 === 0) { // a and b are the same point
    return { point: a, t: 0 };
  }
  const ap_ab = ap.x * ab.x + ap.y * ab.y;
  let t = ap_ab / ab2;

  t = Math.max(0, Math.min(1, t));

  const closestPoint = {
    x: a.x + ab.x * t,
    y: a.y + ab.y * t,
  };
  
  return { point: closestPoint, t: t };
}