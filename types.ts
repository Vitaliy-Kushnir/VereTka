export type Tool = 
    | 'select' 
    | 'edit-points' 
    | 'rectangle' 
    | 'square'
    | 'circle'
    | 'ellipse' 
    | 'line' 
    | 'pencil' 
    | 'triangle'
    | 'right-triangle'
    | 'polygon'
    | 'star'
    | 'polyline'
    | 'rhombus'
    | 'trapezoid'
    | 'parallelogram'
    | 'bezier'
    | 'arc'
    | 'pieslice'
    | 'chord'
    | 'text'
    | 'image'
    | 'bitmap';

export type DrawMode = 'corner' | 'center';
export type JoinStyle = 'miter' | 'round' | 'bevel';
export type BuiltInBitmap = 'error' | 'gray75' | 'gray50' | 'gray25' | 'gray12' | 'hourglass' | 'info' | 'questhead' | 'question' | 'warning';
export type TransformHandle = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'line-start' | 'line-end';


export interface ViewTransform {
    scale: number;
    x: number;
    y: number;
}

interface BaseShape {
    id: string;
    name?: string;
    type: Tool;
    state: 'normal' | 'hidden' | 'disabled';
    stroke: string;
    strokeWidth: number;
    isAspectRatioLocked?: boolean;
    comment?: string;
}

export interface RotatableShape {
    rotation: number;
    rotationHandlePosition?: 'bottom';
}

export interface FillableShape {
    fill: string;
    stipple?: 'gray12' | 'gray25' | 'gray50' | 'gray75';
}

export interface DashableShape {
    dash?: number[];
    dashoffset?: number;
}

export interface JoinableShape {
    joinstyle?: JoinStyle;
}

export interface RectangleShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface EllipseShape extends BaseShape, RotatableShape, FillableShape, DashableShape {
    type: 'ellipse';
    cx: number;
    cy: number;
    rx: number;
    ry: number;
}

export interface LineShape extends BaseShape, RotatableShape, DashableShape {
    type: 'line';
    points: [{ x: number; y: number }, { x: number; y: number }];
    capstyle?: 'butt' | 'round' | 'projecting';
    arrow?: 'none' | 'first' | 'last' | 'both';
    arrowshape?: [number, number, number];
    activeStroke?: string;
}

export interface PolylineShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'polyline';
    points: { x: number; y: number }[];
    isClosed: boolean;
    smooth?: boolean;
    splinesteps?: number;
    capstyle?: 'butt' | 'round' | 'projecting';
    arrow?: 'none' | 'first' | 'last' | 'both';
    arrowshape?: [number, number, number];
    activeStroke?: string;
}

export interface BezierCurveShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'bezier';
    points: { x: number; y: number }[];
    isClosed: boolean;
    smooth: boolean;
    splinesteps: number;
    capstyle?: 'butt' | 'round' | 'projecting';
    arrow?: 'none' | 'first' | 'last' | 'both';
    arrowshape?: [number, number, number];
    activeStroke?: string;
}

export interface PathShape extends BaseShape, RotatableShape, DashableShape, JoinableShape {
    type: 'pencil';
    points: { x: number; y: number }[];
    capstyle?: 'butt' | 'round' | 'projecting';
    arrow?: 'none' | 'first' | 'last' | 'both';
    arrowshape?: [number, number, number];
    activeStroke?: string;
}

export interface PolygonShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'polygon' | 'star';
    cx: number;
    cy: number;
    radius: number;
    sides: number;
    innerRadius?: number; // Only for stars
    smooth?: boolean;
    isFlippedHorizontally?: boolean;
    isFlippedVertically?: boolean;
}

export interface IsoscelesTriangleShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'triangle';
    x: number;
    y: number;
    width: number;
    height: number;
    topVertexOffset?: number; // as a ratio of width
    isFlippedVertically?: boolean;
}

