import { type Shape, EllipseShape, LineShape, BezierCurveShape, RectangleShape, PolylineShape, PolygonShape, ArcShape, ImageShape, TextShape, BitmapShape, PathShape } from '../types';
import { getFinalPoints, isPolylineAxisAlignedRectangle, getTextBoundingBox, getShapeCenter, rotatePoint } from '../lib/geometry';
import { type CodeLine } from '../components/CodeDisplay';
import { getDefaultNameForShape } from '../lib/constants';

const round = (num: number): number => {
    return Math.round(num * 100) / 100;
};

const formatOptions = (options: Record<string, any>): string => {
    const parts = Object.entries(options)
        .filter(([, value]) => value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0))
        .map(([key, value]) => {
            if (typeof value === 'string') {
                // For arrow style etc, they should not be quoted again if they are already strings
                if (['first', 'last', 'both', 'pieslice', 'chord', 'arc', 'miter', 'round', 'bevel', 'butt', 'projecting', 'normal', 'hidden', 'disabled'].includes(value)) {
                    return `${key}="${value}"`;
                }
                const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                return `${key}="${escapedValue}"`;
            }
            if (Array.isArray(value)) {
                return `${key}=(${value.join(', ')})`;
            }
            return `${key}=${value}`;
        });
    return parts.length > 0 ? `, ${parts.join(', ')}` : '';
};

const generateLocalComment = (shape: Shape): string => {
    const typeName = getDefaultNameForShape(shape);
    let description = typeName;

    const details: string[] = [];
    const hasFill = 'fill' in shape && shape.fill !== 'none';
    const hasStroke = shape.stroke !== 'none' && shape.strokeWidth > 0;

    if (hasFill) {
        details.push(`заливка: ${shape.fill}`);
    }
    if (hasStroke) {
        details.push(`контур: ${shape.stroke}`);
    }

    switch (shape.type) {
        case 'polygon':
        case 'star':
            details.push(`${shape.sides} сторін`);
            break;
        case 'text':
            const textPreview = shape.text.substring(0, 20);
            const ellipsis = shape.text.length > 20 ? '...' : '';
            return `Текстовий об'єкт з текстом: "${textPreview}${ellipsis}"`;
        case 'line':
            if (shape.arrow && shape.arrow !== 'none') {
                const arrowMap = { 'first': 'на початку', 'last': 'в кінці', 'both': 'на обох кінцях' };
                details.push(`стрілка ${arrowMap[shape.arrow]}`);
            }
            break;
    }

    if (details.length > 0) {
        description += ` (${details.join(', ')})`;
    }

    return `${description}.`;
};


