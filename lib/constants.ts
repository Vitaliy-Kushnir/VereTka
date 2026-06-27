import { Tool, Shape, PolylineShape } from '../types';
import { isPolylineAxisAlignedRectangle } from './geometry';

export const TOOL_TYPE_TO_NAME: Record<Tool, string> = {
    'select': 'Вибрати',
    'edit-points': 'Редагувати вузли',
    'rectangle': 'Прямокутник',
    'square': 'Квадрат',
    'circle': 'Коло',
    'ellipse': 'Еліпс',
    'line': 'Лінія',
    'pencil': 'Олівець',
    'triangle': 'Трикутник',
    'right-triangle': 'Прямокутний трикутник',
    'polygon': 'Багатокутник',
    'star': 'Зірка',
    'polyline': 'Ламана',
    'rhombus': 'Ромб',
    'trapezoid': 'Трапеція',
    'parallelogram': 'Паралелограм',
    'bezier': "Крива Без'є",
    'arc': 'Дуга',
    'pieslice': 'Сектор',
    'chord': 'Сегмент',
    'text': 'Текст',
    'image': 'Зображення',
    'bitmap': 'Bitmap',
};

export const DASH_STYLES: { nameKey: string, pattern: number[], descKey: string }[] = [
    { nameKey: "dash.solid", pattern: [], descKey: "dash.solid.desc" },
    { nameKey: "dash.simple", pattern: [5, 3], descKey: "dash.simple.desc" },
    { nameKey: "dash.long", pattern: [10, 5], descKey: "dash.long.desc" },
    { nameKey: "dash.dots", pattern: [2, 2], descKey: "dash.dots.desc" },
    { nameKey: "dash.sparseDots", pattern: [2, 4], descKey: "dash.sparseDots.desc" },
    { nameKey: "dash.dashDot", pattern: [10, 3, 2, 3], descKey: "dash.dashDot.desc" },
    { nameKey: "dash.dashTwoDots", pattern: [15, 3, 2, 3, 2, 3], descKey: "dash.dashTwoDots.desc" },
    { nameKey: "dash.doubleDot", pattern: [2, 3, 2, 6], descKey: "dash.doubleDot.desc" },
    { nameKey: "dash.longShort", pattern: [20, 5, 5, 5], descKey: "dash.longShort.desc" },
];


export const getTkinterType = (shape: Shape): string => {
    if (shape.type === 'text') return 'text';
    if (shape.type === 'image') return 'image';
    if (shape.type === 'bitmap') return 'bitmap';

    // A circle is always an oval, regardless of rotation
    if (shape.type === 'ellipse' && shape.isAspectRatioLocked) {
        return 'oval';
    }

    if (shape.type === 'arc') {
        if (shape.rotation === 0) {
            return 'arc'; // Any unrotated arc shape is 'arc'
        }
        // If rotated...
        if (shape.style === 'arc') {
            return 'line'; // A rotated open arc becomes a line
        }
        return 'polygon'; // A rotated pieslice or chord becomes a polygon
    }

    // Unrotated simple shapes
    if (!('rotation' in shape) || shape.rotation === 0) {
        if (shape.type === 'rectangle') return 'rectangle';
        if (shape.type === 'ellipse') return 'oval'; // Non-circles
        if (shape.type === 'polyline' && shape.isClosed && isPolylineAxisAlignedRectangle(shape)) {
            return 'rectangle';
        }
    }

    // Line-like shapes
    if (
        shape.type === 'line' ||
        shape.type === 'pencil' ||
        (shape.type === 'polyline' && !shape.isClosed) ||
        (shape.type === 'bezier' && !shape.isClosed)
    ) {
        return 'line';
    }

    // Everything else that is closed becomes a polygon
    return 'polygon';
};


