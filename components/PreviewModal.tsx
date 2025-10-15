import React, { useMemo } from 'react';
import { Shape, LineShape, BezierCurveShape, PolylineShape, JoinStyle, PolygonShape, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, EllipseShape, ArcShape, PathShape, TextShape, ImageShape, BitmapShape, RightTriangleShape } from '../types';
import { getIsoscelesTrianglePoints, getPolylinePointsAsPath, getPolygonPointsAsArray, getRhombusPoints, getTrapezoidPoints, getParallelogramPoints, getSmoothedPathData, getFinalPoints, getArcPathData, getShapeCenter, getTextBoundingBox, processTextLines, getRightTrianglePoints } from '../lib/geometry';
import { XIcon } from './icons';
import { getVisualFontFamily } from '../lib/constants';

const formatPointsForSvg = (points: { x: number; y: number }[]): string => {
    return points.map(p => `${p.x},${p.y}`).join(' ');
};

interface PreviewModalProps {
  projectName: string;
  shapes: Shape[];
  width: number;
  height: number;
  backgroundColor: string;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ projectName, shapes, width, height, backgroundColor, onClose }) => {
    
    const getTransform = (shape: Shape) => {
        if ('rotation' in shape && shape.rotation && shape.rotation !== 0) {
            const center = shape.type === 'text' ? {x: shape.x, y: shape.y} : getShapeCenter(shape);
            if(center) return `rotate(${shape.rotation} ${center.x} ${center.y})`;
        }
        return undefined;
    };
    
    const arrowMarkers = useMemo(() => {
        const markers = new Map<string, { color: string; shapeParams: [number, number, number] }>();
        shapes.forEach(shape => {
            if (!shape) return;
            if ((shape.type === 'line' || shape.type === 'bezier' || shape.type === 'pencil' || (shape.type === 'polyline' && !shape.isClosed)) && shape.arrow && shape.arrow !== 'none' && shape.stroke !== 'none' && shape.strokeWidth > 0 && shape.arrowshape) {
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
    }, [shapes]);

    const joinStyleProps = (s: { joinstyle?: JoinStyle }) => {
        const joinstyle = s.joinstyle ?? 'miter';
        return {
            strokeLinejoin: joinstyle,
            strokeMiterlimit: joinstyle === 'miter' ? 10 : undefined,
        };
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl flex flex-col max-w-full max-h-full"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-2 px-4 border-b border-[var(--border-primary)] bg-[var(--bg-app)] rounded-t-lg flex-shrink-0">
                    <h2 className="text-sm font-bold text-[var(--text-primary)] truncate" title={`Попередній перегляд: ${projectName}`}>Попередній перегляд: {projectName}</h2>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full">
                        <XIcon />
                    </button>
                </header>
                <div className="p-4 bg-[var(--bg-secondary)]/50 overflow-auto">
                    <svg
                        width={width}
                        height={height}
                        style={{ backgroundColor, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}
                        className="rounded-md flex-shrink-0"
                    >
                        <defs>
                            <pattern id="pattern-gray12" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="black"/><rect x="1" y="1" width="1" height="1" fill="white"/></pattern>
                            <mask id="mask-gray12"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray12)"/></mask>
                            <pattern id="pattern-gray25" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="black"/><rect x="0" y="0" width="1" height="1" fill="white"/></pattern>
                            <mask id="mask-gray25"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray25)"/></mask>
                            <pattern id="pattern-gray50" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="black"/><rect x="0" y="0" width="1" height="1" fill="white"/><rect x="1" y="1" width="1" height="1" fill="white"/></pattern>
                            <mask id="mask-gray50"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            <pattern id="pattern-gray75" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="white"/><rect x="1" y="1" width="1" height="1" fill="black"/></pattern>
                            <mask id="mask-gray75"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray75)"/></mask>
                            <pattern id="pattern-bitmap-error" width="8" height="8" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
                                <path d="M0,0 L8,8 M8,0 L0,8" stroke="currentColor" strokeWidth="1" shapeRendering="crispEdges"/>
                            </pattern>
                            <mask id="mask-bitmap-error"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-bitmap-error)"/></mask>
                            <mask id="mask-bitmap-hourglass"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            <mask id="mask-bitmap-info"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            <mask id="mask-bitmap-questhead"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            <mask id="mask-bitmap-question"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            <mask id="mask-bitmap-warning"><rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-gray50)"/></mask>
                            {arrowMarkers.map(({ color, shapeParams }) => {
                                const [d1, d2, d3] = shapeParams;
                                if (d2 === 0 || d3 === 0) return null;
                                const key = `${color.replace(/[^a-zA-Z0-9]/g, '')}-${d1}-${d2}-${d3}`;
                                
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
                        <rect x="0" y="0" width={width} height={height} fill={backgroundColor} />
                        {shapes.map(shape => {
                            if (!shape) return null;
                            if (shape.state === 'hidden') return null;

                            const staticProps: React.SVGProps<any> = {
                                stroke: shape.stroke,
                                strokeWidth: shape.strokeWidth,
                                style: { opacity: shape.state === 'disabled' ? 0.5 : 1 },
                                transform: getTransform(shape),
                            };
                            
                            const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | PathShape) => {
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
                                const lineCap: 'butt' | 'round' | 'square' = (s.capstyle === 'projecting' ? 'square' : s.capstyle) ?? 'butt';
                                
                                let markerStart, markerEnd;
                                if (hasVisibleStroke && s.arrow && s.arrow !== 'none' && s.arrowshape) {
                                    const [d1m, d2m, d3m] = s.arrowshape;
                                    const w = s.strokeWidth;
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
                                    const rectProps: any = { ...staticProps, x: shape.x, y: shape.y, width: shape.width, height: shape.height, fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') rectProps.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) rectProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) rectProps.strokeDashoffset = shape.dashoffset;
                                    return <rect key={shape.id} {...rectProps} />;
                                }
                                case 'ellipse': {
                                    const ellipse = shape as EllipseShape;
                                    const ellipseProps: any = { ...staticProps, cx: ellipse.cx, cy: ellipse.cy, rx: ellipse.rx, ry: ellipse.ry, fill: ellipse.fill };
                                    if (ellipse.stipple && ellipse.fill !== 'none') ellipseProps.mask = `url(#mask-${ellipse.stipple})`;
                                    if (ellipse.dash) ellipseProps.strokeDasharray = ellipse.dash.map(v => v * ellipse.strokeWidth).join(' ');
                                    if (ellipse.dashoffset) ellipseProps.strokeDashoffset = ellipse.dashoffset;
                                    return <ellipse key={ellipse.id} {...ellipseProps} />;
                                }
                                case 'arc': {
                                    const arcShape = shape as ArcShape;
                                    const arcProps: any = { ...staticProps, d: getArcPathData(arcShape), fill: arcShape.style === 'arc' ? 'none' : arcShape.fill };
                                    if (arcShape.stipple && arcShape.fill !== 'none' && arcShape.style !== 'arc') arcProps.mask = `url(#mask-${arcShape.stipple})`;
                                    if (arcShape.dash) arcProps.strokeDasharray = arcShape.dash.map(v => v * arcShape.strokeWidth).join(' ');
                                    if (arcShape.dashoffset) arcProps.strokeDashoffset = arcShape.dashoffset;
                                    return <path key={shape.id} {...arcProps} />;
                                }
                                case 'line':
                                    return <line key={shape.id} {...staticProps} x1={shape.points[0].x} y1={shape.points[0].y} x2={shape.points[1].x} y2={shape.points[1].y} {...lineLikeProps(shape)} />;
                                case 'bezier':
                                    const fill = shape.isClosed ? shape.fill : 'none';
                                    return <path key={shape.id} {...staticProps} d={getSmoothedPathData(shape.points, shape.smooth, shape.isClosed)} fill={fill} {...lineLikeProps(shape)} {...joinStyleProps(shape)} />;
                                case 'pencil':
                                    return <path key={shape.id} {...staticProps} d={getPolylinePointsAsPath(shape.points)} fill="none" strokeLinecap="round" {...joinStyleProps(shape)} {...lineLikeProps(shape)} />;
                                case 'polyline': {
                                    const polyProps: React.SVGProps<any> = { ...staticProps, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.isClosed && shape.fill !== 'none') polyProps.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) polyProps.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) polyProps.strokeDashoffset = shape.dashoffset;
                                    
                                    if (!shape.isClosed) {
                                        polyProps.fill = 'none';
                                        Object.assign(polyProps, lineLikeProps(shape));
                                    } else {
                                        polyProps.fill = shape.fill;
                                    }

                                    if (shape.smooth) return <path key={shape.id} {...polyProps} d={getSmoothedPathData(shape.points, true, shape.isClosed)} />;
                                    if (shape.isClosed) return <polygon key={shape.id} {...polyProps} points={formatPointsForSvg(shape.points)} />;
                                    return <polyline key={shape.id} {...polyProps} points={formatPointsForSvg(shape.points)} fill="none" />;
                                }
                                case 'triangle': {
                                    const props: any = { ...staticProps, points: formatPointsForSvg(getIsoscelesTrianglePoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                                    return <polygon key={shape.id} {...props} />;
                                }
                                case 'right-triangle': {
                                    const props: any = { ...staticProps, points: formatPointsForSvg(getRightTrianglePoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                                    return <polygon key={shape.id} {...props} />;
                                }
                                case 'rhombus': {
                                    const props: any = { ...staticProps, points: formatPointsForSvg(getRhombusPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                                    return <polygon key={shape.id} {...props} />;
                                }
                                case 'trapezoid': {
                                    const props: any = { ...staticProps, points: formatPointsForSvg(getTrapezoidPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                                    return <polygon key={shape.id} {...props} />;
                                }
                                case 'parallelogram': {
                                    const props: any = { ...staticProps, points: formatPointsForSvg(getParallelogramPoints(shape)), fill: shape.fill, ...joinStyleProps(shape) };
                                    if (shape.stipple && shape.fill !== 'none') props.mask = `url(#mask-${shape.stipple})`;
                                    if (shape.dash) props.strokeDasharray = shape.dash.map(v => v * shape.strokeWidth).join(' ');
                                    if (shape.dashoffset) props.strokeDashoffset = shape.dashoffset;
                                    return <polygon key={shape.id} {...props} />;
                                }
                                case 'polygon':
                                case 'star': {
                                    const polyShape = shape as PolygonShape;
                                    const polyProps: any = { ...staticProps, fill: polyShape.fill, ...joinStyleProps(polyShape) };
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
                                                <tspan key={index} x={textBlockX} dy={index === 0 ? 0 : `${fontSize * 1.2}px`}>
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
                                            {...staticProps}
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
                                        <g key={bitmapShape.id} {...staticProps}>
                                            <rect x={x} y={y} width={bmpWidth} height={bmpHeight} fill={background} />
                                            <rect x={x} y={y} width={bmpWidth} height={bmpHeight} fill={foreground} mask={maskId} />
                                        </g>
                                    );
                                }
                                default: return null;
                            }
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;