import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Shape, LineShape, BezierCurveShape, PathShape, JoinStyle, PolygonShape, IsoscelesTriangleShape, RhombusShape, ParallelogramShape, TrapezoidShape, PolylineShape, RectangleShape, EllipseShape, Tool, ArcShape, RightTriangleShape, TextShape, ImageShape, BitmapShape, BuiltInBitmap } from '../types';
import { getVisualBoundingBox, getFinalPoints, getPolygonSideLength, getBoundingBox, getPolygonRadiusFromSideLength, getEditablePoints, getShapeCenter, getTextBoundingBox, rotatePoint } from '../lib/geometry';
import { InputWrapper, Label, NumberInput, ColorInput, Checkbox, Select, TextArea, DashSelect } from './FormControls';
import { DuplicateIcon, TrashIcon, LockIcon, UnlockIcon, ConvertToPathIcon, BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './icons';
import { getDefaultNameForShape, TOOL_TYPE_TO_NAME, DASH_STYLES } from '../lib/constants';

interface PropertyEditorProps {
  selectedShape: Shape | null;
  updateShape: (shape: Shape) => void;
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
                <Label htmlFor={`${shape.id}-dash-select`} title="Стиль штрихування лінії.">Штрихування:</Label>
                <DashSelect id={`${shape.id}-dash-select`} value={shape.dash} onChange={handleDashChange} disabled={isStrokeDisabled} isCustom={isCustomDash} />
            </InputWrapper>
            {shape.dash && shape.dash.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-[var(--border-secondary)] ml-2 mt-2 pt-2">
                    <div className="space-y-2">
                        {shape.dash.map((val, index) => (
                            <InputWrapper key={index}>
                                <Label htmlFor={`${shape.id}-dash-${index}`} title={index % 2 === 0 ? `Довжина ${index/2 + 1}-го штриха в пікселях.` : `Довжина ${Math.ceil(index/2)}-го пропуску в пікселях.`}>{index % 2 === 0 ? `Штрих ${index/2+1} (px):` : `Пропуск ${Math.ceil(index/2)} (px):`}</Label>
                                <NumberInput 
                                  id={`${shape.id}-dash-${index}`} 
                                  value={roundFn(val * strokeWidth)} 
                                  onChange={v => handleSegmentChange(index, v)} 
                                  min={0}
                                  disabled={isStrokeDisabled}
                                  title={index % 2 === 0 ? `Довжина штриха в пікселях` : `Довжина пропуску в пікселях`}
                                />
                            </InputWrapper>
                        ))}
                    </div>
                     <div className="flex items-center justify-end gap-2 pt-1">
                        <button 
                          onClick={removeSegment} 
                          disabled={shape.dash.length < 2} 
                          className="px-2 py-1 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--destructive-bg)] rounded-md disabled:opacity-50"
                          title="Видалити останній сегмент (штрих і пропуск)"
                        >-</button>
                        <button 
                          onClick={addSegment} 
                          className="px-2 py-1 text-sm bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] rounded-md"
                          title="Додати сегмент (штрих і пропуск)"
                        >+</button>
                    </div>
                    <InputWrapper>
                        <Label htmlFor={`${shape.id}-dashoffset`} title="Зміщення патерна штрихування вздовж лінії.">Зсув штриха:</Label>
                        <NumberInput 
                          id={`${shape.id}-dashoffset`} 
                          value={roundFn(shape.dashoffset ?? 0)} 
                          onChange={v => updateShape({ ...shape, dashoffset: v })}
                          disabled={isStrokeDisabled}
                          title="Зміщує початок патерна штрихування вздовж лінії"
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

    return (
        <>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-stipple`} title="Патерн для заповнення фігури (працює лише на X11).">Патерн заливки:</Label>
                <Select id={`${shape.id}-stipple`} value={shape.stipple ?? 'none'} onChange={v => updateShape({ ...shape, stipple: v === 'none' ? undefined : v as any })} disabled={!hasFill} title="Вибрати патерн для заповнення фігури.">
                    <option value="none">Немає</option>
                    <option value="gray12">Gray 12%</option>
                    <option value="gray25">Gray 25%</option>
                    <option value="gray50">Gray 50%</option>
                    <option value="gray75">Gray 75%</option>
                </Select>
            </InputWrapper>
            <div className="text-xs text-[var(--text-tertiary)] ml-32 -mt-2 mb-2">Примітка: stipple може працювати лише на X11.</div>
        </>
    );
};

const FillControls: React.FC<{
    shape: FillableShape;
    updateShape: (shape: Shape) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
}> = ({ shape, updateShape, setShapePreview, cancelShapePreview }) => {
    const isFillNone = shape.fill === 'none';
    const isFillDisabled = 
        (shape.type === 'arc' && shape.style === 'arc') ||
        ((shape.type === 'polyline' || shape.type === 'bezier') && !shape.isClosed);

    return (
        <>
            <InputWrapper>
                <Checkbox 
                    id={`${shape.id}-fill-toggle`} 
                    checked={!isFillNone} 
                    onChange={c => updateShape({ ...shape, fill: c ? '#4f46e5' : 'none' })} 
                    label="Заливка:"
                    disabled={isFillDisabled} 
                    title="Увімкнути або вимкнути заливку фігури."
                />
                <ColorInput 
                    id={`${shape.id}-fill`} 
                    value={isFillNone ? '#000000' : shape.fill} 
                    onChange={v => updateShape({ ...shape, fill: v })} 
                    onPreview={v => setShapePreview(shape.id, { fill: v })}
                    onCancel={cancelShapePreview}
                    disabled={isFillNone || isFillDisabled} 
                    title="Колір заливки фігури."
                />
            </InputWrapper>
        </>
    );
};

const StrokeControls: React.FC<{
    shape: FillableShape; // Re-using FillableShape as it covers most strokable shapes
    updateShape: (shape: Shape) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;
    roundFn: (num: number) => number;
}> = ({ shape, updateShape, setShapePreview, cancelShapePreview, roundFn }) => {
    const isStrokeNone = shape.stroke === 'none';
    const showDashControls = shape.type !== 'text';

    return (
        <>
            <hr className="border-[var(--border-secondary)] my-2" />
            <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Контур</h3>
            <InputWrapper>
                <Checkbox 
                    id={`${shape.id}-stroke-toggle`} 
                    checked={!isStrokeNone} 
                    onChange={c => updateShape({ ...shape, stroke: c ? '#000000' : 'none' })} 
                    label="Контур:" 
                    title="Увімкнути або вимкнути контур фігури."
                />
                <ColorInput 
                    id={`${shape.id}-stroke`} 
                    value={isStrokeNone ? '#ffffff' : shape.stroke} 
                    onChange={v => updateShape({ ...shape, stroke: v })}
                    onPreview={v => setShapePreview(shape.id, { stroke: v })}
                    onCancel={cancelShapePreview}
                    disabled={isStrokeNone} 
                    title="Колір контуру фігури."
                />
            </InputWrapper>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-stroke-width`} title="Товщина лінії контуру в пікселях.">Товщина:</Label>
                <NumberInput 
                    id={`${shape.id}-stroke-width`} 
                    value={roundFn(shape.strokeWidth)} 
                    onChange={v => updateShape({ ...shape, strokeWidth: v })} 
                    min={0} 
                    disabled={isStrokeNone} 
                    title="Товщина лінії контуру в пікселях."
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
            <button onClick={() => setIsOpen(p => !p)} className="w-full text-left font-semibold text-[var(--text-secondary)] py-1 flex justify-between items-center" title="Показати/приховати список вузлових точок фігури">
                <span>Вузли ({points.length})</span>
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
                                    title={`X-координата вузла ${i}`}
                                    className={activePointIndex === i ? 'bg-[#4f46e5]/30' : ''}
                                />
                                <NumberInput 
                                    id={`${shapeId}-point-${i}-y`} 
                                    value={roundFn(displayedPoints[i].y)} 
                                    onChange={v => handlePointChange(i, 'y', v)} 
                                    disabled={!isEditing}
                                    onFocus={() => setActivePointIndex(i)}
                                    title={`Y-координата вузла ${i}`}
                                    className={activePointIndex === i ? 'bg-[#4f46e5]/30' : ''}
                                />
                                <button
                                    onClick={() => deletePoint(i)}
                                    title="Видалити вузол"
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
                                            title="Додати вузол між цим та наступним"
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
                <Label htmlFor={`${shape.id}-tk-x1`} title="X-координата верхнього лівого кута рамки Tkinter.">x1:</Label>
                <NumberInput id={`${shape.id}-tk-x1`} value={roundFn(x1)} onChange={v => handleTkinterCoordChange('x1', v)} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-y1`} title="Y-координата верхнього лівого кута рамки Tkinter.">y1:</Label>
                <NumberInput id={`${shape.id}-tk-y1`} value={roundFn(y1)} onChange={v => handleTkinterCoordChange('y1', v)} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-x2`} title="X-координата нижнього правого кута рамки Tkinter.">x2:</Label>
                <NumberInput id={`${shape.id}-tk-x2`} value={roundFn(x2)} onChange={v => handleTkinterCoordChange('x2', v)} />
            </InputWrapper>
             <InputWrapper>
                <Label htmlFor={`${shape.id}-tk-y2`} title="Y-координата нижнього правого кута рамки Tkinter.">y2:</Label>
                <NumberInput id={`${shape.id}-tk-y2`} value={roundFn(y2)} onChange={v => handleTkinterCoordChange('y2', v)} />
            </InputWrapper>
        </div>
    );
};

