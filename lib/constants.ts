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

export const DASH_STYLES: { name: string, pattern: number[], description: string }[] = [
    { name: "Суцільна лінія", pattern: [], description: "Суцільна лінія без штрихів." },
    { name: "Простий пунктир", pattern: [5, 3], description: "Штрих 5px, пропуск 3px." },
    { name: "Довгі штрихи", pattern: [10, 5], description: "Штрих 10px, пропуск 5px." },
    { name: "Дрібні точки", pattern: [2, 2], description: "Штрих 2px, пропуск 2px (виглядає як точки)." },
    { name: "Розріджені точки", pattern: [2, 4], description: "Штрих 2px, пропуск 4px." },
    { name: "Штрих-пунктир", pattern: [10, 3, 2, 3], description: "Штрих 10px, пропуск 3px, штрих 2px, пропуск 3px." },
    { name: "Штрих і 2 точки", pattern: [15, 3, 2, 3, 2, 3], description: "Штрих 15px, пропуск 3px, штрих 2px, пропуск 3px, штрих 2px, пропуск 3px." },
    { name: "Подвійна точка", pattern: [2, 3, 2, 6], description: "Штрих 2px, пропуск 3px, штрих 2px, пропуск 6px." },
    { name: "Довгий+короткий штрих", pattern: [20, 5, 5, 5], description: "Штрих 20px, пропуск 5px, штрих 5px, пропуск 5px." },
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


export const getDefaultNameForShape = (s: Shape): string => {
    // Priority 1: An arc shape's name is ALWAYS determined by its style, regardless of rotation.
    if (s.type === 'arc') {
        return TOOL_TYPE_TO_NAME[s.style];
    }
    
    const tkinterType = getTkinterType(s);

    if (tkinterType === 'polygon') {
        // If it's going to be generated as a polygon, but it's not originally
        // a polygon or star, its default name should be "Багатокутник".
        // This handles rotated rectangles, ellipses, converted primitives, etc.
        // The arc case is already handled above, so this is now safe.
        if (s.type !== 'polygon' && s.type !== 'star') {
            return 'Багатокутник';
        }
    }

    // A polyline that becomes an axis-aligned rectangle
    if (tkinterType === 'rectangle' && s.type === 'polyline') {
        return TOOL_TYPE_TO_NAME['rectangle'];
    }

    // Specific names based on other properties
    if (s.type === 'rectangle' && s.isAspectRatioLocked) {
        return TOOL_TYPE_TO_NAME['square'];
    }
     if (s.type === 'ellipse' && s.isAspectRatioLocked) {
        return TOOL_TYPE_TO_NAME['circle'];
    }
    if (s.type === 'polyline') {
        return s.isClosed ? 'Багатокутник' : TOOL_TYPE_TO_NAME['polyline'];
    }
    if (s.type === 'bezier') {
        return s.isClosed ? 'Багатокутник' : TOOL_TYPE_TO_NAME['bezier'];
    }

    // Fallback to the default tool name
    return TOOL_TYPE_TO_NAME[s.type];
};

export const ROTATE_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.9))'%3E%3Cpath d='M23 4v6h-6'/%3E%3Cpath d='M20.49 15a9 9 0 1 1-2.12-9.36L23 10'/%3E%3C/svg%3E") 10 10, auto`;

export const ADJUST_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.9))'%3E%3Cpath d='M3 9 L21 9 L17 5'/%3E%3Cpath d='M21 15 L3 15 L7 19'/%3E%3C/svg%3E") 10 10, auto`;

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

const ALL_DEFAULT_NAMES = new Set(Object.values(TOOL_TYPE_TO_NAME));
ALL_DEFAULT_NAMES.add('Багатокутник'); // From getDefaultNameForShape

export const isDefaultName = (name: string): boolean => {
    return ALL_DEFAULT_NAMES.has(name);
};