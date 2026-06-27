
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Shape, LineShape, BezierCurveShape, PathShape, JoinStyle, PolygonShape, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, PolylineShape, RectangleShape, EllipseShape, Tool, ArcShape, RightTriangleShape, TextShape, ImageShape, BitmapShape, BuiltInBitmap } from '../types';
import { getVisualBoundingBox, getFinalPoints, getPolygonSideLength, getBoundingBox, getPolygonRadiusFromSideLength, getEditablePoints, getShapeCenter, getTextBoundingBox, rotatePoint } from '../lib/geometry';
import { InputWrapper, Label, NumberInput, ColorInput, Checkbox, Select, TextArea, DashSelect } from './FormControls';
import { DuplicateIcon, TrashIcon, LockIcon, UnlockIcon, ConvertToPathIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './icons';
import { getDefaultNameForShape, TOOL_TYPE_TO_NAME, DASH_STYLES } from '../lib/constants';
import { useLanguage } from './LanguageContext';

interface PropertyEditorProps {
  selectedShapes: Shape[];
  allShapes: Shape[];
  updateShape: (shape: Shape) => void;
  updateShapes?: (shapes: Shape[]) => void;
  deleteShape: (id: string) => void;
  duplicateShape: (id: string) => void;
  activeTool: Tool;
  activePointIndex: number | null;
  setActivePointIndex: (index: number | null) => void;
  deletePoint: (shapeId: string, pointIndex: number) => void;
  addPoint: (shapeId: string, pointIndex: number) => void;
  convertToPath: (id: string) => void;
  showNotification: (message: string, type?: 'info' | 'error', duration?: number) => void;
  setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
  cancelShapePreview: () => void;
  fillColor: string;
  strokeColor: string;
}

// Type declaration for the experimental Local Font Access API
declare global {
  interface Window {
    queryLocalFonts?: () => Promise<FontData[]>;
  }
  interface FontData {
      family: string;
      fullName: string;
      postscriptName: string;
      style: string;
  }
}

type FillableShape = Exclude<Extract<Shape, { fill: string }>, PathShape>;
type JoinableShape = 
    | PolygonShape 
    | IsoscelesTriangleShape 
    | RightTriangleShape
    | RhombusShape 
    | ParallelogramShape 
    | TrapezoidShape 
    | PolylineShape
    | BezierCurveShape
    | PathShape
    | RectangleShape;
type StippleableShape = 
    | RectangleShape 
    | EllipseShape 
    | PolygonShape 
    | ArcShape 
    | IsoscelesTriangleShape 
    | RightTriangleShape
    | RhombusShape 
    | TrapezoidShape 
    | ParallelogramShape
    | PolylineShape
    | BezierCurveShape
    | TextShape;

type DashableShape = Extract<Shape, { dash?: number[] }>;


const DashControls: React.FC<{
    shape: DashableShape;
    updateShape: (shape: Shape) => void;
    roundFn: (num: number) => number;
}> = ({ shape, updateShape, roundFn }) => {
    const isStrokeDisabled = shape.stroke === 'none' || shape.strokeWidth === 0;
    const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
    const { t } = useLanguage();
    
    const isCustomDash = React.useMemo(() => {
        if (!shape.dash || shape.dash.length === 0) return false;
        return !DASH_STYLES.some(style => JSON.stringify(style.pattern) === JSON.stringify(shape.dash));
    }, [shape.dash]);

    const handleDashChange = (newDash: number[] | undefined) => {
        updateShape({ ...shape, dash: newDash, dashoffset: newDash ? (shape.dashoffset ?? 0) : undefined });
    };

    const handleSegmentChange = (index: number, absoluteValue: number) => {
        if (!shape.dash) return;
        const newDash = [...shape.dash];
        const newMultiplier = absoluteValue >= 0 ? absoluteValue / strokeWidth : 0;
        newDash[index] = newMultiplier;
        updateShape({ ...shape, dash: newDash });
    };

    const addSegment = () => {
        const currentDash = shape.dash ?? [];
        // Add a default dash-gap pair
        updateShape({ ...shape, dash: [...currentDash, 5, 3] });
    };

    const removeSegment = () => {
        if (!shape.dash || shape.dash.length < 2) return;
        // Remove the last dash-gap pair
        const newDash = shape.dash.slice(0, -2);
        updateShape({ ...shape, dash: newDash.length > 0 ? newDash : undefined });
    };


    return (
        <div className="space-y-2">
            <InputWrapper>
                <Label htmlFor={`${shape.id}-dash-select`} title={t('prop.dash')}>{t('prop.dash')}:</Label>
                <DashSelect id={`${shape.id}-dash-select`} value={shape.dash} onChange={handleDashChange} disabled={isStrokeDisabled} isCustom={isCustomDash} />
            </InputWrapper>
            {shape.dash && shape.dash.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-[var(--border-secondary)] ml-2 mt-2 pt-2">
                    <div className="space-y-2">
                        {shape.dash.map((val, index) => (
                            <InputWrapper key={index}>
                                <Label htmlFor={`${shape.id}-dash-${index}`} title={index % 2 === 0 ? t('prop.dash.strokeLen', {i: index/2 + 1}) : t('prop.dash.gapLen', {i: Math.ceil(index/2)})}>{index % 2 === 0 ? t('prop.dash.stroke', {i: index/2+1}) : t('prop.dash.gap', {i: Math.ceil(index/2)})}</Label>
                                <NumberInput 
                                  id={`${shape.id}-dash-${index}`} 
                                  value={roundFn(val * strokeWidth)} 
                                  onChange={v => handleSegmentChange(index, v)} 
                                  min={0}
                                  disabled={isStrokeDisabled}
                                  title={index % 2 === 0 ? t('prop.dash.strokeLenTitle') : t('prop.dash.gapLenTitle')}
                                />
                            </InputWrapper>
                        ))}
                    </div>
                     <div className="flex items-center justify-end gap-2 pt-1">
                        <button 
                          onClick={removeSegment} 
                          disabled={shape.dash.length < 2} 
                          className="px-2 py-1 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--destructive-bg)] rounded-md disabled:opacity-50"
                          title={t('prop.dash.removeSegment')}
                        >-</button>
                        <button 
                          onClick={addSegment} 
                          className="px-2 py-1 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] rounded-md"
                          title={t('prop.dash.addSegment')}
                        >+</button>
                    </div>
                    <InputWrapper>
                        <Label htmlFor={`${shape.id}-dashoffset`} title={t('props.dashOffsetDesc')}>{t('props.dashOffset')}</Label>
                        <NumberInput 
                          id={`${shape.id}-dashoffset`} 
                          value={roundFn(shape.dashoffset ?? 0)} 
                          onChange={v => updateShape({ ...shape, dashoffset: v })}
                          disabled={isStrokeDisabled}
                          title={t('props.dashOffsetDesc')}
                        />
                    </InputWrapper>
                </div>
            )}
        </div>
    );
};

