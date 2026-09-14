import React, { useMemo, useCallback } from 'react';
import { 
    Shape, 
    Tool, 
    DrawMode, 
    TextShape, 
    PolygonShape 
} from '../../types';
import { 
    ColorInput, 
    NumberInput, 
    Select 
} from '../FormControls';
import { 
    SelectIcon, 
    RectangleIcon, 
    SquareIcon, 
    CircleIcon, 
    EllipseIcon, 
    LineIcon, 
    PolylineIcon, 
    BezierIcon, 
    ArcIcon, 
    PiesliceIcon, 
    ChordIcon, 
    PencilIcon, 
    PolygonIcon, 
    StarIcon, 
    TriangleIcon, 
    RightTriangleIcon, 
    RhombusIcon, 
    TrapezoidIcon, 
    ParallelogramIcon, 
    TextIcon, 
    ImageIcon, 
    GroupIcon,
    XIcon,
    DrawFromCornerIcon,
    DrawFromCenterIcon,
    BoldIcon,
    ItalicIcon,
    UnderlineIcon,
    StrikethroughIcon,
    AlignLeftIcon,
    AlignCenterIcon,
    AlignRightIcon
} from '../icons';
import { useLanguage } from '../LanguageContext';

export interface MobilePropertyBarProps {
    allShapes: Shape[];
    selectedShapes: Shape[];
    activeTool: Tool;
    setActiveTool?: (tool: Tool) => void;
    onDeselectAll?: () => void;

    // Updates for selected shapes
    updateShape: (s: Shape) => void;
    updateShapes: (shapes: Shape[]) => void;
    setShapePreview: (shapeId: string, overrides: Partial<Shape>) => void;
    cancelShapePreview: () => void;

    // Tool defaults before drawing
    drawMode: DrawMode;
    setDrawMode: (m: DrawMode) => void;
    isFillEnabled: boolean;
    setIsFillEnabled: (e: boolean) => void;
    fillColor: string;
    setFillColor: (c: string) => void;
    setPreviewFillColor: (c: string | null) => void;
    isStrokeEnabled: boolean;
    setIsStrokeEnabled: (e: boolean) => void;
    strokeColor: string;
    setStrokeColor: (c: string) => void;
    setPreviewStrokeColor: (c: string | null) => void;
    strokeWidth: number;
    setStrokeWidth: (w: number) => void;
    numberOfSides: number;
    setNumberOfSides: (s: number) => void;

    // Text tool defaults
    textColor: string;
    setTextColor: (c: string) => void;
    setPreviewTextColor: (c: string | null) => void;
    textFont: string;
    setTextFont: (f: string) => void;
    textFontSize: number;
    setTextFontSize: (s: number) => void;

    isLandscape?: boolean;
}

const standardWebFonts = { 
    "Sans-Serif": ["Arial", "Calibri", "Helvetica", "Segoe UI", "Tahoma", "Trebuchet MS", "Verdana"], 
    "Serif": ["Times New Roman", "Georgia", "Garamond"], 
    "Monospace": ["Courier New", "Consolas", "Lucida Console", "Monaco"] 
};
const tkFonts = [
    "TkDefaultFont", "TkTextFont", "TkFixedFont", "TkMenuFont", "TkHeadingFont", 
    "TkCaptionFont", "TkSmallCaptionFont", "TkIconFont", "TkTooltipFont"
];

const renderShapeIcon = (type: Tool | string, size: number = 14) => {
    switch (type) {
        case 'rectangle': return <RectangleIcon size={size} />;
        case 'square': return <SquareIcon size={size} />;
        case 'circle': return <CircleIcon size={size} />;
        case 'ellipse': return <EllipseIcon size={size} />;
        case 'line': return <LineIcon size={size} />;
        case 'pencil': return <PencilIcon size={size} />;
        case 'triangle': return <TriangleIcon size={size} />;
        case 'right-triangle': return <RightTriangleIcon size={size} />;
        case 'polygon': return <PolygonIcon size={size} />;
        case 'star': return <StarIcon size={size} />;
        case 'polyline': return <PolylineIcon size={size} />;
        case 'rhombus': return <RhombusIcon size={size} />;
        case 'trapezoid': return <TrapezoidIcon size={size} />;
        case 'parallelogram': return <ParallelogramIcon size={size} />;
        case 'bezier': return <BezierIcon size={size} />;
        case 'arc': return <ArcIcon size={size} />;
        case 'pieslice': return <PiesliceIcon size={size} />;
        case 'chord': return <ChordIcon size={size} />;
        case 'text': return <TextIcon size={size} />;
        case 'image': return <ImageIcon size={size} />;
        case 'group': return <GroupIcon size={size} />;
        default: return <SelectIcon size={size} />;
    }
};