function shapeToTkinterString(shape: Shape, imageVarMap: Map<string, string>, canvasVarName: string): string | null {
    if (shape.state === 'hidden') return null;
    
    const options: Record<string, any> = {};

    const isUnclosedLine = (shape.type === 'line' || shape.type === 'pencil' ||
                           (shape.type === 'polyline' && !shape.isClosed) ||
                           (shape.type === 'bezier' && !shape.isClosed) ||
                           (shape.type === 'arc' && shape.style === 'arc'));

    if (shape.state !== 'normal') options.state = shape.state;
    if ('fill' in shape && shape.fill !== 'none' && !isUnclosedLine) options.fill = shape.fill;
    
    if (shape.stroke !== 'none' && shape.strokeWidth > 0) {
        options.width = round(shape.strokeWidth);
        if (isUnclosedLine) {
            options.fill = shape.stroke;
        } else {
            options.outline = shape.stroke;
        }
    }
    
    if ('joinstyle' in shape && shape.joinstyle) {
        options.joinstyle = shape.joinstyle;
    }
    if ('stipple' in shape && shape.stipple && 'fill' in shape && shape.fill !== 'none') {
        options.stipple = shape.stipple;
    }
    
    if ('dash' in shape && shape.dash) {
        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        options.dash = shape.dash.map(v => round(v * strokeWidth));
        if ('dashoffset' in shape && shape.dashoffset !== undefined) {
            options.dashoffset = round(shape.dashoffset);
        }
    }

    const commonLineProps = (s: LineShape | BezierCurveShape | PolylineShape | ArcShape | PathShape) => {
        if (s.arrow && s.arrow !== 'none' && s.arrowshape) {
            options.arrow = s.arrow;
            const w = s.strokeWidth > 0 ? s.strokeWidth : 1;
            options.arrowshape = s.arrowshape.map(v => round(v * w));
        }
        if (s.capstyle) {
            options.capstyle = s.capstyle;
        }
    };
    
    // Generate concise code for smooth bezier/polyline using their raw control points.
    if ((shape.type === 'bezier' || shape.type === 'polyline') && shape.smooth) {
        options.smooth = 'True';
        if ('splinesteps' in shape && shape.splinesteps) {
            options.splinesteps = shape.splinesteps;
        }
        
        commonLineProps(shape);

        let controlPoints = shape.points;
        if (shape.rotation !== 0) {
            const center = getShapeCenter(shape);
            if (center) {
                controlPoints = shape.points.map(p => rotatePoint(p, center, shape.rotation));
            }
        }

        const flattenedPoints = controlPoints.flatMap(p => [round(p.x), round(p.y)]).join(', ');

        if (shape.isClosed) {
            return `${canvasVarName}.create_polygon(${flattenedPoints}${formatOptions(options)})`;
        }
        return `${canvasVarName}.create_line(${flattenedPoints}${formatOptions(options)})`;
    }

    if (shape.type === 'line' || shape.type === 'bezier' || shape.type === 'polyline' || shape.type === 'arc' || shape.type === 'pencil') {
        commonLineProps(shape);
    }

    if (shape.type === 'text') {
        const fontParts = [shape.font, Math.round(shape.fontSize)];
        if (shape.weight === 'bold') fontParts.push('bold');
        if (shape.slant === 'italic') fontParts.push('italic');
        if (shape.underline) fontParts.push('underline');
        if (shape.overstrike) fontParts.push('overstrike');
        options.font = fontParts.join(' ');
        
        options.text = shape.text;
        if (shape.fill !== 'none') options.fill = shape.fill;
        options.anchor = shape.anchor;
        if (shape.width > 0) options.width = round(shape.width);
        if (shape.justify) options.justify = shape.justify;
        if (shape.rotation !== 0) options.angle = round(shape.rotation);
        if (shape.stipple && shape.fill !== 'none') options.stipple = shape.stipple;

        const coords = [round(shape.x), round(shape.y)].join(', ');
        return `${canvasVarName}.create_text(${coords}${formatOptions(options)})`;
    }
    
    if (shape.type === 'image') {
        options.image = imageVarMap.get(shape.id);
        const coords = [round(shape.x + shape.width / 2), round(shape.y + shape.height / 2)].join(', ');
        let command = `${canvasVarName}.create_image(${coords}${formatOptions(options)})`;
        if (shape.rotation !== 0) {
            command += ` # Tkinter не підтримує обертання для цього об'єкта.`;
        }
        return command;
    }

    if (shape.type === 'bitmap') {
        options.bitmap = shape.bitmapType;
        options.foreground = shape.foreground;
        options.background = shape.background;
        const coords = [round(shape.x + shape.width / 2), round(shape.y + shape.height / 2)].join(', ');
        let command = `${canvasVarName}.create_bitmap(${coords}${formatOptions(options)})`;
        if (shape.rotation !== 0) {
            command += ` # Tkinter не підтримує обертання для цього об'єкта.`;
        }
        return command;
    }

    // Optimization: A rotated circle is still a circle. Ignore its rotation.
    const isEffectivelyUnrotated = (!('rotation' in shape) || shape.rotation === 0) || (shape.type === 'ellipse' && shape.isAspectRatioLocked);

    if (isEffectivelyUnrotated) {
        switch (shape.type) {
            case 'rectangle':
                const r = shape as RectangleShape;
                const r_coords = [r.x, r.y, r.x + r.width, r.y + r.height].map(round).join(', ');
                return `${canvasVarName}.create_rectangle(${r_coords}${formatOptions(options)})`;
            case 'ellipse':
                const e = shape as EllipseShape;
                const e_coords = [e.cx - e.rx, e.cy - e.ry, e.cx + e.rx, e.cy + e.ry].map(round).join(', ');
                return `${canvasVarName}.create_oval(${e_coords}${formatOptions(options)})`;
            case 'arc':
                const a = shape as ArcShape;
                // An unrotated arc is always handled efficiently.
                options.start = round(a.start);
                options.extent = round(a.extent);
                if (a.style !== 'pieslice') {
                    options.style = a.style;
                }
                if (a.style === 'arc') {
                     if (options.outline && options.fill && options.fill !== options.outline) delete options.fill; 
                     else if (options.fill && !options.outline) delete options.fill;
                }
                const a_coords = [a.x, a.y, a.x + a.width, a.y + a.height].map(round).join(', ');
                return `${canvasVarName}.create_arc(${a_coords}${formatOptions(options)})`;
        }
    }
    
    // Optimization: For rotated CIRCULAR arcs, bake the rotation into the start angle.
    // Rotated elliptical arcs will fall through to the polygon conversion.
    if (shape.type === 'arc' && shape.rotation !== 0) {
        const a = shape as ArcShape;
        if (a.width === a.height) { // It's a circular arc
            options.start = round(a.start + a.rotation); // Bake rotation here
            options.extent = round(a.extent);
            if (a.style !== 'pieslice') {
                options.style = a.style;
            }
            if (a.style === 'arc') {
                if (options.outline && options.fill && options.fill !== options.outline) delete options.fill;
                else if (options.fill && !options.outline) delete options.fill;
            }
            const a_coords = [a.x, a.y, a.x + a.width, a.y + a.height].map(round).join(', ');
            return `${canvasVarName}.create_arc(${a_coords}${formatOptions(options)})`;
        }
    }

    if (shape.type === 'polyline' && shape.isClosed && !shape.rotation && isPolylineAxisAlignedRectangle(shape)) {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        const coords = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round).join(', ');
        return `${canvasVarName}.create_rectangle(${coords}${formatOptions(options)})`;
    }

    const finalPoints = getFinalPoints(shape);
    if (!finalPoints || finalPoints.length < 2) return null;

    if ('smooth' in shape && shape.smooth) {
        options.smooth = 'True';
        if ('splinesteps' in shape && shape.splinesteps) {
            options.splinesteps = shape.splinesteps;
        }
    }
    
    const flattenedPoints = finalPoints.flatMap(p => [round(p.x), round(p.y)]).join(', ');

    if (isUnclosedLine) {
        return `${canvasVarName}.create_line(${flattenedPoints}${formatOptions(options)})`;
    }
    
    return `${canvasVarName}.create_polygon(${flattenedPoints}${formatOptions(options)})`;
}