export interface RightTriangleShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'right-triangle';
    x: number;
    y: number;
    width: number;
    height: number;
    isFlippedHorizontally?: boolean;
    isFlippedVertically?: boolean;
}

export interface RhombusShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'rhombus';
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TrapezoidShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'trapezoid';
    x: number;
    y: number;
    width: number;
    height: number;
    topLeftOffsetRatio: number;
    topRightOffsetRatio: number;
    isSymmetrical?: boolean;
    isFlippedVertically?: boolean;
}

export interface ParallelogramShape extends BaseShape, RotatableShape, FillableShape, DashableShape, JoinableShape {
    type: 'parallelogram';
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number; // in degrees, 1-179
    isFlippedVertically?: boolean;
}

export interface ArcShape extends BaseShape, RotatableShape, FillableShape, DashableShape {
    type: 'arc';
    x: number;
    y: number;
    width: number;
    height: number;
    start: number;
    extent: number;
    style: 'pieslice' | 'chord' | 'arc';
    capstyle?: 'butt' | 'round' | 'projecting';
    arrow?: 'none' | 'first' | 'last' | 'both';
    arrowshape?: [number, number, number];
    activeStroke?: string;
    isExtentLocked?: boolean;
}

export interface TextShape extends BaseShape, RotatableShape, FillableShape {
    type: 'text';
    x: number;
    y: number;
    text: string;
    font: string;
    fontSize: number;
    weight: 'normal' | 'bold';
    slant: 'roman' | 'italic';
    underline: boolean;
    overstrike: boolean;
    anchor: 'nw' | 'n' | 'ne' | 'w' | 'center' | 'e' | 'sw' | 's' | 'se';
    justify: 'left' | 'center' | 'right';
    width: number; // For wrapping
}

export interface ImageShape extends BaseShape, RotatableShape {
    type: 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
}

export interface BitmapShape extends BaseShape, RotatableShape {
    type: 'bitmap';
    x: number;
    y: number;
    width: number;
    height: number;
    bitmapType: BuiltInBitmap;
    foreground: string;
    background: string;
}

export type Shape = 
    | RectangleShape 
    | EllipseShape 
    | LineShape 
    | PolylineShape
    | BezierCurveShape
    | PathShape 
    | PolygonShape
    | IsoscelesTriangleShape
    | RightTriangleShape
    | RhombusShape
    | TrapezoidShape
    | ParallelogramShape
    | ArcShape
    | TextShape
    | ImageShape
    | BitmapShape;

export type CanvasAction = 
    | { type: 'drawing', shape: Shape, startPos: { x: number, y: number } }
    | { type: 'dragging', initialShape: Shape, startPos: { x: number, y: number } }
    | { type: 'duplicating', initialShape: Shape, startPos: { x: number, y: number } }
    | { type: 'resizing', handle: TransformHandle, initialShape: Shape, anchorPointGlobal: { x: number, y: number }, initialShapeProps: { rotationCenter: {x:number, y:number}, geometricCenter: {x:number, y:number}, bbox: { x: number, y: number, width: number, height: number } } }
    | { type: 'rotating', initialShape: Shape & RotatableShape, center: { x: number, y: number }, startAngle: number }
    | { type: 'panning', initialPos: { x: number, y: number } }
    | { type: 'point-editing', initialShape: Shape, pointIndex: number, center: {x: number, y:number} }
    | { type: 'arc-angle-editing', handle: 'start' | 'end' | 'move', initialShape: ArcShape, center: {x:number, y:number}, initialMouseAngle: number }
    | { type: 'triangle-vertex-editing', initialShape: IsoscelesTriangleShape }
    | { type: 'star-inner-radius-editing', initialShape: PolygonShape, center: {x: number, y: number} }
    | { type: 'trapezoid-offset-editing', handle: 'left' | 'right', initialShape: TrapezoidShape }
    | { type: 'parallelogram-angle-editing', initialShape: ParallelogramShape }
    | null;