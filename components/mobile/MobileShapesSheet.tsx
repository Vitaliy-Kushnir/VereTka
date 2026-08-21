import React from 'react';
import { 
    SelectIcon, 
    EditPointsIcon, 
    RectangleIcon, 
    SquareIcon, 
    EllipseIcon, 
    CircleIcon, 
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
    DrawFromCornerIcon,
    DrawFromCenterIcon
} from '../icons';
import { Tool, DrawMode } from '../../types';
import { useLanguage } from '../LanguageContext';

interface MobileShapesSheetProps {
    activeTool: Tool;
    setActiveTool: (tool: Tool) => void;
    drawMode: DrawMode;
    setDrawMode: (mode: DrawMode) => void;
    numberOfSides: number;
    setNumberOfSides: (sides: number) => void;
    activeCheats: Set<string>;
    onClose: () => void;
}

export const MobileShapesSheet: React.FC<MobileShapesSheetProps> = ({
    activeTool,
    setActiveTool,
    drawMode,
    setDrawMode,
    numberOfSides,
    setNumberOfSides,
    activeCheats,
    onClose
}) => {
    const { t } = useLanguage();

    const handleSelectTool = (tool: Tool) => {
        setActiveTool(tool);
        onClose();
    };

    const categories = [
        {
            title: t('mobile.shapes.basic') || 'Основні інструменти',
            tools: [
                { id: 'select', label: t('tool.select') || 'Вибір', icon: <SelectIcon size={22} /> },
                { id: 'edit-points', label: t('tool.editPoints') || 'Вузли', icon: <EditPointsIcon size={22} /> },
            ]
        },
        {
            title: t('mobile.shapes.primitives') || 'Примітиви',
            tools: [
                { id: 'rectangle', label: t('tool.rectangle') || 'Прямокутник', icon: <RectangleIcon size={22} /> },
                { id: 'square', label: t('tool.square') || 'Квадрат', icon: <SquareIcon size={22} /> },
                { id: 'ellipse', label: t('tool.ellipse') || 'Еліпс', icon: <EllipseIcon size={22} /> },
                { id: 'circle', label: t('tool.circle') || 'Коло', icon: <CircleIcon size={22} /> },
            ]
        },
        {
            title: t('mobile.shapes.linesArcs') || 'Лінії та Дуги',
            tools: [
                { id: 'line', label: t('tool.line') || 'Лінія', icon: <LineIcon size={22} /> },
                { id: 'polyline', label: t('tool.polyline') || 'Полілінія', icon: <PolylineIcon size={22} /> },
                { id: 'bezier', label: t('tool.bezier') || 'Безьє', icon: <BezierIcon size={22} /> },
                { id: 'arc', label: t('tool.arc') || 'Дуга', icon: <ArcIcon size={22} /> },
                { id: 'pieslice', label: t('tool.pieslice') || 'Сектор', icon: <PiesliceIcon size={22} /> },
                { id: 'chord', label: t('tool.chord') || 'Сегмент', icon: <ChordIcon size={22} /> },
                { id: 'pencil', label: t('tool.pencil') || 'Олівець', icon: <PencilIcon size={22} /> },
            ]
        },
        {
            title: t('mobile.shapes.polygons') || 'Багатокутники',
            tools: [
                { id: 'polygon', label: t('tool.polygon') || 'Багатокутник', icon: <PolygonIcon size={22} /> },
                { id: 'star', label: t('tool.star') || 'Зірка', icon: <StarIcon size={22} /> },
                { id: 'triangle', label: t('tool.triangle') || 'Трикутник', icon: <TriangleIcon size={22} /> },
                { id: 'right-triangle', label: t('tool.rightTriangle') || 'Прямокутний', icon: <RightTriangleIcon size={22} /> },
                { id: 'rhombus', label: t('tool.rhombus') || 'Ромб', icon: <RhombusIcon size={22} /> },
                { id: 'trapezoid', label: t('tool.trapezoid') || 'Трапеція', icon: <TrapezoidIcon size={22} /> },
                { id: 'parallelogram', label: t('tool.parallelogram') || 'Паралелограм', icon: <ParallelogramIcon size={22} /> },
            ]
        },
        {
            title: t('mobile.shapes.textMedia') || 'Текст та Медіа',
            tools: [
                { id: 'text', label: t('tool.text') || 'Текст', icon: <TextIcon size={22} /> },
                { 
                    id: 'image', 
                    label: t('tool.image') || 'Зображення', 
                    icon: <ImageIcon size={22} />, 
                    disabled: !activeCheats.has('001') && !activeCheats.has('002') 
                },
            ]
        }
    ];

    return (
        <div className="space-y-4 pb-4">
            {/* Draw Mode & Quick Settings */}
            <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl space-y-3 border border-[var(--border-secondary)]">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{t('mobile.shapes.drawMode') || 'Режим побудови:'}</span>
                    <div className="flex bg-[var(--bg-primary)] p-0.5 rounded-xl border border-[var(--border-secondary)]">
                        <button
                            onClick={() => setDrawMode('corner')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                drawMode === 'corner' 
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <DrawFromCornerIcon size={14} />
                            <span>{t('toolbar.drawMode.corner') || 'Від кута'}</span>
                        </button>
                        <button
                            onClick={() => setDrawMode('center')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                drawMode === 'center' 
                                    ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] shadow-xs' 
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <DrawFromCenterIcon size={14} />
                            <span>{t('toolbar.drawMode.center') || 'Від центру'}</span>
                        </button>
                    </div>
                </div>

                {/* Polygon / Star Sides Slider */}
                {(activeTool === 'polygon' || activeTool === 'star') && (
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-secondary)]">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                            {t('prop.sides') || 'Кількість вершин'}: <strong className="text-[var(--text-primary)]">{numberOfSides}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min={3}
                                max={20}
                                value={numberOfSides}
                                onChange={(e) => setNumberOfSides(Number(e.target.value))}
                                className="w-28 accent-[var(--accent-primary)]"
                            />
                            <span className="text-xs font-mono font-bold w-5 text-right">{numberOfSides}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Categorized Shapes & Tools */}
            {categories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-tertiary)] px-1">
                        {cat.title}
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 min-w-[260px] sm:min-w-[320px]">
                        {cat.tools.map((tItem) => {
                            const isSelected = activeTool === tItem.id;
                            return (
                                <button
                                    key={tItem.id}
                                    onClick={() => handleSelectTool(tItem.id as Tool)}
                                    disabled={tItem.disabled}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                        isSelected
                                            ? 'bg-[var(--accent-primary)] text-[var(--accent-text)] border-[var(--accent-primary)] shadow-md'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] active:scale-95'
                                    } disabled:opacity-40 disabled:cursor-not-allowed min-h-[66px]`}
                                >
                                    <div className="mb-1 shrink-0">{tItem.icon}</div>
                                    <span className="text-[10px] font-medium leading-tight text-center line-clamp-1 w-full px-0.5">
                                        {tItem.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MobileShapesSheet;