const StippleControls: React.FC<{
    shape: StippleableShape;
    updateShape: (shape: Shape) => void;
}> = ({ shape, updateShape }) => {
    const hasFill = 'fill' in shape && shape.fill !== 'none';
    const { t } = useLanguage();

    return (
        <>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-stipple`} title={t('props.stipple')}>{t('props.stipple')}:</Label>
                <Select id={`${shape.id}-stipple`} value={shape.stipple ?? 'none'} onChange={v => updateShape({ ...shape, stipple: v === 'none' ? undefined : v as any })} disabled={!hasFill} title={t('prop.title.stipple')}>
                    <option value="none">{t('props.stipple.none')}</option>
                    <option value="gray12">Gray 12%</option>
                    <option value="gray25">Gray 25%</option>
                    <option value="gray50">Gray 50%</option>
                    <option value="gray75">Gray 75%</option>
                </Select>
            </InputWrapper>
            <div className="text-xs text-[var(--text-tertiary)] ml-32 -mt-2 mb-2">{t('props.stippleNote')}</div>
        </>
    );
};

const FillControls: React.FC<{
    shape: FillableShape;
    updateShape: (shape: Shape) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    fillColor: string;
    showNotification: PropertyEditorProps['showNotification'];
}> = ({ shape, updateShape, setShapePreview, cancelShapePreview, fillColor, showNotification }) => {
    const { t } = useLanguage();
    const isFillNone = shape.fill === 'none';
    const isFillDisabled = 
        (shape.type === 'arc' && shape.style === 'arc') ||
        ((shape.type === 'polyline' || shape.type === 'bezier') && !shape.isClosed);

    return (
        <div className="flex items-center gap-2">
            <input
                id={`${shape.id}-fill-toggle`}
                type="checkbox"
                checked={!isFillNone}
                onChange={e => {
                    if (e.target.checked) {
                        const colorToRestore = shape._previousFill || fillColor;
                        updateShape({ ...shape, fill: colorToRestore });
                    } else {
                        updateShape({ ...shape, fill: 'none', _previousFill: shape.fill });
                    }
                }}
                disabled={isFillDisabled}
                title={t('prop.title.enableFill')}
                className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <ColorInput 
                id={`${shape.id}-fill`} 
                value={isFillNone ? '#000000' : shape.fill} 
                onChange={v => updateShape({ ...shape, fill: v })} 
                onPreview={v => setShapePreview(shape.id, { fill: v ?? undefined })}
                onCancel={cancelShapePreview}
                disabled={isFillNone || isFillDisabled} 
                title={t('prop.title.fillColor')}
                showNotification={showNotification}
            />
        </div>
    );
};

const StrokeControls: React.FC<{
    shape: Shape;
    updateShape: (shape: Shape) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    roundFn: (num: number) => number;
    strokeColor: string;
    showNotification: PropertyEditorProps['showNotification'];
}> = ({ shape, updateShape, setShapePreview, cancelShapePreview, roundFn, strokeColor, showNotification }) => {
    const isStrokeNone = shape.stroke === 'none';
    const showDashControls = shape.type !== 'text';
    const { t } = useLanguage();

    return (
        <>
            <hr className="border-[var(--border-secondary)] my-2" />
            <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.stroke')}</h3>
            <div className="flex items-center gap-2">
                <input 
                    id={`${shape.id}-stroke-toggle`} 
                    type="checkbox"
                    checked={!isStrokeNone} 
                    onChange={e => {
                        if (e.target.checked) {
                            const colorToRestore = shape._previousStroke || strokeColor;
                            updateShape({ ...shape, stroke: colorToRestore });
                        } else {
                            updateShape({ ...shape, stroke: 'none', _previousStroke: shape.stroke });
                        }
                    }} 
                    title={t('prop.title.enableStroke')}
                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <ColorInput 
                    id={`${shape.id}-stroke`} 
                    value={isStrokeNone ? '#ffffff' : shape.stroke} 
                    onChange={v => updateShape({ ...shape, stroke: v })}
                    onPreview={v => setShapePreview(shape.id, { stroke: v ?? undefined })}
                    onCancel={cancelShapePreview}
                    disabled={isStrokeNone} 
                    title={t('prop.title.strokeColor')}
                    showNotification={showNotification}
                />
            </div>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-stroke-width`} title={t('prop.title.strokeWidthLine')}>{t('prop.width')}</Label>
                <NumberInput 
                    id={`${shape.id}-stroke-width`} 
                    value={roundFn(shape.strokeWidth)} 
                    onChange={v => updateShape({ ...shape, strokeWidth: v })} 
                    min={0} 
                    disabled={isStrokeNone} 
                    title={t('prop.title.strokeWidthLine')}
                    smartRound={false}
                />
            </InputWrapper>
            {showDashControls && <DashControls shape={shape as DashableShape} updateShape={updateShape} roundFn={roundFn} />}
        </>
    );
};