export async function generateTkinterCodeLocally(
    shapes: Shape[], 
    canvasWidth: number, 
    canvasHeight: number, 
    backgroundColor: string,
    projectName: string,
    canvasVarName: string,
    autoGenerateComments: boolean
): Promise<{ codeLines: CodeLine[] }> {
    
    const finalCanvasVarName = canvasVarName.trim() || 'c';
    const imageShapes = shapes.filter(s => s.type === 'image') as ImageShape[];
    const imageVarMap = new Map<string, string>();
    let imageSetupCode = '';

    if (imageShapes.length > 0) {
      imageSetupCode += `from PIL import Image, ImageTk\n`;
      imageSetupCode += `import base64\n`;
      imageSetupCode += `import io\n\n`;
      
      imageShapes.forEach((shape, index) => {
          const varName = `img_photo_${index}`;
          const rawDataBase64 = shape.src.split(',')[1];
          imageSetupCode += `img_data_${index} = base64.b64decode(b'${rawDataBase64}')\n`;
          imageSetupCode += `img_pil_${index} = Image.open(io.BytesIO(img_data_${index}))\n`;
          imageSetupCode += `${varName} = ImageTk.PhotoImage(img_pil_${index})\n`;
          imageVarMap.set(shape.id, varName);
      });
      imageSetupCode += '\n'
    }

    const codeLines: CodeLine[] = [];

    codeLines.push({ content: 'from tkinter import *', shapeId: null });
    if (imageSetupCode.trim()) {
        codeLines.push({ content: `\n# --- Image setup ---`, shapeId: null });
        imageSetupCode.split('\n').forEach(l => codeLines.push({ content: l, shapeId: null }));
    }
    codeLines.push({ content: '', shapeId: null });
    codeLines.push({ content: 'root = Tk()', shapeId: null });
    codeLines.push({ content: `root.title("${projectName}")`, shapeId: null });
    codeLines.push({ content: `root.geometry("${canvasWidth}x${canvasHeight}")`, shapeId: null });
    codeLines.push({ content: '', shapeId: null });
    codeLines.push({ content: `${finalCanvasVarName} = Canvas(root, width=${canvasWidth}, height=${canvasHeight}, bg="${backgroundColor}")`, shapeId: null });
    codeLines.push({ content: `${finalCanvasVarName}.pack()`, shapeId: null });
    codeLines.push({ content: '', shapeId: null });
    codeLines.push({ content: "# --- Фігури (Об'єкти) ---", shapeId: null });

    if (shapes.length === 0) {
        codeLines.push({ content: "# Об'єкти для малювання відсутні", shapeId: null });
    } else {
        shapes.forEach(shape => {
            const lineContent = shapeToTkinterString(shape, imageVarMap, finalCanvasVarName);
            if (lineContent) {
                let commentToUse = shape.comment;
                if (autoGenerateComments && !commentToUse) {
                    commentToUse = generateLocalComment(shape);
                }

                if (commentToUse) {
                    commentToUse.split('\n').forEach(line => {
                        codeLines.push({ content: line.trim() === '' ? '#' : `# ${line}`, shapeId: shape.id });
                    });
                }
                codeLines.push({ content: lineContent, shapeId: shape.id });
            }
        });
    }

    codeLines.push({ content: '', shapeId: null });
    codeLines.push({ content: 'root.mainloop()', shapeId: null });

    return Promise.resolve({ codeLines });
}