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
    'bezier': "Крива",
    'arc': 'Дуга',
    'pieslice': 'Сектор',
    'chord': 'Сегмент',
    'text': 'Текст',
    'image': 'Зображення',
    'bitmap': 'Bitmap',
    'group': 'Група',
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

export const ROTATE_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M23%204v6h-6'%20fill='none'%20stroke='white'%20stroke-width='4'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M20.49%2015a9%209%200%201%201-2.12-9.36L23%2010'%20fill='none'%20stroke='white'%20stroke-width='4'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M23%204v6h-6'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M20.49%2015a9%209%200%201%201-2.12-9.36L23%2010'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3C/svg%3E") 12 12, auto`;

export const ADJUST_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%3E%3Cpath%20d='M3%209%20L21%209%20L17%205'%20fill='none'%20stroke='white'%20stroke-width='4'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M21%2015%20L3%2015%20L7%2019'%20fill='none'%20stroke='white'%20stroke-width='4'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M3%209%20L21%209%20L17%205'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3Cpath%20d='M21%2015%20L3%2015%20L7%2019'%20fill='none'%20stroke='black'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3C/svg%3E") 12 12, auto`;

export const DUPLICATE_CURSOR_STYLE = `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%3E%3C!--%20Bottom/Shadow%20cursor%20--%3E%3Cpath%20d='M8%208l14%208-6%202-2%206-6-14z'%20fill='white'%20stroke='black'%20stroke-width='1.5'%20stroke-linejoin='round'/%3E%3C!--%20Top/Main%20cursor%20--%3E%3Cpath%20d='M3%203l14%208-6%202-2%206-6-14z'%20fill='black'%20stroke='white'%20stroke-width='1.5'%20stroke-linejoin='round'/%3E%3C/svg%3E") 4 3, auto`;

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
    'Зірка', 'Ламана', 'Ромб', 'Трапеція', 'Паралелограм', "Крива",
    'Дуга', 'Сектор', 'Сегмент', 'Текст', 'Зображення', 'Bitmap', 'Зображення [імпорт]',
    'Select', 'Edit Points', 'Rectangle', 'Square', 'Circle', 'Ellipse',
    'Line', 'Polyline', 'Bezier Curve', 'Arc', 'Pieslice', 'Chord', 'Polygon',
    'Star', 'Triangle', 'Right Triangle', 'Rhombus', 'Trapezoid', 'Parallelogram',
    'Text', 'Pencil', 'Image', 'Image [import]'
]);

export const isDefaultName = (name: string): boolean => {
    return ALL_DEFAULT_NAMES.has(name);
};

const UA_LATIN_MAP: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i',
    'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh',
    'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ie', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'I',
    'Й': 'I', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Iu', 'Я': 'Ia',
    'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'é': 'e', 'è': 'e', 'à': 'a', 'ù': 'u', 'ç': 'c', 'ñ': 'n'
};

export const transliterateText = (text: string): string => {
    if (!text) return '';
    return text.split('').map(char => UA_LATIN_MAP[char] || char).join('');
};

const PYTHON_RESERVED_KEYWORDS = new Set([
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import',
    'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
]);

export const sanitizeToPythonIdentifier = (str: string, fallback: string = 'shape'): string => {
    if (!str) return fallback;
    let s = transliterateText(str);
    s = s.replace(/[^a-zA-Z0-9_]/g, '_');
    s = s.replace(/_+/g, '_');
    s = s.replace(/^_+|_+$/g, '');
    if (/^[0-9]/.test(s)) {
        s = `obj_${s}`;
    }
    if (!s) {
        s = fallback;
    }
    if (PYTHON_RESERVED_KEYWORDS.has(s)) {
        s = `${s}_obj`;
    }
    return s;
};

export const getShortShapeTypeName = (shape: Shape): string => {
    const tkType = getTkinterType(shape);
    switch (tkType) {
        case 'rectangle': return (shape.type === 'rectangle' && shape.isAspectRatioLocked) ? 'square' : 'rect';
        case 'oval': return (shape.type === 'ellipse' && shape.isAspectRatioLocked) ? 'circle' : 'oval';
        case 'line': return 'line';
        case 'polygon': return 'poly';
        case 'arc': return (shape.type === 'arc' && shape.style === 'pieslice') ? 'pie' : (shape.type === 'arc' && shape.style === 'chord') ? 'chord' : 'arc';
        case 'text': return 'text';
        case 'image': return 'img';
        case 'bitmap': return 'bmp';
        default: return 'shape';
    }
};

export const resolveTkinterVariableName = (
    shape: Shape,
    index: number,
    template: string,
    usedNames?: Set<string>
): string => {
    const rawTemplate = (template || '').trim();
    if (!rawTemplate || rawTemplate === 'none') {
        return '';
    }

    const typeStr = getShortShapeTypeName(shape);
    const index1 = String(index + 1);
    const index0 = String(index);
    const idStr = sanitizeToPythonIdentifier(shape.id, 'id');
    
    let nameStr = '';
    if (shape.name && !isDefaultName(shape.name)) {
        nameStr = sanitizeToPythonIdentifier(shape.name, typeStr);
    } else {
        nameStr = typeStr;
    }

    let resolved = rawTemplate;
    const hasPlaceholders = /\{(?:index|index0|i|i0|type|name|id)\}/i.test(rawTemplate);

    if (hasPlaceholders) {
        resolved = resolved
            .replace(/\{index\}/gi, index1)
            .replace(/\{i\}/gi, index1)
            .replace(/\{index0\}/gi, index0)
            .replace(/\{i0\}/gi, index0)
            .replace(/\{type\}/gi, typeStr)
            .replace(/\{name\}/gi, nameStr)
            .replace(/\{id\}/gi, idStr);
    } else {
        let prefix = rawTemplate;
        if (!prefix.endsWith('_') && !prefix.endsWith('-')) {
            prefix = `${prefix}_`;
        }
        resolved = `${prefix}${index1}`;
    }

    let cleanVarName = sanitizeToPythonIdentifier(resolved, `shape_${index1}`);

    if (usedNames) {
        let uniqueName = cleanVarName;
        let suffix = 2;
        while (usedNames.has(uniqueName)) {
            uniqueName = `${cleanVarName}_${suffix}`;
            suffix++;
        }
        usedNames.add(uniqueName);
        return uniqueName;
    }

    return cleanVarName;
};