export const getDefaultNameForShape = (s: Shape, t: (key: string) => string): string => {
    // Priority 1: An arc shape's name is ALWAYS determined by its style, regardless of rotation.
    if (s.type === 'arc') {
        const style = s.style || 'pieslice';
        return t(`tool.${style}`);
    }
    
    if (s.name === 'Image [import]' || s.name === 'Зображення [імпорт]') {
        return t('tool.imageImport');
    }
    
    const tkinterType = getTkinterType(s);

    if (tkinterType === 'polygon') {
        // If it's going to be generated as a polygon, but it's not originally
        // a polygon or star, its default name should be "Багатокутник".
        // This handles rotated rectangles, ellipses, converted primitives, etc.
        // The arc case is already handled above, so this is now safe.
        // Removed as per user request to keep original shape name (e.g., Triangle instead of Polygon)
    }

    // A polyline that becomes an axis-aligned rectangle
    if (tkinterType === 'rectangle' && s.type === 'polyline') {
        return t('tool.rectangle');
    }

    // Specific names based on other properties
    if (s.type === 'rectangle' && s.isAspectRatioLocked) {
        return t('tool.square');
    }
     if (s.type === 'ellipse' && s.isAspectRatioLocked) {
        return t('tool.circle');
    }
    if (s.type === 'polyline') {
        return s.isClosed ? t('tool.polygon') : t('tool.polyline');
    }
    if (s.type === 'bezier') {
        return s.isClosed ? t('tool.polygon') : t('tool.bezier');
    }

    // Fallback to the default tool name
    let typeName = s.type === 'right-triangle' ? 'rightTriangle' : s.type;
    return t(`tool.${typeName}`);
};

export const ROTATE_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.9))'%3E%3Cpath d='M23 4v6h-6'/%3E%3Cpath d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10'/%3E%3C/svg%3E") 10 10, auto`;

export const ADJUST_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.9))'%3E%3Cpath d='M3 9 L21 9 L17 5'/%3E%3Cpath d='M21 15 L3 15 L7 19'/%3E%3C/svg%3E") 10 10, auto`;

export const DUPLICATE_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' style='filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.9))'%3E%3Cpath d='M4.2 3.2l14 8-6 2-2 6-6-14z' fill='white' stroke-width='0'/%3E%3Cpath d='M14 18h6m-3-3v6' stroke='white' stroke-width='2.5' stroke-linecap='round' fill='none'/%3E%3C/svg%3E") 4 3, auto`;

export const getVisualFontFamily = (font: string): string => {
    // This is a visual approximation for the canvas. The real Tkinter font name is used in the generated code.
    if (font.startsWith('Tk')) {
        if (font === 'TkFixedFont') {
            return 'monospace'; // Approximate fixed-width font
        }
        return 'sans-serif'; // Approximate all other logical fonts with a generic sans-serif
    }

    // For common fonts, ensure they are quoted if they contain spaces.
    if (font.includes(' ')) {
        return `"${font}", sans-serif`;
    }
    return `${font}, sans-serif`;
};

const ALL_DEFAULT_NAMES = new Set([
    'Вибрати', 'Редагувати вузли', 'Прямокутник', 'Квадрат', 'Коло', 'Еліпс',
    'Лінія', 'Олівець', 'Трикутник', 'Прямокутний трикутник', 'Багатокутник',
    'Зірка', 'Ламана', 'Ромб', 'Трапеція', 'Паралелограм', "Крива Без'є",
    'Дуга', 'Сектор', 'Сегмент', 'Текст', 'Зображення', 'Bitmap', 'Зображення [імпорт]',
    'Select', 'Edit Points', 'Rectangle', 'Square', 'Circle', 'Ellipse',
    'Line', 'Polyline', 'Bezier Curve', 'Arc', 'Pieslice', 'Chord', 'Polygon',
    'Star', 'Triangle', 'Right Triangle', 'Rhombus', 'Trapezoid', 'Parallelogram',
    'Text', 'Pencil', 'Image', 'Image [import]'
]);

export const isDefaultName = (name: string): boolean => {
    return ALL_DEFAULT_NAMES.has(name);
};