const isCollapsible = (shape: Shape | null): boolean => {
    if (!shape) return false;
    return ['line', 'pencil', 'polyline', 'bezier'].includes(shape.type);
};

const PropertyEditor: React.FC<PropertyEditorProps> = ({ selectedShape, updateShape, deleteShape, duplicateShape, activeTool, activePointIndex, setActivePointIndex, deletePoint, addPoint, convertToPath, showNotification, setShapePreview, cancelShapePreview }) => {
  const [systemFonts, setSystemFonts] = useState<string[] | null>(null);
  const [isLoadingFonts, setIsLoadingFonts] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingWidth, setEditingWidth] = useState<string>('');
  const [editingHeight, setEditingHeight] = useState<string>('');

  const tkFonts = ["TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"];
  const standardWebFonts = {
    "Популярні Sans-Serif": ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"],
    "Популярні Serif": ["Times New Roman", "Georgia", "Garamond"],
    "Популярні Monospace": ["Courier New", "Consolas", "Lucida Console", "Monaco"],
    "Декоративні": ["Impact", "Comic Sans MS", "Brush Script MT"]
  };
  const allStandardFonts = [...Object.values(standardWebFonts).flat(), ...tkFonts].sort((a,b) => a.localeCompare(b));

  const roundToHundredths = (num: number): number => Math.round(num * 100) / 100;

  const visualBounds = React.useMemo(() => {
    if (!selectedShape) return null;
    return getVisualBoundingBox(selectedShape);
  }, [selectedShape]);
  
  const geometricBounds = React.useMemo(() => {
    if (!selectedShape) return null;
    return getBoundingBox({ ...selectedShape, rotation: 0 });
  }, [selectedShape]);


  useEffect(() => {
    if (geometricBounds) {
      setEditingWidth(roundToHundredths(geometricBounds.width).toString());
      setEditingHeight(roundToHundredths(geometricBounds.height).toString());
    }
  }, [geometricBounds]);
  
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

    const handleSizeInputChange = (axis: 'width' | 'height', valueStr: string) => {
        if (!selectedShape) return;
        if (axis === 'width') setEditingWidth(valueStr);
        else setEditingHeight(valueStr);

        if (valueStr === '') return; // Allow user to clear the field

        const value = parseFloat(valueStr);
        if (isNaN(value) || value < 0) return;

        if (isCollapsible(selectedShape) && value < 1) {
             // Defer update until blur to allow typing values like "0.5" before correction
            return;
        }
        
        updateGeometricSize(axis, value);
    };

    const handleSizeInputBlur = (axis: 'width' | 'height') => {
        if (!selectedShape || !geometricBounds) return;
        const editingValue = axis === 'width' ? editingWidth : editingHeight;
        const value = parseFloat(editingValue);

        let resetValue: number | null = null;
        
        if (isNaN(value) || value < 0 || editingValue === '') {
            resetValue = axis === 'width' ? geometricBounds.width : geometricBounds.height;
        } else if (isCollapsible(selectedShape) && value < 1) {
            showNotification('Розмір контурів не може бути менше 1, щоб уникнути втрати форми.', 'info');
            resetValue = Math.max(1, axis === 'width' ? geometricBounds.width : geometricBounds.height);
        }
        
        if (resetValue !== null) {
            const finalValue = roundToHundredths(resetValue);
            if (axis === 'width') setEditingWidth(finalValue.toString());
            else setEditingHeight(finalValue.toString());
            
            const currentValue = axis === 'width' ? geometricBounds.width : geometricBounds.height;
            if (Math.abs(currentValue - finalValue) > 0.001) {
                updateGeometricSize(axis, finalValue);
            }
        }
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
        showNotification('Ваш браузер або середовище не підтримує завантаження локальних шрифтів.', 'error', 5000);
        setSystemFonts([]);
        return;
    }

    try {
        setIsLoadingFonts(true);
        const availableFonts = await window.queryLocalFonts();
        
        if (availableFonts.length === 0) {
            showNotification('Локальні шрифти не знайдено або дозвіл не було надано.', 'info', 4000);
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
            showNotification(`Завантажено ${uniqueSystemFonts.length} нових системних шрифтів.`, 'info');
        } else {
            showNotification('Нових унікальних системних шрифтів не знайдено.', 'info');
        }

    } catch (err) {
        console.error('Помилка під час завантаження системних шрифтів:', err);
        setSystemFonts([]);
        
        let errorMessage = 'Не вдалося завантажити шрифти. Дивіться консоль для деталей.';
        let duration = 5000;

        const errorString = (err instanceof Error) ? err.toString() : String(err);

        if (errorString.includes('disallowed by Permissions Policy') || (err instanceof DOMException && err.name === 'SecurityError')) {
            errorMessage = 'Доступ до шрифтів заблоковано політикою безпеки середовища.';
            duration = 6000;
        } else if (err instanceof DOMException && err.name === 'NotAllowedError') {
            errorMessage = 'Ви відхилили дозвіл на доступ до шрифтів.';
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
            <Label htmlFor={`${selectedShape.id}-state`} title="Стан видимості та інтерактивності об'єкта.">Стан:</Label>
            <Select id={`${selectedShape.id}-state`} value={selectedShape.state} onChange={v => updateShape({ ...selectedShape, state: v as Shape['state'] })}>
                <option value="normal">Звичайний</option>
                <option value="hidden">Прихований</option>
                <option value="disabled">Вимкнений</option>
            </Select>
        </InputWrapper>
      </>
    );
    
    const joinStyleControls = (shape: JoinableShape) => (
        <>
            <InputWrapper>
                <Label htmlFor={`${shape.id}-joinstyle`} title="Стиль з'єднання сегментів лінії.">Стиль з'єднання:</Label>
                <Select id={`${shape.id}-joinstyle`} value={shape.joinstyle ?? 'miter'} onChange={v => updateShape({ ...shape, joinstyle: v as JoinStyle })} title="Визначає, як виглядають кути при з'єднанні ліній.">
                    <option value="miter">Гострий</option>
                    <option value="round">Круглий</option>
                    <option value="bevel">Скошений</option>
                </Select>
            </InputWrapper>
        </>
    );
    
    const lineLikeControls = (shape: LineShape | BezierCurveShape | PolylineShape | PathShape | ArcShape) => {
        const isClosed = (shape.type === 'polyline' || shape.type === 'bezier') && shape.isClosed;

        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        const [d1m, d2m, d3m] = shape.arrowshape ?? [4, 4, 1.5];

        const handleArrowChange = (index: number, absoluteValue: number) => {
            if (strokeWidth === 0) return;
            const newMultipliers = [...(shape.arrowshape ?? [4, 4, 1.5])];
            const newMultiplier = absoluteValue / strokeWidth;
            newMultipliers[index] = parseFloat(newMultiplier.toFixed(2)); // Round to avoid float issues
            updateShape({ ...shape, arrowshape: newMultipliers as [number, number, number] });
        };
        
        return (
            <>
                <hr className="border-[var(--border-secondary)] my-2" />
                <InputWrapper>
                    <Label htmlFor={`${shape.id}-capstyle`} title="Стиль кінців незамкнених ліній.">Стиль кінця:</Label>
                    <Select id={`${shape.id}-capstyle`} value={shape.capstyle ?? 'round'} onChange={v => updateShape({ ...shape, capstyle: v as any })} title="Визначає, як виглядають кінці ліній.">
                        <option value="butt">Плаский</option>
                        <option value="round">Круглий</option>
                        <option value="projecting">Квадратний</option>
                    </Select>
                </InputWrapper>
                {!isClosed && (
                    <>
                        <InputWrapper>
                            <Label htmlFor={`${shape.id}-arrow`} title="Додати стрілки на кінці лінії.">Стрілки:</Label>
                            <Select id={`${shape.id}-arrow`} value={shape.arrow ?? 'none'} onChange={v => {
                                const newShape = {...shape, arrow: v as any};
                                if (v !== 'none' && !shape.arrowshape) {
                                    newShape.arrowshape = [4, 4, 1.5]; // New multiplier defaults
                                }
                                updateShape(newShape);
                            }} title="Додати стрілки на початок, кінець або на обидва кінці лінії.">
                                <option value="none">Немає</option>
                                <option value="first">На початку</option>
                                <option value="last">В кінці</option>
                                <option value="both">На обох кінцях</option>
                            </Select>
                        </InputWrapper>
                        {shape.arrow && shape.arrow !== 'none' && (
                            <div className="space-y-2 pl-4 border-l-2 border-[var(--border-secondary)] ml-2 mt-2 pt-2">
                                <InputWrapper><Label htmlFor={`${shape.id}-arrow-d1`} title="Абсолютна довжина стрілки в пікселях.">Довжина:</Label><NumberInput id={`${shape.id}-arrow-d1`} value={roundToHundredths(d1m * strokeWidth)} onChange={v => handleArrowChange(0, v)} min={0} title="Абсолютна довжина стрілки в пікселях" /></InputWrapper>
                                <InputWrapper><Label htmlFor={`${shape.id}-arrow-d2`} title="Абсолютна ширина стрілки в пікселях.">Ширина:</Label><NumberInput id={`${shape.id}-arrow-d2`} value={roundToHundredths(d2m * strokeWidth)} onChange={v => handleArrowChange(1, v)} min={0} title="Абсолютна ширина стрілки в пікселях" /></InputWrapper>
                                <InputWrapper><Label htmlFor={`${shape.id}-arrow-d3`} title="Абсолютна ширина основи стрілки в пікселях.">Ширина основи:</Label><NumberInput id={`${shape.id}-arrow-d3`} value={roundToHundredths(d3m * strokeWidth)} onChange={v => handleArrowChange(2, v)} min={0} title="Абсолютна ширина основи стрілки в пікселях" /></InputWrapper>
                            </div>
                        )}
                    </>
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
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={rect} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={rect} updateShape={updateShape} />
                <StrokeControls shape={rect} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(rect)}
            </>;
        }
        case 'ellipse': {
             const ellipse = selectedShape as EllipseShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={ellipse} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={ellipse} updateShape={updateShape} />
                <StrokeControls shape={ellipse} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
            </>;
        }
        case 'polygon':
        case 'star': {
            const poly = selectedShape as PolygonShape;
            const sideLength = getPolygonSideLength(poly);
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${poly.id}-sides`} title="Кількість сторін або променів у фігури.">Сторони:</Label><NumberInput id={`${poly.id}-sides`} value={poly.sides} onChange={v => updateShape({ ...poly, sides: v })} min={3} /></InputWrapper>
                {poly.type === 'star' && <InputWrapper><Label htmlFor={`${poly.id}-inner-radius`} title="Радіус внутрішніх вершин зірки.">Внутр. радіус:</Label><NumberInput id={`${poly.id}-inner-radius`} value={roundToHundredths(poly.innerRadius ?? 0)} onChange={v => updateShape({ ...poly, innerRadius: v })} min={0} /></InputWrapper>}
                <InputWrapper><Label htmlFor={`${poly.id}-side-length`} title="Довжина однієї сторони багатокутника.">Довжина сторони:</Label><NumberInput id={`${poly.id}-side-length`} value={roundToHundredths(sideLength)} onChange={v => updateShape({ ...poly, radius: getPolygonRadiusFromSideLength({ sideLength: v, sides: poly.sides }) })} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={poly} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={poly} updateShape={updateShape} />
                <StrokeControls shape={poly} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(poly)}
            </>;
        }
         case 'triangle': {
            const triangle = selectedShape as IsoscelesTriangleShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${triangle.id}-top-offset`} title="Горизонтальне зміщення верхньої вершини відносно центру основи.">Зсув вершини:</Label><NumberInput id={`${triangle.id}-top-offset`} value={roundToHundredths(triangle.topVertexOffset ?? 0)} onChange={v => updateShape({ ...triangle, topVertexOffset: v })} step={0.01} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={triangle} updateShape={updateShape} />
                <StrokeControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(triangle)}
            </>;
        }
        case 'right-triangle': {
             const triangle = selectedShape as RightTriangleShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={triangle} updateShape={updateShape} />
                <StrokeControls shape={triangle} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(triangle)}
            </>;
        }
        case 'rhombus': {
             const rhombus = selectedShape as RhombusShape;
            return <>
                {commonProperties}
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={rhombus} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={rhombus} updateShape={updateShape} />
                <StrokeControls shape={rhombus} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(rhombus)}
            </>;
        }
        case 'trapezoid': {
             const trapezoid = selectedShape as TrapezoidShape;
            return <>
                {commonProperties}
                 <InputWrapper>
                    <Checkbox id={`${trapezoid.id}-symm`} checked={!!trapezoid.isSymmetrical} onChange={c => updateShape({ ...trapezoid, isSymmetrical: c })} label="Симетрична:" title="Зробити зміщення верхніх кутів однаковим."/>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${trapezoid.id}-topleft`} title="Зміщення верхнього лівого кута всередину у відсотках від ширини.">Зсув зліва (%):</Label><NumberInput id={`${trapezoid.id}-topleft`} value={roundToHundredths(trapezoid.topLeftOffsetRatio * 100)} onChange={v => updateShape({ ...trapezoid, topLeftOffsetRatio: v / 100 })} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${trapezoid.id}-topright`} title="Зміщення верхнього правого кута всередину у відсотках від ширини.">Зсув справа (%):</Label><NumberInput id={`${trapezoid.id}-topright`} value={roundToHundredths(trapezoid.topRightOffsetRatio * 100)} onChange={v => updateShape({ ...trapezoid, topRightOffsetRatio: v / 100 })} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={trapezoid} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={trapezoid} updateShape={updateShape} />
                <StrokeControls shape={trapezoid} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(trapezoid)}
            </>;
        }
        case 'parallelogram': {
             const parallelogram = selectedShape as ParallelogramShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${parallelogram.id}-angle`} title="Кут нахилу бічних сторін (90 градусів = прямокутник).">Кут (º):</Label><NumberInput id={`${parallelogram.id}-angle`} value={roundToHundredths(parallelogram.angle)} onChange={v => updateShape({ ...parallelogram, angle: v })} min={1} max={179} /></InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={parallelogram} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={parallelogram} updateShape={updateShape} />
                <StrokeControls shape={parallelogram} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(parallelogram)}
            </>;
        }
        case 'line': {
            const line = selectedShape as LineShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${line.id}-stroke`} title="Колір лінії.">Колір:</Label><ColorInput id={`${line.id}-stroke`} value={line.stroke} onChange={v => updateShape({ ...line, stroke: v })} onPreview={v => setShapePreview(line.id, { stroke: v })} onCancel={cancelShapePreview} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${line.id}-stroke-width`} title="Товщина лінії в пікселях.">Товщина:</Label><NumberInput id={`${line.id}-stroke-width`} value={roundToHundredths(line.strokeWidth)} onChange={v => updateShape({ ...line, strokeWidth: v })} min={0} /></InputWrapper>
                <DashControls shape={line} updateShape={updateShape} roundFn={roundToHundredths} />
                {lineLikeControls(line)}
            </>;
        }
        case 'pencil': {
            const path = selectedShape as PathShape;
            return <>
                {commonProperties}
                <InputWrapper><Label htmlFor={`${path.id}-stroke`} title="Колір лінії.">Колір:</Label><ColorInput id={`${path.id}-stroke`} value={path.stroke} onChange={v => updateShape({ ...path, stroke: v })} onPreview={v => setShapePreview(path.id, { stroke: v })} onCancel={cancelShapePreview} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${path.id}-stroke-width`} title="Товщина лінії в пікселях.">Товщина:</Label><NumberInput id={`${path.id}-stroke-width`} value={roundToHundredths(path.strokeWidth)} onChange={v => updateShape({ ...path, strokeWidth: v })} min={0} /></InputWrapper>
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
                    <Checkbox id={`${polyline.id}-isClosed`} checked={polyline.isClosed} onChange={c => updateShape({ ...polyline, isClosed: c, name: getDefaultNameForShape({ ...polyline, isClosed: c }) })} label="Замкнутий контур" title="З'єднати початкову та кінцеву точки."/>
                </InputWrapper>
                <InputWrapper>
                    <Checkbox id={`${polyline.id}-smooth`} checked={!!polyline.smooth} onChange={c => updateShape({ ...polyline, smooth: c })} label="Згладжування" title="Згладити кути, перетворивши на криву."/>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${polyline.id}-splinesteps`} title="Кількість сегментів для апроксимації кривої.">Кроки згладжування:</Label>
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
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={polyline} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={polyline} updateShape={updateShape} />
                <StrokeControls shape={polyline} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {joinStyleControls(polyline)}
                {lineLikeControls(polyline)}
            </>;
        }
        case 'bezier': {
            const bezier = selectedShape as BezierCurveShape;
            return <>
                {commonProperties}
                <InputWrapper>
                    <Checkbox id={`${bezier.id}-isClosed`} checked={bezier.isClosed} onChange={c => updateShape({ ...bezier, isClosed: c, name: getDefaultNameForShape({ ...bezier, isClosed: c }) })} label="Замкнутий контур" title="З'єднати початкову та кінцеву точки."/>
                </InputWrapper>
                <InputWrapper>
                    <Checkbox id={`${bezier.id}-smooth`} checked={!!bezier.smooth} onChange={c => updateShape({ ...bezier, smooth: c })} label="Згладжування" title="Згладити кути, перетворивши на криву."/>
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${bezier.id}-splinesteps`} title="Кількість сегментів для апроксимації кривої.">Кроки сплайна:</Label>
                    <NumberInput id={`${bezier.id}-splinesteps`} value={bezier.splinesteps} onChange={v => updateShape({ ...bezier, splinesteps: v })} min={1} max={100} disabled={!bezier.smooth} />
                </InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={bezier} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={bezier} updateShape={updateShape} />
                <StrokeControls shape={bezier} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
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
                    <Label htmlFor={`${arc.id}-style`} title="Стиль дуги: Сектор (pieslice), Хорда (chord), або Дуга (arc).">Стиль:</Label>
                    <Select id={`${arc.id}-style`} value={arc.style} onChange={v => {
                        const newName = getDefaultNameForShape({ ...arc, style: v as any });
                        updateShape({ ...arc, style: v as any, name: newName });
                    }}>
                        <option value="pieslice">Сектор</option>
                        <option value="chord">Хорда</option>
                        <option value="arc">Дуга</option>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${arc.id}-start`} title="Початковий кут дуги в градусах (0 - на 3 години).">Початок (º):</Label><NumberInput id={`${arc.id}-start`} value={roundToHundredths(arc.start)} onChange={handleStartChange} /></InputWrapper>
                <InputWrapper><Label htmlFor={`${arc.id}-end`} title="Кінцевий кут дуги в градусах.">Кінець (º):</Label><NumberInput id={`${arc.id}-end`} value={roundToHundredths(endAngle)} onChange={handleEndChange} /></InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${arc.id}-extent`} title="Довжина дуги в градусах.">Довжина (º):</Label>
                    <NumberInput id={`${arc.id}-extent`} value={roundToHundredths(arc.extent)} onChange={v => updateShape({ ...arc, extent: v })} disabled={arc.isExtentLocked} />
                </InputWrapper>
                 <InputWrapper>
                    {/* FIX: The Label component requires a 'children' prop. Adding an empty string to satisfy the requirement, as this label is used for layout alignment. */}
                    <Label htmlFor={`${arc.id}-extent-lock`}>{''}</Label>
                    <Checkbox id={`${arc.id}-extent-lock`} checked={!!arc.isExtentLocked} onChange={c => updateShape({ ...arc, isExtentLocked: c })} label="Блокувати довжину" title="Зберігати довжину дуги при зміні її кінців."/>
                </InputWrapper>
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <FillControls shape={arc} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} />
                <StippleControls shape={arc} updateShape={updateShape} />
                <StrokeControls shape={arc} updateShape={updateShape} setShapePreview={setShapePreview} cancelShapePreview={cancelShapePreview} roundFn={roundToHundredths} />
                {arc.style === 'arc' && lineLikeControls(arc)}
            </>;
        }
        case 'text': {
            const text = selectedShape as TextShape;
            const anchorNames = {
                'nw': 'Верхній лівий кут', 'n': 'Верхній центр', 'ne': 'Верхній правий кут',
                'w': 'Центр ліворуч', 'center': 'Центр', 'e': 'Центр праворуч',
                'sw': 'Нижній лівий кут', 's': 'Нижній центр', 'se': 'Нижній правий кут'
            };
            return <>
                {commonProperties}
                <InputWrapper>
                    <Label htmlFor={`${text.id}-text`} title="Текст для відображення.">Текст:</Label>
                    <TextArea id={`${text.id}-text`} value={text.text} onChange={v => updateShape({ ...text, text: v })} />
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-font`} title="Шрифт для тексту.">Шрифт:</Label>
                    <Select id={`${text.id}-font`} value={text.font} onChange={handleFontChange}>
                        {Object.entries(standardWebFonts).map(([group, fonts]) => (
                            <optgroup label={group} key={group}>
                                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                        ))}
                        {systemFonts && systemFonts.length > 0 && (
                             <optgroup label="Системні шрифти">
                                {systemFonts.map(f => <option key={f} value={f}>{f}</option>)}
                            </optgroup>
                        )}
                        <optgroup label="Логічні шрифти Tk">
                            {tkFonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </optgroup>
                         <optgroup label="Дії">
                            <option value="load-system-fonts" disabled={isLoadingFonts}>{isLoadingFonts ? "Завантаження..." : "Завантажити системні шрифти"}</option>
                        </optgroup>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-fontSize`} title="Розмір шрифту.">Розмір:</Label><NumberInput id={`${text.id}-fontSize`} value={roundToHundredths(text.fontSize)} onChange={v => updateShape({ ...text, fontSize: v })} min={1} /></InputWrapper>
                
                <hr className="border-[var(--border-secondary)] my-2" />
                <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Заливка</h3>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-fill`} title="Колір тексту.">Колір:</Label>
                    <ColorInput 
                        id={`${text.id}-fill`} 
                        value={text.fill} 
                        onChange={v => updateShape({ ...text, fill: v })} 
                        onPreview={v => setShapePreview(text.id, { fill: v })}
                        onCancel={cancelShapePreview}
                    />
                </InputWrapper>
                <StippleControls shape={text} updateShape={updateShape} />

                <InputWrapper>
                    <Label htmlFor={`${text.id}-style`} title="Стилі тексту.">Стиль:</Label>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                        <Checkbox id={`${text.id}-bold`} checked={text.weight === 'bold'} onChange={c => updateShape({ ...text, weight: c ? 'bold' : 'normal' })} label="Жирний" />
                        <Checkbox id={`${text.id}-italic`} checked={text.slant === 'italic'} onChange={c => updateShape({ ...text, slant: c ? 'italic' : 'roman' })} label="Курсив" />
                        <Checkbox id={`${text.id}-underline`} checked={text.underline} onChange={c => updateShape({ ...text, underline: c })} label="Підкреслений" />
                        <Checkbox id={`${text.id}-overstrike`} checked={text.overstrike} onChange={c => updateShape({ ...text, overstrike: c })} label="Закреслений" />
                    </div>
                </InputWrapper>
                 <hr className="border-[var(--border-secondary)] my-2" />
                <InputWrapper><Label htmlFor={`${text.id}-anchor`} title="Точка на тексті, яка буде розташована за вказаними координатами.">Прив'язка:</Label>
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
                    <Label htmlFor={`${text.id}-anchor-x`} title="X-координата точки прив'язки.">X прив'язки:</Label>
                    <NumberInput id={`${text.id}-anchor-x`} value={roundToHundredths(text.x)} onChange={v => updateShape({ ...text, x: v })} />
                </InputWrapper>
                <InputWrapper>
                    <Label htmlFor={`${text.id}-anchor-y`} title="Y-координата точки прив'язки.">Y прив'язки:</Label>
                    <NumberInput id={`${text.id}-anchor-y`} value={roundToHundredths(text.y)} onChange={v => updateShape({ ...text, y: v })} />
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-justify`} title="Вирівнювання тексту всередині його рамки.">Вирівнювання:</Label>
                    <Select id={`${text.id}-justify`} value={text.justify} onChange={v => updateShape({ ...text, justify: v as any })}>
                        <option value="left">Ліворуч</option><option value="center">Центр</option><option value="right">Праворуч</option>
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${text.id}-width`} title="Ширина текстового блока. 0 - без переносу.">Ширина блока:</Label><NumberInput id={`${text.id}-width`} value={roundToHundredths(text.width)} onChange={v => updateShape({ ...text, width: v })} min={0} /></InputWrapper>
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
                <InputWrapper><Label htmlFor={`${bitmap.id}-type`} title="Стандартний тип бітової карти в Tkinter.">Тип:</Label>
                    <Select id={`${bitmap.id}-type`} value={bitmap.bitmapType} onChange={v => updateShape({ ...bitmap, bitmapType: v as any })}>
                        {bitmapTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${bitmap.id}-fg`} title="Колір переднього плану бітової карти.">Основний колір:</Label>
                    <ColorInput 
                        id={`${bitmap.id}-fg`} 
                        value={bitmap.foreground} 
                        onChange={v => updateShape({ ...bitmap, foreground: v })} 
                        onPreview={v => setShapePreview(bitmap.id, { foreground: v })}
                        onCancel={cancelShapePreview}
                    />
                </InputWrapper>
                <InputWrapper><Label htmlFor={`${bitmap.id}-bg`} title="Колір фону бітової карти.">Тловий колір:</Label>
                    <ColorInput 
                        id={`${bitmap.id}-bg`} 
                        value={bitmap.background} 
                        onChange={v => updateShape({ ...bitmap, background: v })}
                        onPreview={v => setShapePreview(bitmap.id, { background: v })}
                        onCancel={cancelShapePreview}
                    />
                </InputWrapper>
            </>;
        }
        default:
            return <>
                {commonProperties}
            </>
    }
  }

  if (!selectedShape) {
    return (
      <div className="shadow-lg h-full flex flex-col rounded-lg bg-[var(--bg-primary)] p-4">
        <div className="flex justify-between items-center pb-2 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)] text-sm">Властивості</h2>
        </div>
        <div className="flex-grow flex items-center justify-center text-center text-[var(--text-tertiary)]">
          <p className="text-sm">Виберіть об'єкт, щоб побачити його властивості.</p>
        </div>
      </div>
    );
  }

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
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">Властивості</h2>
            <div className="flex items-center gap-1">
                {canConvertToPath && <button onClick={() => convertToPath(selectedShape.id)} title="Перетворити на контур" className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ConvertToPathIcon size={18}/></button>}
                <button onClick={() => duplicateShape(selectedShape.id)} title="Дублювати" className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><DuplicateIcon size={18}/></button>
                <button onClick={() => deleteShape(selectedShape.id)} title="Видалити" className="p-1.5 rounded hover:bg-[var(--destructive-bg)] text-[var(--destructive-text)] hover:text-[var(--accent-text)]"><TrashIcon size={18}/></button>
            </div>
        </div>
        {/* Body */}
        <div className="flex-grow overflow-y-auto p-3 space-y-2">
            <InputWrapper>
                <Label htmlFor={`${selectedShape.id}-name`} title="Назва об'єкта.">Назва:</Label>
                <input
                    id={`${selectedShape.id}-name`}
                    type="text"
                    value={editingName ?? selectedShape.name ?? getDefaultNameForShape(selectedShape)}
                    onFocus={(e) => setEditingName(e.target.value)}
                    onBlur={() => {
                        if (editingName !== null) {
                            updateShape({ ...selectedShape, name: editingName.trim() === '' ? getDefaultNameForShape(selectedShape) : editingName.trim() });
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
                <Label htmlFor={`${selectedShape.id}-comment`} title="Додати коментар до коду.">Коментар:</Label>
                <TextArea
                    id={`${selectedShape.id}-comment`}
                    value={selectedShape.comment ?? ''}
                    onChange={v => updateShape({ ...selectedShape, comment: v })}
                    rows={2}
                    placeholder="Цей коментар буде додано до коду"
                    title="Кожен рядок буде окремим коментарем у згенерованому коді."
                />
            </InputWrapper>

             <hr className="border-[var(--border-secondary)] my-2" />
            <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Геометрія</h3>
            <div className="space-y-2">
                {visualBounds && geometricBounds && (
                    <>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-pos-x`} title="X-координата верхнього лівого кута рамки виділення.">X:</Label>
                            <NumberInput id={`${selectedShape.id}-pos-x`} value={roundToHundredths(visualBounds.x)} onChange={v => handleVisualPosChange('x', v)} />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-pos-y`} title="Y-координата верхнього лівого кута рамки виділення.">Y:</Label>
                            <NumberInput id={`${selectedShape.id}-pos-y`} value={roundToHundredths(visualBounds.y)} onChange={v => handleVisualPosChange('y', v)} />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-width`} title="Геометрична ширина об'єкта (без обертання).">Ширина:</Label>
                            <input
                                id={`${selectedShape.id}-width`}
                                type="number"
                                step="1"
                                value={editingWidth}
                                onChange={e => handleSizeInputChange('width', e.target.value)}
                                onBlur={() => handleSizeInputBlur('width')}
                                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-height`} title="Геометрична висота об'єкта (без обертання).">Висота:</Label>
                             <input
                                id={`${selectedShape.id}-height`}
                                type="number"
                                step="1"
                                value={editingHeight}
                                onChange={e => handleSizeInputChange('height', e.target.value)}
                                onBlur={() => handleSizeInputBlur('height')}
                                className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded px-2 py-1 w-full border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                            />
                        </InputWrapper>

                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-visual-width`} title="Візуальна ширина об'єкта з урахуванням обертання.">Ширина (віз.):</Label>
                            <NumberInput id={`${selectedShape.id}-visual-width`} value={roundToHundredths(visualBounds.width)} onChange={() => {}} disabled />
                        </InputWrapper>
                        <InputWrapper>
                            <Label htmlFor={`${selectedShape.id}-visual-height`} title="Візуальна висота об'єкта з урахуванням обертання.">Висота (віз.):</Label>
                            <NumberInput id={`${selectedShape.id}-visual-height`} value={roundToHundredths(visualBounds.height)} onChange={() => {}} disabled />
                        </InputWrapper>
                    </>
                )}
                {'rotation' in selectedShape && (
                     <InputWrapper><Label htmlFor={`${selectedShape.id}-rotation`} title="Кут обертання об'єкта в градусах.">Обертання:</Label><NumberInput id={`${selectedShape.id}-rotation`} value={roundToHundredths(selectedShape.rotation)} onChange={v => updateShape({ ...selectedShape, rotation: v })} /></InputWrapper>
                )}
                 {canLockAspectRatio && (
                    <InputWrapper>
                        <Label htmlFor={`${selectedShape.id}-aspect-lock`}>Пропорції:</Label>
                        <button
                            id={`${selectedShape.id}-aspect-lock`}
                            onClick={() => updateShape({ ...selectedShape, isAspectRatioLocked: !selectedShape.isAspectRatioLocked })}
                            className={`p-1.5 rounded-md ${selectedShape.isAspectRatioLocked ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
                            title={selectedShape.isAspectRatioLocked ? 'Розблокувати пропорції' : 'Заблокувати пропорції'}
                        >
                            {selectedShape.isAspectRatioLocked ? <LockIcon size={16}/> : <UnlockIcon size={16} />}
                        </button>
                    </InputWrapper>
                )}
            </div>

             {isTkinterBboxEditable && (
                 <>
                    <hr className="border-[var(--border-secondary)] my-2" />
                    <h3 className="font-semibold text-sm text-[var(--text-tertiary)] pt-1">Рамка Tkinter (Bbox)</h3>
                    <TkinterBboxEditor shape={selectedShape as RectangleShape | EllipseShape | ArcShape} updateShape={updateShape} roundFn={roundToHundredths} />
                 </>
             )}
            
            {renderShapeProperties()}

            {showPointsEditor && (
                <PointsEditor
                    points={editablePoints}
                    onPointsChange={handlePointsChange}
                    shapeId={selectedShape.id}
                    selectedShape={selectedShape}
                    isEditing={isEditing}
                    activePointIndex={activePointIndex}
                    setActivePointIndex={setActivePointIndex}
                    deletePoint={(i) => deletePoint(selectedShape.id, i)}
                    addPoint={(i) => addPoint(selectedShape.id, i)}
                    isShapeClosed={isShapeClosed}
                    roundFn={roundToHundredths}
                />
            )}
        </div>
    </div>
  );
};

export default PropertyEditor;