export const MobilePropertyBar: React.FC<MobilePropertyBarProps> = ({
    allShapes,
    selectedShapes,
    activeTool,
    onDeselectAll,
    updateShape,
    updateShapes,
    setShapePreview,
    cancelShapePreview,
    drawMode,
    setDrawMode,
    isFillEnabled,
    setIsFillEnabled,
    fillColor,
    setFillColor,
    setPreviewFillColor,
    isStrokeEnabled,
    setIsStrokeEnabled,
    strokeColor,
    setStrokeColor,
    setPreviewStrokeColor,
    strokeWidth,
    setStrokeWidth,
    numberOfSides,
    setNumberOfSides,
    textColor,
    setTextColor,
    setPreviewTextColor,
    textFont,
    setTextFont,
    textFontSize,
    setTextFontSize,
    isLandscape = false
}) => {
    const { t } = useLanguage();

    const hasSelectedShapes = selectedShapes.length > 0;

    // Unroll group shapes to reach actual children
    const effectiveShapes = useMemo(() => {
        const getChildren = (shapeIds: string[]): Shape[] => {
            let res: Shape[] = [];
            shapeIds.forEach((id: string) => {
                const s = allShapes.find(x => x && x.id === id);
                if (s && s.type) {
                    if (s.type === 'group') {
                        res = res.concat(getChildren((s as any).shapeIds || []));
                    } else {
                        res.push(s);
                    }
                }
            });
            return res;
        };

        let res: Shape[] = [];
        selectedShapes.forEach((s: any) => {
            if (s && s.type) {
                if (s.type === 'group') {
                    res = res.concat(getChildren((s as any).shapeIds || []));
                } else {
                    res.push(s);
                }
            }
        });
        return res;
    }, [selectedShapes, allShapes]);

    // Handlers for modifying selected shapes
    const handleUpdate = useCallback((propsToUpdate: Partial<Shape>) => {
        if (!effectiveShapes.length) return;
        const updatedShapes = effectiveShapes.map((s: any) => ({ ...s, ...propsToUpdate } as Shape));
        if (typeof updateShapes === 'function') {
            updateShapes(updatedShapes);
        } else {
            updatedShapes.forEach((s: any) => updateShape(s));
        }
    }, [effectiveShapes, updateShapes, updateShape]);

    const handleFillToggle = useCallback((checked: boolean) => {
        const fillable = effectiveShapes.find((s: any) => 'fill' in s);
        if (fillable) {
            if (checked) {
                const colorToRestore = (fillable as any)._previousFill || fillColor;
                handleUpdate({ fill: colorToRestore });
            } else {
                handleUpdate({ fill: 'none', _previousFill: (fillable as any).fill });
            }
        }
    }, [effectiveShapes, fillColor, handleUpdate]);

    const handleStrokeToggle = useCallback((checked: boolean) => {
        const strokable = effectiveShapes.find((s: any) => 'stroke' in s);
        if (!strokable) return;
        if (checked) {
            const colorToRestore = (strokable as any)._previousStroke || strokeColor;
            handleUpdate({ stroke: colorToRestore });
        } else {
            handleUpdate({ stroke: 'none', _previousStroke: strokable.stroke });
        }
    }, [effectiveShapes, strokeColor, handleUpdate]);

    // Shape capabilities when selection is active
    const hasFill = effectiveShapes.some((s: any) => 'fill' in s && s.type !== 'text');
    const isFillDisabledForShape = useMemo(() => {
        if (!effectiveShapes.length) return true;
        return effectiveShapes.every((s: any) => {
            if (s.type === 'arc' && (s as any).style === 'arc') return true;
            if ((s.type === 'polyline' || s.type === 'bezier') && !(s as any).isClosed) return true;
            return false;
        });
    }, [effectiveShapes]);

    const hasStroke = effectiveShapes.some((s: any) => 'stroke' in s && 'strokeWidth' in s && !['image', 'bitmap', 'text'].includes(s.type));
    const hasSides = effectiveShapes.some((s: any) => s.type === 'polygon' || s.type === 'star');
    const isText = effectiveShapes.some((s: any) => s.type === 'text');

    // Common properties among selected shapes
    const commonFill = hasFill && effectiveShapes.filter((s: any) => 'fill' in s && s.type !== 'text').every((s: any, _, arr) => (s as any).fill === (arr[0] as any).fill)
        ? (effectiveShapes.find((s: any) => 'fill' in s && s.type !== 'text') as any)?.fill
        : '';
    const commonStroke = hasStroke && effectiveShapes.filter((s: any) => 'stroke' in s && 'strokeWidth' in s).every((s: any, _, arr) => s.stroke === arr[0].stroke)
        ? effectiveShapes.find((s: any) => 'stroke' in s)?.stroke
        : '';
    const commonStrokeWidth = hasStroke && effectiveShapes.filter((s: any) => 'strokeWidth' in s).every((s: any, _, arr) => (s as any).strokeWidth === (arr[0] as any).strokeWidth)
        ? (effectiveShapes.find((s: any) => 'strokeWidth' in s) as any)?.strokeWidth
        : '';
    const commonSides = hasSides && effectiveShapes.filter((s: any) => 'sides' in s).every((s: any, _, arr) => (s as any).sides === (arr[0] as any).sides)
        ? (effectiveShapes.find((s: any) => 'sides' in s) as any)?.sides
        : '';

    const firstTextShape = effectiveShapes.find((s: any) => s.type === 'text') as TextShape | undefined;
    const firstShape = effectiveShapes[0];

    // Capabilities for tool default mode (when nothing is selected)
    const showToolDrawMode = useMemo(() => ['rectangle', 'square', 'circle', 'ellipse', 'triangle', 'right-triangle', 'polygon', 'star', 'rhombus', 'trapezoid', 'parallelogram', 'arc', 'pieslice', 'chord'].includes(activeTool), [activeTool]);
    const showToolFill = useMemo(() => ['rectangle', 'square', 'circle', 'ellipse', 'triangle', 'right-triangle', 'rhombus', 'trapezoid', 'parallelogram', 'pieslice', 'chord', 'polygon', 'star', 'polyline', 'bezier'].includes(activeTool), [activeTool]);
    const showToolStroke = useMemo(() => !['edit-points', 'image', 'bitmap', 'text'].includes(activeTool), [activeTool]);
    const showToolSides = useMemo(() => ['polygon', 'star'].includes(activeTool), [activeTool]);
    const showToolText = useMemo(() => activeTool === 'text', [activeTool]);
    const isToolFillDisabled = useMemo(() => ['polyline', 'bezier'].includes(activeTool), [activeTool]);

    // Human-friendly localized name helper
    const getShapeLocalizedName = (type: Tool | string): string => {
        switch (type) {
            case 'rectangle': return t('tool.rectangle') || 'Прямокутник';
            case 'square': return t('tool.square') || 'Квадрат';
            case 'circle': return t('tool.circle') || 'Коло';
            case 'ellipse': return t('tool.ellipse') || 'Еліпс';
            case 'line': return t('tool.line') || 'Лінія';
            case 'pencil': return t('tool.pencil') || 'Олівець';
            case 'triangle': return t('tool.triangle') || 'Трикутник';
            case 'right-triangle': return t('tool.rightTriangle') || 'Прямокутний трикутник';
            case 'polygon': return t('tool.polygon') || 'Багатокутник';
            case 'star': return t('tool.star') || 'Зірка';
            case 'polyline': return t('tool.polyline') || 'Полілінія';
            case 'rhombus': return t('tool.rhombus') || 'Ромб';
            case 'trapezoid': return t('tool.trapezoid') || 'Трапеція';
            case 'parallelogram': return t('tool.parallelogram') || 'Паралелограм';
            case 'bezier': return t('tool.bezier') || 'Крива';
            case 'arc': return t('tool.arc') || 'Дуга';
            case 'pieslice': return t('tool.pieslice') || 'Сектор';
            case 'chord': return t('tool.chord') || 'Сегмент';
            case 'text': return t('tool.text') || 'Текст';
            case 'image': return t('tool.image') || 'Зображення';
            case 'select': return t('tool.select') || 'Вибір';
            case 'edit-points': return t('props.nodes') || 'Вузли';
            case 'group': return t('props.group') || 'Група';
            default: return type;
        }
    };

    return (
        <div 
            id="mobile-property-bar"
            className="h-11 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] flex items-center px-2 z-20 shrink-0 select-none shadow-2xs transition-all duration-150"
            style={{
                paddingLeft: 'max(8px, env(safe-area-inset-left, 0px))',
                paddingRight: 'max(8px, env(safe-area-inset-right, 0px))'
            }}
            title={t('mobile.props.title') || "Панель властивостей"}
        >
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x w-full py-0.5 scroll-smooth">
                {/* 1. Context Badge: shows current selected shape or active tool */}
                <div className="flex items-center gap-1.5 shrink-0 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-2 py-1 text-xs font-semibold text-[var(--text-primary)]">
                    {hasSelectedShapes ? (
                        <>
                            {effectiveShapes.length === 1 ? (
                                <>
                                    <span className="text-[var(--accent-primary)] shrink-0">
                                        {renderShapeIcon(firstShape.type, 13)}
                                    </span>
                                    <span className="truncate max-w-[85px]">
                                        {getShapeLocalizedName(firstShape.type)}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <GroupIcon size={13} className="text-[var(--accent-primary)] shrink-0" />
                                    <span>
                                        {effectiveShapes.length} {t('mobile.props.selectedCount') || 'виділено'}
                                    </span>
                                </>
                            )}
                            {onDeselectAll && (
                                <button
                                    onClick={onDeselectAll}
                                    title={t('mobile.props.deselect') || 'Зняти виділення'}
                                    className="p-0.5 -mr-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                                    aria-label={t('mobile.props.deselect') || 'Зняти виділення'}
                                >
                                    <XIcon size={12} />
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="text-[var(--accent-primary)] shrink-0">
                                {renderShapeIcon(activeTool, 13)}
                            </span>
                            <span className="truncate max-w-[95px]">
                                {getShapeLocalizedName(activeTool)}
                            </span>
                        </>
                    )}
                </div>

                <div className="w-px h-5 bg-[var(--border-secondary)] mx-0.5 shrink-0" />

                {/* 2. ADAPTIVE PROPERTIES */}

                {/* --- A: PROPERTIES FOR SELECTED SHAPES --- */}
                {hasSelectedShapes ? (
                    <>
                        {/* Text formatting controls */}
                        {isText && firstTextShape && (
                            <>
                                {/* Text Color */}
                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.color')}:
                                    </span>
                                    <ColorInput 
                                        id="mob-sel-text-color" 
                                        value={firstTextShape.fill} 
                                        onChange={v => handleUpdate({ fill: v })} 
                                        onPreview={v => effectiveShapes.forEach((s: any) => { if (s.type === 'text') setShapePreview(s.id, { fill: v ?? undefined }); })} 
                                        onCancel={cancelShapePreview} 
                                    />
                                </div>

                                {/* Font Family */}
                                <div className="flex items-center gap-1 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.font')}:
                                    </span>
                                    <Select 
                                        id="mob-sel-text-font" 
                                        value={firstTextShape.font} 
                                        onChange={v => handleUpdate({ font: v })} 
                                        className="w-24 text-xs py-1"
                                    >
                                        {Object.entries(standardWebFonts).map(([group, fonts]) => (
                                            <optgroup label={group} key={group}>
                                                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                                            </optgroup>
                                        ))}
                                        <optgroup label={t('app.1101')}>
                                            {tkFonts.map(f => <option key={f} value={f}>{f}</option>)}
                                        </optgroup>
                                    </Select>
                                </div>

                                {/* Font Size */}
                                <div className="flex items-center gap-1 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.size')}:
                                    </span>
                                    <div className="w-20">
                                        <NumberInput 
                                            id="mob-sel-text-size" 
                                            min={1} 
                                            max={300}
                                            value={Math.round(firstTextShape.fontSize)} 
                                            onChange={v => handleUpdate({ fontSize: v })} 
                                        />
                                    </div>
                                </div>

                                {/* Style Toggles (B, I, U, S) */}
                                <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)]/80 p-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <button 
                                        type="button"
                                        title={t('style.bold')} 
                                        onClick={() => handleUpdate({ weight: firstTextShape.weight === 'bold' ? 'normal' : 'bold' })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.weight === 'bold' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <BoldIcon size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        title={t('style.italic')} 
                                        onClick={() => handleUpdate({ slant: firstTextShape.slant === 'italic' ? 'roman' : 'italic' })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.slant === 'italic' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <ItalicIcon size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        title={t('style.underline')} 
                                        onClick={() => handleUpdate({ underline: !firstTextShape.underline })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.underline ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <UnderlineIcon size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        title={t('style.strikethrough')} 
                                        onClick={() => handleUpdate({ overstrike: !firstTextShape.overstrike })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.overstrike ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <StrikethroughIcon size={14} />
                                    </button>
                                </div>

                                {/* Text Alignment */}
                                <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)]/80 p-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <button 
                                        type="button"
                                        title={t('align.left')} 
                                        onClick={() => handleUpdate({ justify: 'left' })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.justify === 'left' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <AlignLeftIcon size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        title={t('align.center')} 
                                        onClick={() => handleUpdate({ justify: 'center' })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.justify === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <AlignCenterIcon size={14} />
                                    </button>
                                    <button 
                                        type="button"
                                        title={t('align.right')} 
                                        onClick={() => handleUpdate({ justify: 'right' })} 
                                        className={`p-1.5 rounded-md transition-colors ${firstTextShape.justify === 'right' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <AlignRightIcon size={14} />
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Regular Polygons & Stars: Sides / Points */}
                        {hasSides && (
                            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                    {t('prop.sides')}:
                                </span>
                                <div className="w-20">
                                    <NumberInput 
                                        id="mob-sel-sides" 
                                        min={3} 
                                        max={500} 
                                        sliderMax={64}
                                        isInteger={true}
                                        presets={[3, 4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 64]}
                                        value={typeof commonSides === 'number' ? Math.round(commonSides) : commonSides} 
                                        onChange={v => handleUpdate({ sides: Math.max(3, Math.round(v)) })} 
                                        placeholder={commonSides === '' ? (t('props.mixed') || 'Різні') : undefined} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fill Property for selected shapes */}
                        {hasFill && (
                            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                    {t('prop.fill')}:
                                </span>
                                <input 
                                    type="checkbox" 
                                    checked={commonFill !== 'none' && !isFillDisabledForShape} 
                                    onChange={e => handleFillToggle(e.target.checked)} 
                                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" 
                                    disabled={isFillDisabledForShape} 
                                />
                                <ColorInput 
                                    id="mob-sel-fill-color" 
                                    value={commonFill === 'none' ? '#000000' : commonFill} 
                                    onChange={v => handleUpdate({ fill: v })} 
                                    onPreview={v => effectiveShapes.forEach((s: any) => setShapePreview(s.id, { fill: v ?? undefined }))} 
                                    onCancel={cancelShapePreview} 
                                    disabled={commonFill === 'none' || isFillDisabledForShape} 
                                    placeholder={commonFill === '' ? (t('props.mixed') || 'Різні') : undefined} 
                                />
                            </div>
                        )}

                        {/* Stroke Property for selected shapes */}
                        {hasStroke && (
                            <>
                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.stroke')}:
                                    </span>
                                    <input 
                                        type="checkbox" 
                                        checked={commonStroke !== 'none'} 
                                        onChange={e => handleStrokeToggle(e.target.checked)} 
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" 
                                    />
                                    <ColorInput 
                                        id="mob-sel-stroke-color" 
                                        value={commonStroke === 'none' ? '#ffffff' : commonStroke} 
                                        onChange={v => handleUpdate({ stroke: v })} 
                                        onPreview={v => effectiveShapes.forEach((s: any) => setShapePreview(s.id, { stroke: v ?? undefined }))} 
                                        onCancel={cancelShapePreview} 
                                        disabled={commonStroke === 'none'} 
                                        placeholder={commonStroke === '' ? (t('props.mixed') || 'Різні') : undefined} 
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.width')}:
                                    </span>
                                    <div className="w-20">
                                        <NumberInput 
                                            id="mob-sel-stroke-width" 
                                            min={0} 
                                            max={100}
                                            value={commonStrokeWidth as any} 
                                            onChange={v => handleUpdate({ strokeWidth: v })} 
                                            disabled={commonStroke === 'none'} 
                                            placeholder={commonStrokeWidth === '' ? (t('props.mixed') || 'Різні') : undefined} 
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    /* --- B: PROPERTIES FOR ACTIVE TOOL BEFORE DRAWING --- */
                    <>
                        {/* Draw Mode: Corner vs Center */}
                        {showToolDrawMode && (
                            <div className="flex items-center gap-0.5 bg-[var(--bg-secondary)]/80 p-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                <button 
                                    type="button"
                                    title={t('prop.drawMode.corner')} 
                                    onClick={() => setDrawMode('corner')} 
                                    className={`p-1.5 rounded-md transition-colors ${drawMode === 'corner' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    <DrawFromCornerIcon size={14} />
                                </button>
                                <button 
                                    type="button"
                                    title={t('prop.drawMode.center')} 
                                    onClick={() => setDrawMode('center')} 
                                    className={`p-1.5 rounded-md transition-colors ${drawMode === 'center' ? 'bg-[var(--accent-primary)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    <DrawFromCenterIcon size={14} />
                                </button>
                            </div>
                        )}

                        {/* Polygons & Stars: Sides / Points */}
                        {showToolSides && (
                            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                    {t('prop.sides')}:
                                </span>
                                <div className="w-20">
                                    <NumberInput 
                                        id="mob-tool-sides" 
                                        min={3} 
                                        max={500} 
                                        sliderMax={64}
                                        isInteger={true}
                                        presets={[3, 4, 5, 6, 7, 8, 10, 12, 16, 24, 32, 64]}
                                        value={Math.round(numberOfSides || 5)} 
                                        onChange={v => setNumberOfSides(Math.max(3, Math.round(v)))} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Fill for Tool */}
                        {(showToolFill || (!showToolText && activeTool === 'select')) && (
                            <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                    {t('prop.fill')}:
                                </span>
                                <input 
                                    id="mob-tool-fill-enable" 
                                    type="checkbox" 
                                    checked={isFillEnabled && !isToolFillDisabled} 
                                    onChange={e => setIsFillEnabled(e.target.checked)} 
                                    className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" 
                                    disabled={isToolFillDisabled} 
                                />
                                <ColorInput 
                                    id="mob-tool-fill-color" 
                                    value={fillColor} 
                                    onChange={setFillColor} 
                                    onPreview={setPreviewFillColor} 
                                    onCancel={() => setPreviewFillColor(null)} 
                                    disabled={!isFillEnabled || isToolFillDisabled} 
                                />
                            </div>
                        )}

                        {/* Stroke for Tool */}
                        {(showToolStroke || (!showToolText && activeTool === 'select')) && (
                            <>
                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.stroke')}:
                                    </span>
                                    <input 
                                        id="mob-tool-stroke-enable" 
                                        type="checkbox" 
                                        checked={isStrokeEnabled} 
                                        onChange={e => setIsStrokeEnabled(e.target.checked)} 
                                        className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" 
                                    />
                                    <ColorInput 
                                        id="mob-tool-stroke-color" 
                                        value={strokeColor} 
                                        onChange={setStrokeColor} 
                                        onPreview={setPreviewStrokeColor} 
                                        onCancel={() => setPreviewStrokeColor(null)} 
                                        disabled={!isStrokeEnabled} 
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.width')}:
                                    </span>
                                    <div className="w-20">
                                        <NumberInput 
                                            id="mob-tool-stroke-width" 
                                            min={1} 
                                            max={100} 
                                            value={strokeWidth} 
                                            onChange={setStrokeWidth} 
                                            disabled={!isStrokeEnabled} 
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Text Tool Defaults */}
                        {showToolText && (
                            <>
                                {/* Text Color */}
                                <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.color')}:
                                    </span>
                                    <ColorInput 
                                        id="mob-tool-text-color" 
                                        value={textColor} 
                                        onChange={setTextColor} 
                                        onPreview={setPreviewTextColor} 
                                        onCancel={() => setPreviewTextColor(null)} 
                                    />
                                </div>

                                {/* Text Font */}
                                <div className="flex items-center gap-1 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.font')}:
                                    </span>
                                    <Select 
                                        id="mob-tool-text-font" 
                                        value={textFont} 
                                        onChange={setTextFont} 
                                        className="w-24 text-xs py-1"
                                    >
                                        {Object.entries(standardWebFonts).map(([group, fonts]) => (
                                            <optgroup label={group} key={group}>
                                                {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                                            </optgroup>
                                        ))}
                                        <optgroup label={t('app.1101')}>
                                            {tkFonts.map(f => <option key={f} value={f}>{f}</option>)}
                                        </optgroup>
                                    </Select>
                                </div>

                                {/* Text Size */}
                                <div className="flex items-center gap-1 bg-[var(--bg-secondary)]/60 px-2 py-0.5 rounded-lg border border-[var(--border-secondary)] shrink-0">
                                    <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
                                        {t('prop.size')}:
                                    </span>
                                    <div className="w-20">
                                        <NumberInput 
                                            id="mob-tool-text-size" 
                                            min={1} 
                                            max={300}
                                            value={textFontSize} 
                                            onChange={setTextFontSize} 
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MobilePropertyBar;