const PointsEditor: React.FC<{
    points: { x: number; y: number }[];
    onPointsChange: (newPoints: { x: number; y: number }[]) => void;
    shapeId: string;
    selectedShape: Shape;
    isEditing: boolean;
    activePointIndex: number | null;
    setActivePointIndex: (index: number | null) => void;
    deletePoint: (index: number) => void;
    addPoint: (index: number) => void;
    isShapeClosed: boolean;
    roundFn: (num: number) => number;
}> = ({ points, onPointsChange, shapeId, selectedShape, isEditing, activePointIndex, setActivePointIndex, deletePoint, addPoint, isShapeClosed, roundFn }) => {
    const [isOpen, setIsOpen] = useState(points.length < 10);
    const pointRowRefs = useRef<(HTMLDivElement | null)[]>([]);
    const xInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        pointRowRefs.current = pointRowRefs.current.slice(0, points.length);
        xInputRefs.current = xInputRefs.current.slice(0, points.length);
    }, [points.length]);

    useEffect(() => {
        if (activePointIndex !== null) {
            pointRowRefs.current[activePointIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
            xInputRefs.current[activePointIndex]?.focus({ preventScroll: true });
        }
    }, [activePointIndex]);
    
    const center = useMemo(() => getShapeCenter(selectedShape), [selectedShape]);
    const rotation = useMemo(() => 'rotation' in selectedShape ? selectedShape.rotation : 0, [selectedShape]);

    const displayedPoints = useMemo(() => {
        if (!center || rotation === 0) return points;
        return points.map(p => rotatePoint(p, center, rotation));
    }, [points, center, rotation]);

    const handlePointChange = (index: number, axis: 'x' | 'y', value: number) => {
        if (!center) return;

        if (rotation === 0) {
            const newPoints = [...points];
            newPoints[index] = { ...newPoints[index], [axis]: value };
            onPointsChange(newPoints);
            return;
        }

        // The input 'value' is a world coordinate. We need to un-rotate it.
        const currentDisplayedPoint = displayedPoints[index];
        const newDisplayedPoint = { ...currentDisplayedPoint, [axis]: value };
        const newLocalPoint = rotatePoint(newDisplayedPoint, center, -rotation);
        
        const newLocalPoints = [...points];
        newLocalPoints[index] = newLocalPoint;
        onPointsChange(newLocalPoints);
    };

    return (
        <div className="border-t border-[var(--border-secondary)] pt-2 mt-2">
            <button onClick={() => setIsOpen(p => !p)} className="w-full text-left font-semibold text-[var(--text-secondary)] py-1 flex justify-between items-center" title={t('props.nodesDesc')}>
                <span>{t('props.nodes.count').replace('{count}', points.length.toString())}</span>
                <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>
            {isOpen && (
                 <div className="space-y-1 mt-2 max-h-60 overflow-y-auto pr-2">
                    {points.map((p, i) => (
                        <React.Fragment key={`${shapeId}-point-fragment-${i}`}>
                            <div 
                                ref={el => { pointRowRefs.current[i] = el; }}
                                key={`${shapeId}-point-${i}`} 
                                className={`grid grid-cols-[2.5rem_1fr_1fr_auto] items-center gap-2 p-1 rounded-md transition-colors`}
                            >
                                <span className="text-xs text-[var(--text-tertiary)] font-mono text-right">{i}:</span>
                                <NumberInput 
                                    ref={el => { xInputRefs.current[i] = el; }}
                                    id={`${shapeId}-point-${i}-x`} 
                                    value={roundFn(displayedPoints[i].x)} 
                                    onChange={v => handlePointChange(i, 'x', v)} 
                                    disabled={!isEditing}
                                    onFocus={() => setActivePointIndex(i)}
                                    title={t('prop.title.nodeX').replace('{i}', i.toString())}
                                    className={activePointIndex === i ? 'bg-[#4f46e5]/30' : ''}
                                    smartRound={false}
                                />
                                <NumberInput 
                                    id={`${shapeId}-point-${i}-y`} 
                                    value={roundFn(displayedPoints[i].y)} 
                                    onChange={v => handlePointChange(i, 'y', v)} 
                                    disabled={!isEditing}
                                    onFocus={() => setActivePointIndex(i)}
                                    title={t('prop.title.nodeY').replace('{i}', i.toString())}
                                    className={activePointIndex === i ? 'bg-[#4f46e5]/30' : ''}
                                    smartRound={false}
                                />
                                <button
                                    onClick={() => deletePoint(i)}
                                    title={t('props.nodeDelete')}
                                    className="p-1 text-[var(--destructive-text)] hover:text-[var(--accent-text)] hover:bg-[var(--destructive-bg-hover)] rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!isEditing || points.length <= 2}
                                >
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                            {(isShapeClosed || i < points.length - 1) && isEditing && (
                                <div className="grid grid-cols-[2.5rem_1fr_1fr_auto] items-center gap-2 h-4">
                                    <div className="flex justify-center items-center">
                                        <button
                                            onClick={() => addPoint(i + 1)}
                                            title={t('prop.title.addNode')}
                                            className="w-5 h-5 flex justify-center items-center bg-[var(--bg-primary)] text-[var(--text-tertiary)] hover:bg-[var(--accent-primary)] hover:text-[var(--accent-text)] rounded-full transition-colors group"
                                        >
                                            <svg className="w-3 h-3 text-[var(--text-tertiary)] group-hover:text-[var(--accent-text)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="col-span-3 h-px bg-[var(--border-secondary)]"></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};

const TkinterBboxEditor: React.FC<{
  shape: RectangleShape | EllipseShape | ArcShape;
  updateShape: (shape: Shape) => void;
  roundFn: (num: number) => number;
}> = ({ shape, updateShape, roundFn }) => {
    const { t } = useLanguage();
    
    let x1=0, y1=0, x2=0, y2=0;

    if (shape.type === 'rectangle' || shape.type === 'arc') {
        x1 = shape.x;
        y1 = shape.y;
        x2 = shape.x + shape.width;
        y2 = shape.y + shape.height;
    } else if (shape.type === 'ellipse') {
        x1 = shape.cx - shape.rx;
        y1 = shape.cy - shape.ry;
        x2 = shape.cx + shape.rx;
        y2 = shape.cy + shape.ry;
    }

    const handleTkinterCoordChange = (coord: 'x1' | 'y1' | 'x2' | 'y2', value: number) => {
        if (shape.type === 'rectangle' || shape.type === 'arc') {
            let { x, y, width, height } = shape;
            switch(coord) {
                case 'x1':
                    width = (x + width) - value;
                    x = value;
                    break;
                case 'y1':
                    height = (y + height) - value;
                    y = value;
                    break;
                case 'x2':
                    width = value - x;
                    break;
                case 'y2':
                    height = value - y;
                    break;
            }
            if (width >= 0 && height >= 0) {
                 updateShape({ ...shape, x, y, width, height });
            }
        } else if (shape.type === 'ellipse') {
            let currentX1 = shape.cx - shape.rx;
            let currentY1 = shape.cy - shape.ry;
            let currentX2 = shape.cx + shape.rx;
            let currentY2 = shape.cy + shape.ry;

            switch(coord) {
                case 'x1': currentX1 = value; break;
                case 'y1': currentY1 = value; break;
                case 'x2': currentX2 = value; break;
                case 'y2': currentY2 = value; break;
            }

            const newCx = (currentX1 + currentX2) / 2;
            const newCy = (currentY1 + currentY2) / 2;
            const newRx = (currentX2 - currentX1) / 2;
            const newRy = (currentY2 - currentY1) / 2;
            
            if (newRx >= 0 && newRy >= 0) {
                updateShape({ ...shape, cx: newCx, cy: newCy, rx: newRx, ry: newRy });
            }
        }
    };

    return (
        <div className="space-y-2">
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-x1`} title={t('prop.title.tkX1')}>x1:</Label>
                <NumberInput id={`${shape.id}-tk-x1`} value={roundFn(x1)} onChange={v => handleTkinterCoordChange('x1', v)} smartRound={false} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-y1`} title={t('prop.title.tkY1')}>y1:</Label>
                <NumberInput id={`${shape.id}-tk-y1`} value={roundFn(y1)} onChange={v => handleTkinterCoordChange('y1', v)} smartRound={false} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-x2`} title={t('prop.title.tkX2')}>x2:</Label>
                <NumberInput id={`${shape.id}-tk-x2`} value={roundFn(x2)} onChange={v => handleTkinterCoordChange('x2', v)} smartRound={false} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-y2`} title={t('prop.title.tkY2')}>y2:</Label>
                <NumberInput id={`${shape.id}-tk-y2`} value={roundFn(y2)} onChange={v => handleTkinterCoordChange('y2', v)} smartRound={false} />
            </InputWrapper>
        </div>
    );
};

const isCollapsible = (shape: Shape | null): boolean => {
    if (!shape) return false;
    return ['line', 'pencil', 'polyline', 'bezier'].includes(shape.type);
};

const PropertyEditor: React.FC<PropertyEditorProps> = ({ selectedShapes, allShapes, updateShape, updateShapes, deleteShape, duplicateShape, activeTool, activePointIndex, setActivePointIndex, deletePoint, addPoint, convertToPath, showNotification, setShapePreview, cancelShapePreview, fillColor, strokeColor }) => {
  const selectedShape = selectedShapes.length === 1 ? selectedShapes[0] : null;
  const isMultiSelection = selectedShapes.length > 1;
  const [systemFonts, setSystemFonts] = useState<string[] | null>(null);
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const { t } = useLanguage();
  
  const tkFonts = ["TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"];
  const standardWebFonts = {
    [t('fonts.sans')]: ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"],
    [t('fonts.serif')]: ["Times New Roman", "Georgia", "Garamond"],
    [t('fonts.mono')]: ["Courier New", "Consolas", "Lucida Console", "Monaco"],
    [t('fonts.decorative')]: ["Impact", "Comic Sans MS", "Brush Script MT"]
  };
  const allStandardFonts = [...Object.values(standardWebFonts).flat(), ...tkFonts].sort((a,b) => a.localeCompare(b));

  const roundToHundredths = (num: number): number => Math.round(num * 100) / 100;

  const visualBounds = React.useMemo(() => {
    if (!selectedShape) return null;
    return getVisualBoundingBox(selectedShape, undefined, allShapes);
  }, [selectedShape, allShapes]);
  
  const geometricBounds = React.useMemo(() => {
    if (!selectedShape) return null;
    return getBoundingBox({ ...selectedShape, rotation: 0 });
  }, [selectedShape]);
  
    const handleVisualPosChange = (axis: 'x' | 'y', value: number) => {
        if (!selectedShape || !visualBounds) return;
        const oldVisualPos = axis === 'x' ? visualBounds.x : visualBounds.y;
        const delta = value - oldVisualPos;

        const deltaX = (axis === 'x') ? delta : 0;
        const deltaY = (axis === 'y') ? delta : 0;

        let newShape = { ...selectedShape };

        switch (newShape.type) {
            case 'rectangle':
            case 'triangle':
            case 'right-triangle':
            case 'rhombus':
            case 'trapezoid':
            case 'parallelogram':
            case 'arc':
            case 'text':
            case 'image':
            case 'bitmap':
                (newShape as any).x += deltaX;
                (newShape as any).y += deltaY;
                break;
            case 'ellipse':
            case 'polygon':
            case 'star':
                (newShape as any).cx += deltaX;
                (newShape as any).cy += deltaY;
                break;
            case 'line':
            case 'bezier':
            case 'pencil': 
            case 'polyline':
                (newShape as any).points = newShape.points.map((p: {x:number,y:number}) => ({ x: p.x + deltaX, y: p.y + deltaY }));
                break;
        }
        updateShape(newShape);
    };
    
    const updateGeometricSize = (axis: 'width' | 'height', value: number) => {
        if (!selectedShape || !geometricBounds) return;

        const oldValue = axis === 'width' ? geometricBounds.width : geometricBounds.height;
        const center = getShapeCenter(selectedShape);
        if (!center) return;

        let newShape: Shape = { ...selectedShape };
        const isAspectRatioLocked = 'isAspectRatioLocked' in selectedShape && selectedShape.isAspectRatioLocked;

        if (oldValue === 0 && value > 0) {
            switch (newShape.type) {
                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'image': case 'bitmap': {
                    const currentWidth = (newShape as any).width;
                    const currentHeight = (newShape as any).height;
                    const newWidth = (axis === 'width') ? value : (isAspectRatioLocked ? value : currentWidth);
                    const newHeight = (axis === 'height') ? value : (isAspectRatioLocked ? value : currentHeight);
                    (newShape as any).x = center.x - newWidth / 2;
                    (newShape as any).y = center.y - newHeight / 2;
                    (newShape as any).width = newWidth;
                    (newShape as any).height = newHeight;
                    break;
                }
                case 'ellipse': {
                    const currentRx = (newShape as any).rx;
                    const currentRy = (newShape as any).ry;
                    (newShape as any).rx = (axis === 'width') ? value / 2 : (isAspectRatioLocked ? value / 2 : currentRx);
                    (newShape as any).ry = (axis === 'height') ? value / 2 : (isAspectRatioLocked ? value / 2 : currentRy);
                    break;
                }
                 case 'text': {
                    const textBbox = getTextBoundingBox(newShape as TextShape);
                    if (!textBbox || textBbox.height === 0 || textBbox.width === 0) break;
                    const scale = value / (axis === 'width' ? textBbox.width : textBbox.height);
                    (newShape as TextShape).fontSize *= scale;
                    break;
                }
            }
        } else {
            if (oldValue <= 0) return;
            let scaleX = 1;
            let scaleY = 1;
            if (axis === 'width') {
                scaleX = value / oldValue;
                if (isAspectRatioLocked) scaleY = scaleX;
            } else {
                scaleY = value / oldValue;
                if (isAspectRatioLocked) scaleX = scaleY;
            }

            switch (newShape.type) {
                case 'rectangle': case 'triangle': case 'right-triangle': case 'rhombus': case 'trapezoid': case 'parallelogram': case 'arc': case 'image': case 'bitmap': {
                    const newWidth = newShape.width * scaleX;
                    const newHeight = newShape.height * scaleY;
                    newShape.x = center.x - newWidth / 2;
                    newShape.y = center.y - newHeight / 2;
                    newShape.width = newWidth;
                    newShape.height = newHeight;
                    break;
                }
                case 'ellipse': {
                    newShape.rx *= scaleX;
                    newShape.ry *= scaleY;
                    break;
                }
                case 'polygon': case 'star': {
                    const scale = (isAspectRatioLocked || axis !== 'height') ? scaleX : scaleY;
                    newShape.radius *= scale;
                    if (newShape.innerRadius !== undefined) newShape.innerRadius *= scale;
                    break;
                }
                case 'text': {
                    const scale = (isAspectRatioLocked || axis !== 'height') ? scaleX : scaleY;
                    newShape.fontSize *= scale;
                    break;
                }
                case 'line': case 'pencil': case 'polyline': case 'bezier': {
                    (newShape as any).points = newShape.points.map((p: any) => ({
                        x: center.x + (p.x - center.x) * scaleX,
                        y: center.y + (p.y - center.y) * scaleY,
                    }));
                    break;
                }
            }
        }
        updateShape(newShape as Shape);
    };

  const handlePointsChange = (newPoints: {x:number, y:number}[]) => {
    if (!selectedShape) return;

    if (selectedShape.type === 'polyline' || selectedShape.type === 'bezier' || selectedShape.type === 'pencil' || selectedShape.type === 'line') {
        updateShape({ ...selectedShape, points: newPoints as any });
    } else {
        const editablePoints = getFinalPoints(selectedShape);
        if (!editablePoints) return;
        
        const newPolyline: PolylineShape = {
            id: selectedShape.id,
            name: selectedShape.name,
            type: 'polyline',
            points: newPoints,
            isClosed: true,
            rotation: 0, 
            state: selectedShape.state,
            stroke: selectedShape.stroke,
            strokeWidth: selectedShape.strokeWidth,
            fill: 'fill' in selectedShape && typeof selectedShape.fill === 'string' ? selectedShape.fill : 'none',
            joinstyle: 'joinstyle' in selectedShape && typeof (selectedShape as any).joinstyle === 'string' ? (selectedShape as any).joinstyle : 'miter',
            smooth: 'smooth' in selectedShape && typeof (selectedShape as any).smooth === 'boolean' ? (selectedShape as any).smooth : undefined,
            dash: 'dash' in selectedShape ? (selectedShape as any).dash : undefined,
            dashoffset: 'dashoffset' in selectedShape ? (selectedShape as any).dashoffset : undefined,
            isAspectRatioLocked: 'isAspectRatioLocked' in selectedShape ? (selectedShape as any).isAspectRatioLocked : false,
        };
        updateShape(newPolyline);
    }
  };

  const handleLoadSystemFonts = async () => {
    if (!('queryLocalFonts' in window)) {
        showNotification(t('fonts.error.notSupported'), 'error', 5000);
        setSystemFonts([]);
        return;
    }

    try {
        setIsLoadingFonts(true);
        const availableFonts = await window.queryLocalFonts();
        
        if (availableFonts.length === 0) {
            showNotification(t('fonts.error.notFound'), 'info', 4000);
            setSystemFonts([]);
            return;
        }

        const fontFamilies = new Set<string>();
        for (const fontData of availableFonts) {
            fontFamilies.add(fontData.family);
        }
        
        const standardFontsSet = new Set(allStandardFonts);
        const uniqueSystemFonts = Array.from(fontFamilies).filter(f => !standardFontsSet.has(f));
        
        setSystemFonts(uniqueSystemFonts.sort((a, b) => a.localeCompare(b)));

        if (uniqueSystemFonts.length > 0) {
            showNotification(t('fonts.success.loaded').replace('{count}', uniqueSystemFonts.length.toString()), 'info');
        } else {
            showNotification(t('fonts.success.noNew'), 'info');
        }

    } catch (err) {
        console.error(t('fonts.error.loading'), err);
        setSystemFonts([]);
        
        let errorMessage = t('fonts.error.details');
        let duration = 5000;

        const errorString = (err instanceof Error) ? err.toString() : String(err);

        if (errorString.includes('disallowed by Permissions Policy') || (err instanceof DOMException && err.name === 'SecurityError')) {
            errorMessage = t('fonts.error.blocked');
            duration = 6000;
        } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
            errorMessage = t('fonts.error.denied');
        }

        showNotification(errorMessage, 'error', duration);
    } finally {
        setIsLoadingFonts(false);
    }
  };

    const handleFontChange = async (value: string) => {
        if (!selectedShape || selectedShape.type !== 'text') return;
        
        if (value === 'load-system-fonts') {
            await handleLoadSystemFonts();
            return;
        }
        
        updateShape({ ...selectedShape, font: value });
    };

    const canConvertToPath = React.useMemo(() => {
        if (!selectedShape) return false;
        return ['rectangle', 'ellipse', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'polygon', 'star', 'arc'].includes(selectedShape.type);
    }, [selectedShape]);

  const renderShapeProperties = () => {
    if (!selectedShape || !visualBounds) return null;

    const commonProperties = (
      <>
        <InputWrapper>
            <Label htmlFor={`${selectedShape.id}-state`} title={t('prop.title.state')}>{t('props.state')}:</Label>
            <Select id={`${selectedShape.id}-state`} value={selectedShape.state} onChange={v => updateShape({ ...selectedShape, state: v as Shape['state'] })}>
                <option value="normal">{t('props.state.normal')}</option>
                <option value="hidden">{t('props.state.hidden')}</option>
                <option value="disabled">{t('props.state.disabled')}</option>
            </Select>
        </InputWrapper>
      </>
    );
    
    const joinStyleControls = (shape: JoinableShape) => {
      // Don't show joinstyle for closed polylines that are axis-aligned rectangles.
      if (shape.type === 'polyline' && shape.isClosed && isCollapsible(shape)) return null;
      
      return (
        <>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-joinstyle`} title={t('prop.title.joinstyle')}>{t('props.joinstyle')}:</Label>
                <Select id={`${shape.id}-joinstyle`} value={shape.joinstyle ?? 'miter'} onChange={v => updateShape({ ...shape, joinstyle: v as JoinStyle })} title={t('prop.title.joinstyleDesc')}>
                    <option value="miter">{t('props.joinstyle.miter')}</option>
                    <option value="round">{t('props.joinstyle.round')}</option>
                    <option value="bevel">{t('props.joinstyle.bevel')}</option>
                </Select>
            </InputWrapper>
        </>
      );
    };
    
    const lineLikeControls = (shape: LineShape | BezierCurveShape | PolylineShape | PathShape) => {
        const isClosed = (shape.type === 'polyline' || shape.type === 'bezier') && shape.isClosed;
        if (isClosed) return null;

        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        const [d1m, d2m, d3m] = shape.arrowshape ?? [8, 10, 3];

        const handleArrowChange = (index: number, absoluteValue: number) => {
            if (strokeWidth === 0) return;
            const newMultipliers = [...(shape.arrowshape ?? [8, 10, 3])];
            const newMultiplier = absoluteValue / strokeWidth;
            newMultipliers[index] = parseFloat(newMultiplier.toFixed(2));
            updateShape({ ...shape, arrowshape: newMultipliers as [number, number, number] });
        };
        
        return (
            <>
                <hr className="border-[var(--border-secondary)] my-2" />
                <InputWrapper>
                    <Label htmlFor={`${shape.id}-capstyle`} title={t('prop.title.capstyle')}>{t('props.capstyle')}:</Label>
                    <Select id={`${shape.id}-capstyle`} value={shape.capstyle ?? 'round'} onChange={v => updateShape({ ...shape, capstyle: v as any })} title={t('prop.title.capstyleDesc')}>
                        <option value="butt">{t('props.capstyle.butt')}</option>
                        <option value="round">{t('props.capstyle.round')}</option>
                        <option value="projecting">{t('props.capstyle.projecting')}</option>
                    </Select>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${shape.id}-arrow`} title={t('prop.title.addArrows')}>{t('props.arrow')}:</Label>
                    <Select id={`${shape.id}-arrow`} value={shape.arrow ?? 'none'} onChange={v => {
                        const newShape = {...shape, arrow: v as any};
                        if (v !== 'none' && !shape.arrowshape) {
                            newShape.arrowshape = [8, 10, 3]; // Standard Tkinter defaults
                        }
                        updateShape(newShape);
                    }} title={t('prop.title.arrowDesc')}>
                        <option value="none">{t('props.arrow.none')}</option>
                        <option value="first">{t('props.arrow.first')}</option>
                        <option value="last">{t('props.arrow.last')}</option>
                        <option value="both">{t('props.arrow.both')}</option>
                    </Select>
                </InputWrapper>
                {shape.arrow && shape.arrow !== 'none' && (
                    <div className="space-y-2 pl-4 border-l-2 border-[var(--border-secondary)] ml-2 mt-2 pt-2">
                        <InputWrapper><Label htmlFor={`${shape.id}-arrow-d1`} title={t('prop.title.arrowTipOffset')}>"{t('props.arrowTipOffset')}"</Label><NumberInput id={`${shape.id}-arrow-d1`} value={roundToHundredths(d1m * strokeWidth)} onChange={v => handleArrowChange(0, v)} min={0} smartRound={false} /></InputWrapper>
                        <InputWrapper><Label htmlFor={`${shape.id}-arrow-d2`} title={t('prop.title.arrowWingsOffset')}>"{t('props.arrowWingsOffset')}"</Label><NumberInput id={`${shape.id}-arrow-d2`} value={roundToHundredths(d2m * strokeWidth)} onChange={v => handleArrowChange(1, v)} min={0} smartRound={false} /></InputWrapper>
                        <InputWrapper><Label htmlFor={`${shape.id}-arrow-d3`} title={t('prop.title.arrowWingWidth')}>"{t('props.arrowWingWidth')}"</Label><NumberInput id={`${shape.id}-arrow-d3`} value={roundToHundredths(d3m * strokeWidth)} onChange={v => handleArrowChange(2, v)} min={0} smartRound={false} /></InputWrapper>
                    </div>
                )}
            </>
        )
    };
    
    switch (selectedShape.type) {
        case 'rectangle': {
            const rect = selectedShape as RectangleShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={rect} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={rect} updateShape={updateShape} />
                <StrokeControls shape={rect} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(rect)}
            </>;
        }
        case 'ellipse': {
             const ellipse = selectedShape as EllipseShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={ellipse} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={ellipse} updateShape={updateShape} />
                <StrokeControls shape={ellipse} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
            </>;
        }
        case 'polygon':
        case 'star': {
            const poly = selectedShape as PolygonShape;
            const sideLength = getPolygonSideLength(poly);
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${poly.id}-sides`} title={t('prop.title.sides')}>{t('prop.sides')}:</Label><NumberInput id={`${poly.id}-sides`} value={poly.sides} onChange={v => updateShape({ ...poly, sides: v })} min={3} /></InputWrapper>
                {poly.type === 'star' && <InputWrapper><Label htmlFor={`${poly.id}-inner-radius`} title={t('prop.title.innerRadius')}>"{t('props.innerRadius')}"</Label><NumberInput id={`${poly.id}-inner-radius`} value={roundToHundredths(poly.innerRadius ?? 0)} onChange={v => updateShape({ ...poly, innerRadius: v })} min={0} smartRound={false} /></InputWrapper>}
                <InputWrapper><Label htmlFor={`${poly.id}-side-length`} title={t('prop.title.sideLength')}>"{t('props.sideLength')}"</Label><NumberInput id={`${poly.id}-side-length`} value={roundToHundredths(sideLength)} onChange={v => updateShape({ ...poly, radius: getPolygonRadiusFromSideLength({ sideLength: v, sides: poly.sides }) })} smartRound={false} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={poly} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={poly} updateShape={updateShape} />
                <StrokeControls shape={poly} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(poly)}
            </>;
        }
         case 'triangle': {
            const triangle = selectedShape as IsoscelesTriangleShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${triangle.id}-top-offset`} title={t('prop.title.topOffset')}>"{t('props.topOffset')}"</Label><NumberInput id={`${triangle.id}-top-offset`} value={roundToHundredths(triangle.topVertexOffset ?? 0)} onChange={v => updateShape({ ...triangle, topVertexOffset: v })} step={0.01} smartRound={false} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={triangle} updateShape={updateShape} />
                <StrokeControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(triangle)}
            </>;
        }
        case 'right-triangle': {
             const triangle = selectedShape as RightTriangleShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={triangle} updateShape={updateShape} />
                <StrokeControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(triangle)}
            </>;
        }
        case 'rhombus': {
             const rhombus = selectedShape as RhombusShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={rhombus} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={rhombus} updateShape={updateShape} />
                <StrokeControls shape={rhombus} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(rhombus)}
            </>;
        }
        case 'trapezoid': {
             const trapezoid = selectedShape as TrapezoidShape;
             const handleOffsetChange = (side: 'left' | 'right', v_percent: number) => {
                let newRatio = v_percent / 100;
                const updates: Partial<TrapezoidShape> = {};

                if (trapezoid.isSymmetrical) {
                    if (newRatio >= 0.5) newRatio = 0.49;
                    updates.topLeftOffsetRatio = newRatio;
                    updates.topRightOffsetRatio = newRatio;
                } else {
                    if (side === 'left') {
                        if (newRatio > 0.99 - trapezoid.topRightOffsetRatio) {
                            newRatio = 0.99 - trapezoid.topRightOffsetRatio;
                        }
                        updates.topLeftOffsetRatio = newRatio;
                    } else { // 'right'
                        if (newRatio > 0.99 - trapezoid.topLeftOffsetRatio) {
                            newRatio = 0.99 - trapezoid.topLeftOffsetRatio;
                        }
                        updates.topRightOffsetRatio = newRatio;
                    }
                }
                updateShape({ ...trapezoid, ...updates });
            };
            const handleSymmetricalChange = (checked: boolean) => {
                const newShape = { ...trapezoid, isSymmetrical: checked };
                if (checked) {
                    let avgRatio = (newShape.topLeftOffsetRatio + newShape.topRightOffsetRatio) / 2;
                    if (avgRatio >= 0.5) {
                        avgRatio = 0.49;
                    }
                    newShape.topLeftOffsetRatio = avgRatio;
                    newShape.topRightOffsetRatio = avgRatio;
                }
                updateShape(newShape);
            };
            return <>
                {commonProperties}
                 <InputWrapper>
                    <Checkbox id={`${trapezoid.id}-symm`} checked={!!trapezoid.isSymmetrical} onChange={handleSymmetricalChange} label={t('props.symmetric')} title={t('prop.title.symmetric')}/>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${trapezoid.id}-topleft`} title={t('prop.title.offsetL')}>"{t('props.offsetL')}"</Label><NumberInput id={`${trapezoid.id}-topleft`} value={roundToHundredths(trapezoid.topLeftOffsetRatio * 100)} onChange={v => handleOffsetChange('left', v)} smartRound={false} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${trapezoid.id}-topright`} title={t('prop.title.offsetR')}>"{t('props.offsetR')}"</Label><NumberInput id={`${trapezoid.id}-topright`} value={roundToHundredths(trapezoid.topRightOffsetRatio * 100)} onChange={v => handleOffsetChange('right', v)} disabled={!!trapezoid.isSymmetrical} smartRound={false} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={trapezoid} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={trapezoid} updateShape={updateShape} />
                <StrokeControls shape={trapezoid} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(trapezoid)}
            </>;
        }
        case 'parallelogram': {
             const parallelogram = selectedShape as ParallelogramShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${parallelogram.id}-angle`} title={t('prop.title.angle')}>"{t('props.angle')}"</Label><NumberInput id={`${parallelogram.id}-angle`} value={roundToHundredths(parallelogram.angle)} onChange={v => updateShape({ ...parallelogram, angle: v })} min={1} max={179} smartRound={false} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={parallelogram} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={parallelogram} updateShape={updateShape} />
                <StrokeControls shape={parallelogram} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(parallelogram)}
            </>;
        }
        case 'line': {
            const line = selectedShape as LineShape;
            return <>
                {commonProperties}
                <div>
                    <Label htmlFor={`${line.id}-stroke`} title={t('prop.title.color')}>{t('prop.color')}:</Label>
                    <div className="mt-1">
                        <ColorInput 
                            id={`${line.id}-stroke`} 
                            value={line.stroke} 
                            onChange={v => updateShape({ ...line, stroke: v })} 
                            onPreview={v => setShapePreview(line.id, { stroke: v ?? undefined })} 
                            onCancel={cancelShapePreview} 
                            showNotification={showNotification}
                        />
                    </div>
                </div>
                <InputWrapper><Label htmlFor={`${line.id}-stroke-width`} title={t('prop.title.width')}>{t('prop.width')}:</Label><NumberInput id={`${line.id}-stroke-width`} value={roundToHundredths(line.strokeWidth)} onChange={v => updateShape({ ...line, strokeWidth: v })} min={0} smartRound={false} /></InputWrapper>
                <DashControls shape={line} updateShape={updateShape} roundFn={roundToHundredths} />
                {lineLikeControls(line)}
            </>;
        }
        case 'pencil': {
            const path = selectedShape as PathShape;
            return <>
                {commonProperties}
                <div>
                    <Label htmlFor={`${path.id}-stroke`} title={t('prop.title.color')}>{t('prop.color')}:</Label>
                    <div className="mt-1">
                        <ColorInput 
                            id={`${path.id}-stroke`} 
                            value={path.stroke} 
                            onChange={v => updateShape({ ...path, stroke: v })} 
                            onPreview={v => setShapePreview(path.id, { stroke: v ?? undefined })} 
                            onCancel={cancelShapePreview} 
                            showNotification={showNotification}
                        />
                    </div>
                </div>
                <InputWrapper><Label htmlFor={`${path.id}-stroke-width`} title={t('prop.title.width')}>{t('prop.width')}:</Label><NumberInput id={`${path.id}-stroke-width`} value={roundToHundredths(path.strokeWidth)} onChange={v => updateShape({ ...path, strokeWidth: v })} min={0} smartRound={false} /></InputWrapper>
                <DashControls shape={path} updateShape={updateShape} roundFn={roundToHundredths} />
                {joinStyleControls(path)}
                {lineLikeControls(path)}
            </>;
        }
        case 'polyline': {
            const polyline = selectedShape as PolylineShape;
            return <>
                {commonProperties}
                <InputWrapper>
                    <Checkbox id={`${polyline.id}-isClosed`} checked={polyline.isClosed} onChange={c => updateShape({ ...polyline, isClosed: c, name: getDefaultNameForShape({ ...polyline, isClosed: c }, t) })} label={t('props.closed')} title={t('prop.title.connectEnds')}/>
                </InputWrapper>
                <InputWrapper>
                    <Checkbox id={`${polyline.id}-smooth`} checked={!!polyline.smooth} onChange={c => updateShape({ ...polyline, smooth: c })} label={t('props.smooth')} title={t('prop.title.smooth')}/>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${polyline.id}-splinesteps`} title={t('prop.title.splinesteps')}>{t('props.splinesteps')}:</Label>
                    <NumberInput 
                        id={`${polyline.id}-splinesteps`} 
                        value={polyline.splinesteps ?? 12} 
                        onChange={v => updateShape({ ...polyline, splinesteps: v })} 
                        min={1} 
                        max={100} 
                        disabled={!polyline.smooth} 
                    />
                </InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={polyline} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={polyline} updateShape={updateShape} />
                <StrokeControls shape={polyline} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(polyline)}
                {lineLikeControls(polyline)}
            </>;
        }
        case 'bezier': {
            const bezier = selectedShape as BezierCurveShape;
            return <>
                {commonProperties}
                <InputWrapper>
                    <Checkbox id={`${bezier.id}-isClosed`} checked={bezier.isClosed} onChange={c => updateShape({ ...bezier, isClosed: c, name: getDefaultNameForShape({ ...bezier, isClosed: c }, t) })} label={t('props.closed')} title={t('prop.title.connectEnds')}/>
                </InputWrapper>
                <InputWrapper>
                    <Checkbox id={`${bezier.id}-smooth`} checked={!!bezier.smooth} onChange={c => updateShape({ ...bezier, smooth: c })} label={t('props.smooth')} title={t('prop.title.smooth')}/>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${bezier.id}-splinesteps`} title={t('prop.title.splinesteps')}>{t('props.splinesteps')}:</Label>
                    <NumberInput id={`${bezier.id}-splinesteps`} value={bezier.splinesteps} onChange={v => updateShape({ ...bezier, splinesteps: v })} min={1} max={100} disabled={!bezier.smooth} />
                </InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={bezier} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={bezier} updateShape={updateShape} />
                <StrokeControls shape={bezier} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
                {joinStyleControls(bezier)}
                {lineLikeControls(bezier)}
            </>;
        }
        case 'arc': {
            const arc = selectedShape as ArcShape;
            const endAngle = arc.start + arc.extent;

            const handleStartChange = (v: number) => {
                if (arc.isExtentLocked) {
                    updateShape({ ...arc, start: v });
                } else {
                    const newExtent = endAngle - v;
                    updateShape({ ...arc, start: v, extent: newExtent });
                }
            };
            const handleEndChange = (v: number) => {
                if (arc.isExtentLocked) {
                    const newStart = v - arc.extent;
                    updateShape({ ...arc, start: newStart });
                } else {
                    const newExtent = v - arc.start;
                    updateShape({ ...arc, extent: newExtent });
                }
            };

            return <>
                {commonProperties}
                <InputWrapper>
                    <Label htmlFor={`${arc.id}-style`} title={t('prop.title.arcStyle')}>{t('props.style')}</Label>
                    <Select id={`${arc.id}-style`} value={arc.style} onChange={v => {
                        const newName = getDefaultNameForShape({ ...arc, style: v as any }, t);
                        updateShape({ ...arc, style: v as any, name: newName });
                    }}>
                        <option value="pieslice">{t('tool.pieslice')}</option>
                        <option value="chord">{t('tool.chord')}</option>
                        <option value="arc">{t('tool.arc')}</option>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${arc.id}-start`} title={t('prop.title.startAngle')}>{t('props.startAngle')}</Label><NumberInput id={`${arc.id}-start`} value={roundToHundredths(arc.start)} onChange={handleStartChange} smartRound={false} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${arc.id}-end`} title={t('prop.title.endAngle')}>{t('props.endAngle')}</Label><NumberInput id={`${arc.id}-end`} value={roundToHundredths(endAngle)} onChange={handleEndChange} smartRound={false} /></InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${arc.id}-extent`} title={t('prop.title.extent')}>{t('props.extent')}</Label>
                    <NumberInput id={`${arc.id}-extent`} value={roundToHundredths(arc.extent)} onChange={v => updateShape({ ...arc, extent: v })} disabled={arc.isExtentLocked} smartRound={false} />
                </InputWrapper>
                 <InputWrapper>
                    <Label htmlFor={`${arc.id}-extent-lock`} />
                    <Checkbox id={`${arc.id}-extent-lock`} checked={!!arc.isExtentLocked} onChange={c => updateShape({ ...arc, isExtentLocked: c })} label={t('props.lockExtent')} title={t('prop.title.lockExtent')}/>
                </InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <FillControls shape={arc} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} fillColor={fillColor} showNotification={showNotification} />
                <StippleControls shape={arc} updateShape={updateShape} />
                <StrokeControls shape={arc} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} strokeColor={strokeColor} showNotification={showNotification} />
            </>;
        }
        case 'text': {
            const text = selectedShape as TextShape;
            const anchorNames = {
                'nw': t('props.anchor.nw'), 'n': t('props.anchor.n'), 'ne': t('props.anchor.ne'),
                'w': t('props.anchor.w'), 'center': t('props.anchor.center'), 'e': t('props.anchor.e'),
                'sw': t('props.anchor.sw'), 's': t('props.anchor.s'), 'se': t('props.anchor.se')
            };
            return <>
                {commonProperties}
                <InputWrapper>
                    <Label htmlFor={`${text.id}-text`} title={t('prop.title.text')}>{t('tool.text')}:</Label>
                    <TextArea id={`${text.id}-text`} value={text.text} onChange={v => updateShape({ ...text, text: v })} />
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-font`} title={t('prop.title.font')}>{t('prop.font')}:</Label>
                    <Select id={`${text.id}-font`} value={text.font} onChange={handleFontChange}>
                        {Object.entries(standardWebFonts).map(([group, fonts]) => (
                            <optgroup label={group} key={group}>
                                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                        ))}
                        {systemFonts && systemFonts.length > 0 && (
                             <optgroup label={t('props.fonts.system')}>
                                {systemFonts.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                        )}
                        <optgroup label={t('props.fonts.tk')}>
                            {tkFonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </optgroup>
                         <optgroup label={t('props.actions')}>
                            <option value="load-system-fonts" disabled={isLoadingFonts}>{isLoadingFonts ? t('props.fonts.loading') : t('props.fonts.load')}</option>
                        </optgroup>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-fontSize`} title={t('prop.title.fontSize')}>{t('prop.size')}:</Label><NumberInput id={`${text.id}-fontSize`} value={roundToHundredths(text.fontSize)} onChange={v => updateShape({ ...text, fontSize: v })} min={1} smartRound={false} /></InputWrapper>
                
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('prop.fill')}</h3>
                <div>
                    <Label htmlFor={`${text.id}-fill`} title={t('prop.title.textColor')}>{t('prop.color')}:</Label>
                    <div className="mt-1">
                        <ColorInput 
                            id={`${text.id}-fill`} 
                            value={text.fill} 
                            onChange={v => updateShape({ ...text, fill: v })} 
                            onPreview={v => setShapePreview(text.id, { fill: v ?? undefined })}
                            onCancel={cancelShapePreview}
                            showNotification={showNotification}
                        />
                    </div>
                </div>
                <StippleControls shape={text} updateShape={updateShape} />

                <InputWrapper>
                    <Label htmlFor={`${text.id}-style`} title={t('prop.title.textStyle')}>{t('props.style')}</Label>
                    <div className="flex-1 flex flex-col gap-2">
                        <Checkbox id={`${text.id}-bold`} checked={text.weight === 'bold'} onChange={c => updateShape({ ...text, weight: c ? 'bold' : 'normal' })} label={t('style.bold')} />
                        <Checkbox id={`${text.id}-italic`} checked={text.slant === 'italic'} onChange={c => updateShape({ ...text, slant: c ? 'italic' : 'roman' })} label={t('style.italic')} />
                        <Checkbox id={`${text.id}-underline`} checked={text.underline} onChange={c => updateShape({ ...text, underline: c })} label={t('style.underline')} />
                        <Checkbox id={`${text.id}-overstrike`} checked={text.overstrike} onChange={c => updateShape({ ...text, overstrike: c })} label={t('style.strikethrough')} />
                    </div>
                </InputWrapper>
                 <hr className="border-[var(--border-secondary)] my-2" />
                <InputWrapper><Label htmlFor={`${text.id}-anchor`} title={t('prop.title.anchor')}>{t('props.anchor')}</Label>
                    <Select
                        id={`${text.id}-anchor`}
                        value={text.anchor}
                        onChange={v => {
                            updateShape({ ...text, anchor: v as TextShape['anchor'] });
                        }}
                    >
                        {Object.entries(anchorNames).map(([key, name]) => (
                            <option key={key} value={key}>{name}</option>
                        ))}
                    </Select>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-anchor-x`} title={t('prop.title.anchorX')}>{t('props.anchorX')}</Label>
                    <NumberInput id={`${text.id}-anchor-x`} value={roundToHundredths(text.x)} onChange={v => updateShape({ ...text, x: v })} smartRound={false} />
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-anchor-y`} title={t('prop.title.anchorY')}>{t('props.anchorY')}</Label>
                    <NumberInput id={`${text.id}-anchor-y`} value={roundToHundredths(text.y)} onChange={v => updateShape({ ...text, y: v })} smartRound={false} />
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-justify`} title={t('prop.title.justify')}>{t('props.justify')}</Label>
                    <Select id={`${text.id}-justify`} value={text.justify} onChange={v => updateShape({ ...text, justify: v as any })}>
                        <option value="left">{t('align.left')}</option><option value="center">{t('align.center')}</option><option value="right">{t('align.right')}</option>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-width`} title={t('prop.title.blockWidth')}>{t('props.blockWidth')}</Label><NumberInput id={`${text.id}-width`} value={roundToHundredths(text.width)} onChange={v => updateShape({ ...text, width: v })} min={0} /></InputWrapper>
            </>;
        }
        case 'image': {
            const image = selectedShape as ImageShape;
            return <>{commonProperties}</>;
        }
        case 'bitmap': {
            const bitmap = selectedShape as BitmapShape;
            const bitmapTypes: BuiltInBitmap[] = ['error', 'gray75', 'gray50', 'gray25', 'gray12', 'hourglass', 'info', 'questhead', 'question', 'warning'];
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${bitmap.id}-type`} title={t('prop.title.bitmapType')}>{t('props.bitmapType')}</Label>
                    <Select id={`${bitmap.id}-type`} value={bitmap.bitmapType} onChange={v => updateShape({ ...bitmap, bitmapType: v as any })}>
                        {bitmapTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                </InputWrapper>
                <div>
                    <Label htmlFor={`${bitmap.id}-fg`} title={t('prop.title.fgColor')}>{t('props.fgColor')}</Label>
                    <div className="mt-1">
                        <ColorInput 
                            id={`${bitmap.id}-fg`} 
                            value={bitmap.foreground} 
                            onChange={v => updateShape({ ...bitmap, foreground: v })} 
                            onPreview={v => setShapePreview(bitmap.id, { foreground: v ?? undefined })}
                            onCancel={cancelShapePreview}
                            showNotification={showNotification}
                        />
                    </div>
                </div>
                <div>
                    <Label htmlFor={`${bitmap.id}-bg`} title={t('prop.title.bgColor')}>{t('props.bgColor')}</Label>
                    <div className="mt-1">
                        <ColorInput 
                            id={`${bitmap.id}-bg`} 
                            value={bitmap.background} 
                            onChange={v => updateShape({ ...bitmap, background: v })}
                            onPreview={v => setShapePreview(bitmap.id, { background: v ?? undefined })}
                            onCancel={cancelShapePreview}
                            showNotification={showNotification}
                        />
                    </div>
                </div>
            </>;
        }
        default:
            return <>
                {commonProperties}
            </>
    }
  }

  if (!selectedShape && !isMultiSelection) {
    return (
      <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)] p-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.title')}</h2>
        </div>
        <div className="flex-grow flex items-center justify-center text-center text-[var(--text-tertiary)]">
          <p className="text-sm">{t('props.empty')}</p>
        </div>
      </div>
    );
  }

  if (isMultiSelection) {
    const handleMultiUpdate = (updates: Partial<Shape>) => {
        if (typeof updateShapes === 'function') {
            const updatedShapes = selectedShapes.map(shape => ({ ...shape, ...updates } as Shape));
            updateShapes(updatedShapes);
        } else {
            selectedShapes.forEach(shape => {
                if (shape) updateShape({ ...shape, ...updates } as Shape);
            });
        }
    };

    const validShapes = selectedShapes.filter(Boolean);
    if (validShapes.length === 0) return null;

    const commonStroke = validShapes.every(s => s.stroke === validShapes[0].stroke) ? validShapes[0].stroke : '';
    const commonStrokeWidth = validShapes.every(s => s.strokeWidth === validShapes[0].strokeWidth) ? validShapes[0].strokeWidth : '';
    const commonState = validShapes.every(s => s.state === validShapes[0].state) ? validShapes[0].state : '';
    
    const hasRotationShapes = validShapes.filter(s => 'rotation' in s);
    const showRotation = hasRotationShapes.length > 0 && hasRotationShapes.length === validShapes.length;
    const commonRotation = showRotation && hasRotationShapes.every(s => (s as any).rotation === (hasRotationShapes[0] as any).rotation) ? (hasRotationShapes[0] as any).rotation : '';

    const hasJoinstyleShapes = validShapes.filter(s => 'joinstyle' in s);
    const showJoinstyle = hasJoinstyleShapes.length > 0 && hasJoinstyleShapes.length === validShapes.length;
    const commonJoinstyle = showJoinstyle && hasJoinstyleShapes.every(s => (s as any).joinstyle === (hasJoinstyleShapes[0] as any).joinstyle) ? (hasJoinstyleShapes[0] as any).joinstyle : '';

    
    // Check if all selected shapes support fill
    const fillableShapes = validShapes.filter(s => s && 'fill' in s) as FillableShape[];
    const showFill = fillableShapes.length > 0 && fillableShapes.length === validShapes.length;
    const commonFill = showFill && fillableShapes.every(s => s.fill === fillableShapes[0].fill) ? fillableShapes[0].fill : '';

    return (
      <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)]">
          <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
              <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.title')} ({selectedShapes.length})</h2>
              <div className="flex items-center gap-1">
                 {/* Tooling for multi-selection can go here */}
              </div>
          </div>
          
          <div className="flex-grow overflow-y-auto px-3 py-2 space-y-3 p-scrollbar">
            <h3 className="font-semibold text-[var(--text-secondary)] text-sm pt-2">{t('props.commonTitle') || 'Спільні властивості'}</h3>
            <div className="space-y-2">
                <InputWrapper>
                    <Label htmlFor="multi-stroke">{t('props.stroke') || 'Контур'}</Label>
                    <ColorInput 
                        id="multi-stroke"
                        value={commonStroke ?? ''} 
                        onChange={(val) => handleMultiUpdate({ stroke: val, _previousStroke: undefined })}
                        onPreview={(val) => selectedShapes.forEach(s => setShapePreview?.(s.id, { stroke: val ?? undefined }))}
                        onCancel={() => cancelShapePreview?.()}
                        placeholder={t('props.mixed') || 'Різні'}
                    />
                </InputWrapper>
                <div className="pl-6 mt-1 flex items-center gap-2">
                    <button 
                        onClick={() => handleMultiUpdate({ stroke: 'none' })}
                        className={`text-xs px-2 py-0.5 rounded ${commonStroke === 'none' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                    >
                        {t('props.none') || 'Немає'}
                    </button>
                    {commonStroke !== 'none' && commonStroke !== '' && (
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: commonStroke }}></div>
                    )}
                </div>

                <InputWrapper>
                    <Label htmlFor="multi-stroke-width">{t('props.strokeWidth') || 'Товщина'}</Label>
                    <div className="relative">
                       <NumberInput 
                           id="multi-stroke-width"
                           value={commonStrokeWidth as any} 
                           onChange={(val) => handleMultiUpdate({ strokeWidth: val })}
                           min={0}
                           placeholder={commonStrokeWidth === '' ? (t('props.mixed') || 'Різні') : undefined}
                       />
                       {commonStrokeWidth === '' && <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">{t('props.mixed') || 'Різні'}</span>}
                    </div>
                </InputWrapper>

                {showFill && (
                    <InputWrapper>
                        <Label htmlFor="multi-fill">{t('props.fill') || 'Заливка'}</Label>
                        <ColorInput 
                            id="multi-fill"
                            value={commonFill ?? ''} 
                            onChange={(val) => handleMultiUpdate({ fill: val })}
                            onPreview={(val) => selectedShapes.forEach(s => setShapePreview?.(s.id, { fill: val ?? undefined }))}
                            onCancel={() => cancelShapePreview?.()}
                            placeholder={t('props.mixed') || 'Різні'}
                        />
                    </InputWrapper>
                )}
                {showFill && (
                    <div className="pl-6 mt-1 flex items-center gap-2">
                        <button 
                            onClick={() => handleMultiUpdate({ fill: 'none' })}
                            className={`text-xs px-2 py-0.5 rounded ${commonFill === 'none' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                        >
                            {t('props.none') || 'Немає'}
                        </button>
                        {commonFill !== 'none' && commonFill !== '' && (
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: commonFill }}></div>
                        )}
                    </div>
                )}
                
                <InputWrapper>
                    <Label htmlFor="multi-state">{t('props.state') || 'Стан'}</Label>
                    <Select id="multi-state" value={commonState} onChange={(val) => handleMultiUpdate({ state: val as any })}>
                        <option value="" disabled hidden>Mixed</option>
                        <option value="normal">{t('props.state.normal') || 'Normal'}</option>
                        <option value="hidden">{t('props.state.hidden') || 'Hidden'}</option>
                        <option value="disabled">{t('props.state.disabled') || 'Disabled'}</option>
                    </Select>
                </InputWrapper>

                {showRotation && (
                     <InputWrapper>
                        <Label htmlFor="multi-rotation">{t('props.rotation')}</Label>
                        <div className="relative">
                            <NumberInput 
                                id="multi-rotation"
                                value={commonRotation as any} 
                                onChange={(val) => handleMultiUpdate({ rotation: val })}
                                placeholder={commonRotation === '' ? 'Mixed' : undefined}
                            />
                            {commonRotation === '' && <span className="absolute left-2 top-1.5 text-xs text-gray-400 pointer-events-none">Mixed</span>}
                        </div>
                    </InputWrapper>
                )}
                
                {showJoinstyle && (
                    <InputWrapper>
                        <Label htmlFor="multi-joinstyle" title={t('prop.title.joinstyleDesc')}>{t('props.joinstyle')}</Label>
                        <Select id="multi-joinstyle" value={commonJoinstyle} onChange={v => handleMultiUpdate({ joinstyle: v as JoinStyle })}>
                            <option value="" disabled hidden>Mixed</option>
                            <option value="miter">{t('props.joinstyle.miter') || 'Miter'}</option>
                            <option value="round">{t('props.joinstyle.round') || 'Round'}</option>
                            <option value="bevel">{t('props.joinstyle.bevel') || 'Bevel'}</option>
                        </Select>
                    </InputWrapper>
                )}
            </div>
          </div>
      </div>
    );
  }

  if (!selectedShape) return null;

  const isEditing = activeTool === 'edit-points';
  const editablePoints = getEditablePoints(selectedShape);
  const showPointsEditor = isEditing && editablePoints && editablePoints.length > 0;
  
  const canLockAspectRatio = 'isAspectRatioLocked' in selectedShape;

  const isTkinterBboxEditable = selectedShape.rotation === 0 && (selectedShape.type === 'rectangle' || selectedShape.type === 'ellipse' || selectedShape.type === 'arc');

  const isShapeClosed = selectedShape ? (
      (selectedShape.type === 'polyline' || selectedShape.type === 'bezier') ? selectedShape.isClosed :
      (selectedShape.type === 'line' || selectedShape.type === 'pencil') ? false :
      (selectedShape.type === 'arc') ? selectedShape.style !== 'arc' :
      true
  ) : false;

  return (
    <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex justify-between items-center p-2 px-3 bg-[var(--bg-app)]/50 rounded-t-lg border-b border-[var(--border-primary)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">{t('props.title')}</h2>
            <div className="flex items-center gap-1">
                {canConvertToPath && <button onClick={() => convertToPath(selectedShape.id)} title={t('menu.object.toPath')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ConvertToPathIcon size={18}/></button>}
                <button onClick={() => duplicateShape(selectedShape.id)} title={t('menu.edit.duplicate')} className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><DuplicateIcon size={18}/></button>
                <button onClick={() => deleteShape(selectedShape.id)} title={t('menu.edit.delete')} className="p-1.5 rounded hover:bg-[var(--destructive-bg)] text-[var(--destructive-text)] hover:text-[var(--accent-text)]"><TrashIcon size={18}/></button>
            </div>
        </div>
        {/* Body */}
        <div className="flex-grow overflow-y-auto p-3 space-y-2">
            <InputWrapper>
                <Label htmlFor={`${selectedShape.id}-name`} title={t('props.nameDesc')}>{t('props.name')}</Label>
                <input
                    id={`${selectedShape.id}-name`}
                    type="text"
                    value={editingName ?? selectedShape.name ?? getDefaultNameForShape(selectedShape, t)}
                    onFocus={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                        if (editingName !== null) {
                            updateShape({ ...selectedShape, name: editingName.trim() === '' ? getDefaultNameForShape(selectedShape, t) : editingName.trim() });
                        }
                        setEditingName(null);
                    }}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                         if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                         if (e.key === 'Escape') { setEditingName(null); (e.target as HTMLInputElement).blur(); }
                    }}
                    className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                />
            </InputWrapper>
            <InputWrapper>
                <Label htmlFor={`${selectedShape.id}-comment`} title={t('props.commentDesc')}>{t('props.comment')}</Label>
                <TextArea
                    id={`${selectedShape.id}-comment`}
                    value={selectedShape.comment ?? ''}
                    onChange={v => updateShape({ ...selectedShape, comment: v })}
                    rows={2}
                    placeholder={t('props.commentPlaceholder')}
                    title={t('props.commentTooltip')}
                />
            </InputWrapper>

             <hr className="border-[var(--border-secondary)] my-2" />
            <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('props.geometry')}</h3>
            <div className="space-y-2">
                {visualBounds && geometricBounds && (
                    <>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-pos-x`} title={t('props.xDesc')}>{t('props.x')}</Label>
                            <NumberInput id={`${selectedShape.id}-pos-x`} value={roundToHundredths(visualBounds.x)} onChange={v => handleVisualPosChange('x', v)} smartRound={false} />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-pos-y`} title={t('prop.title.posY')}>{t('props.y')}</Label>
                            <NumberInput id={`${selectedShape.id}-pos-y`} value={roundToHundredths(visualBounds.y)} onChange={v => handleVisualPosChange('y', v)} smartRound={false} />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-width`} title={t('prop.title.widthGeom')}>{t('props.width')}</Label>
                            <NumberInput 
                                id={`${selectedShape.id}-width`} 
                                value={roundToHundredths(geometricBounds.width)} 
                                onChange={v => updateGeometricSize('width', v)}
                                min={isCollapsible(selectedShape) ? 1 : 0} 
                                smartRound={false}
                            />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-height`} title={t('prop.title.heightGeom')}>{t('props.height')}</Label>
                            <NumberInput 
                                id={`${selectedShape.id}-height`} 
                                value={roundToHundredths(geometricBounds.height)} 
                                onChange={v => updateGeometricSize('height', v)}
                                min={isCollapsible(selectedShape) ? 1 : 0} 
                                smartRound={false}
                            />
                        </InputWrapper>
                        {canLockAspectRatio && (
                            <InputWrapper>
                                <Label htmlFor="lock-aspect-ratio-toggle" />
                                <button onClick={() => updateShape({ ...selectedShape, isAspectRatioLocked: !selectedShape.isAspectRatioLocked })} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title={t('props.lockRatioDesc')}>
                                    {selectedShape.isAspectRatioLocked ? <LockIcon size={16}/> : <UnlockIcon size={16}/>}
                                    <span className="text-sm">{selectedShape.isAspectRatioLocked ? t('props.ratioLocked') : t('props.ratioUnlocked')}</span>
                                </button>
                            </InputWrapper>
                        )}
                        {'rotation' in selectedShape && (
                             <InputWrapper>
                                <Label htmlFor={`${selectedShape.id}-rotation`} title={t('props.rotationDesc')}>{t('props.rotation')}</Label>
                                <NumberInput id={`${selectedShape.id}-rotation`} value={roundToHundredths(selectedShape.rotation)} onChange={v => updateShape({ ...selectedShape, rotation: v })} smartRound={false} />
                            </InputWrapper>
                        )}
                    </>
                )}
            </div>

            {isTkinterBboxEditable && (
                <>
                    <hr className="border-[var(--border-secondary)] my-2" />
                    <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">{t('props.tkinterCoords')}</h3>
                    <TkinterBboxEditor shape={selectedShape as RectangleShape | EllipseShape | ArcShape} updateShape={updateShape} roundFn={roundToHundredths} />
                </>
            )}

            {renderShapeProperties()}

            {showPointsEditor && (
                <PointsEditor
                    points={editablePoints!}
                    onPointsChange={handlePointsChange}
                    shapeId={selectedShape.id}
                    selectedShape={selectedShape}
                    isEditing={isEditing}
                    activePointIndex={activePointIndex}
                    setActivePointIndex={setActivePointIndex}
                    deletePoint={(index) => deletePoint(selectedShape.id, index)}
                    addPoint={(index) => addPoint(selectedShape.id, index)}
                    // FIX: Changed prop assignment from `isShapeClosed={isShapeClosed as any}` to `isShapeClosed={isShapeClosed}` for type safety.
                    isShapeClosed={isShapeClosed}
                    roundFn={roundToHundredths}
                />
            )}
        </div>
    </div>
  );
}

// FIX: Added default export to the `PropertyEditor` component to resolve the module resolution error.
export default PropertyEditor;
