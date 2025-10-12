import { Shape, JoinStyle, LineShape, BezierCurveShape, PolylineShape, PathShape, ArcShape, TextShape } from '../types';
import { getFinalPoints, getShapeCenter, getArcPathData, getTextBoundingBox, processTextLines } from './geometry';
import { getVisualFontFamily } from './constants';

// Fallback for browsers that don't support the File System Access API
function triggerDownloadFallback(content: Blob | string, filename: string, mimeType?: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// FIX: Cast window to any to access the experimental File System Access API (`showOpenFilePicker`), which may not be in the default TS DOM types.
export async function openProjectFile(): Promise<{ handle: FileSystemFileHandle; content: string } | null> {
    if (typeof (window as any).showOpenFilePicker !== 'function') {
        return null; // Fallback for browsers without the API
    }
    try {
        const [handle] = await (window as any).showOpenFilePicker({
            types: [{
                description: 'Векторний проєкт',
                accept: { 'application/json': ['.vec.json', '.json'] },
            }],
        });
        const file = await handle.getFile();
        const content = await file.text();
        return { handle, content };
    } catch (err) {
        const domError = err as DOMException;
        // User cancelled the dialog, or the browser blocked it in an iframe.
        // In both cases, we don't treat it as an error. We return null to signal a fallback.
        if (domError.name === 'AbortError' || domError.name === 'SecurityError') {
            console.log(`File picker failed gracefully: ${domError.name}. Falling back.`);
            return null;
        }
        // For any other unexpected errors, re-throw so it can be caught and logged.
        throw err;
    }
}

export async function saveToHandle(handle: FileSystemFileHandle, content: string): Promise<void> {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
}


/**
 * Saves a file using the File System Access API if available, otherwise falls back to a simple download.
 * @param content The content to save, as a string or Blob.
 * @param suggestedName The default filename for the save dialog.
 * @param types File type options for the save dialog.
 * @param mimeType The MIME type for the fallback download.
 */
// FIX: Cast window to any to access the experimental File System Access API (`showSaveFilePicker`), which may not be in the default TS DOM types.
export async function saveFile(content: Blob | string, suggestedName: string, types: { description: string, accept: Record<string, string[]> }[], mimeType?: string): Promise<FileSystemFileHandle | null> {
    if (typeof (window as any).showSaveFilePicker === 'function') {
        try {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName,
                types,
            });
            await saveToHandle(handle, content as string);
            return handle;
        } catch (err) {
            const domError = err as DOMException;
            // AbortError: User cancelled.
            // SecurityError: Browser blocked in cross-origin iframe.
            // Both are expected, non-error scenarios where we should fallback silently.
            if (domError.name === 'AbortError' || domError.name === 'SecurityError') {
                console.log(`File picker failed gracefully (${domError.name}), falling back to download.`);
                triggerDownloadFallback(content, suggestedName, mimeType);
                return null;
            }
            
            // For any other unexpected errors, log it and then fall back.
            console.error('Unexpected error with File System Access API, falling back to download:', err);
            triggerDownloadFallback(content, suggestedName, mimeType);
            return null;
        }
    } else {
        // Fallback for browsers without the API
        triggerDownloadFallback(content, suggestedName, mimeType);
        return null;
    }
}

function escapeHtml(unsafe: string): string {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function shapeToSvgString(shape: Shape): string {
    if (shape.state === 'hidden') return '';

    const getTransform = (s: Shape): string => {
        if ('rotation' in s && s.rotation && s.rotation !== 0) {
            const center = s.type === 'text' ? {x: s.x, y: s.y} : getShapeCenter(s);
            if (center) return `transform="rotate(${s.rotation} ${center.x} ${center.y})"`;
        }
        return '';
    };

    const commonProps = (s: Shape): string => {
        let props = `stroke="${s.stroke}" stroke-width="${s.strokeWidth}" ${getTransform(s)}`;
        if (s.state === 'disabled') props += ' opacity="0.5"';
        return props;
    };

    const fillProps = (s: Extract<Shape, { fill: string }>): string => {
        if (s.fill === 'none') return 'fill="none"';
        if ('stipple' in s && s.stipple) {
            return `fill="url(#pattern-${s.stipple}-fill)"`;
        }
        return `fill="${s.fill}"`;
    };
    
    const joinStyleProps = (s: { joinstyle?: JoinStyle }): string => {
        const joinstyle = s.joinstyle ?? 'miter';
        return `stroke-linejoin="${joinstyle}" ${joinstyle === 'miter' ? 'stroke-miterlimit="10"' : ''}`;
    };

    const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | PathShape | ArcShape): string => {
        let props = `stroke-linecap="${(s.capstyle === 'projecting' ? 'square' : s.capstyle) ?? 'butt'}"`;
        if ('dash' in s && s.dash && s.dash.length > 0 && s.strokeWidth > 0) {
            props += ` stroke-dasharray="${s.dash.map(v => v * s.strokeWidth).join(' ')}"`;
            if ('dashoffset' in s && s.dashoffset) {
                props += ` stroke-dashoffset="${s.dashoffset}"`;
            }
        }
        if (s.arrow && s.arrow !== 'none' && s.arrowshape) {
            const [d1m, d2m, d3m] = s.arrowshape;
            const w = s.strokeWidth > 0 ? s.strokeWidth : 1;
            const key = `${s.stroke.replace(/[^a-zA-Z0-9]/g, '')}-${d1m*w}-${d2m*w}-${d3m*w}`;
            if (s.arrow === 'first' || s.arrow === 'both') props += ` marker-start="url(#arrow-start-${key})"`;
            if (s.arrow === 'last' || s.arrow === 'both') props += ` marker-end="url(#arrow-end-${key})"`;
        }
        return props;
    };

    switch (shape.type) {
        case 'rectangle':
            return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${commonProps(shape)} ${fillProps(shape)} ${joinStyleProps(shape)} />`;
        case 'ellipse':
            return `<ellipse cx="${shape.cx}" cy="${shape.cy}" rx="${shape.rx}" ry="${shape.ry}" ${commonProps(shape)} ${fillProps(shape)} />`;
        case 'image':
            return `<image href="${shape.src}" x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" ${getTransform(shape)} />`;
        case 'bitmap':
            return `<g ${getTransform(shape)}><rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.background}" /><rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="url(#pattern-bitmap-${shape.bitmapType}-fill)" /></g>`;
        case 'text': {
            const bbox = getTextBoundingBox(shape);
            if (!bbox) return '';

            const getDominantBaseline = () => {
                if (['n', 'ne', 'nw'].includes(shape.anchor)) return 'hanging';
                if (['w', 'center', 'e'].includes(shape.anchor)) return 'middle';
                return 'alphabetic';
            };

            const textAnchor = shape.justify === 'center' ? 'middle' : shape.justify === 'right' ? 'end' : 'start';
            const fontStyle = `font-family='${getVisualFontFamily(shape.font)}' font-size='${shape.fontSize}px' font-weight='${shape.weight}' font-style='${shape.slant === 'italic' ? 'italic' : 'normal'}'`;
            const textDecoration = `text-decoration='${shape.underline ? 'underline' : ''} ${shape.overstrike ? 'line-through' : ''}'`;
            const lines = processTextLines(shape);
            
            const tspans = lines.map((line, index) => {
                let dx = 0;
                if (shape.justify === 'center' && shape.width > 0) dx = shape.width / 2;
                if (shape.justify === 'right' && shape.width > 0) dx = shape.width;
                return `<tspan x="${shape.x + dx}" dy="${index === 0 ? '0' : `${shape.fontSize * 1.2}px`}">${escapeHtml(line)}</tspan>`;
            }).join('');
            
            return `<text x="${shape.x}" y="${shape.y}" ${getTransform(shape)} dominant-baseline="${getDominantBaseline()}" text-anchor="${textAnchor}" fill="${shape.fill}" ${fontStyle} ${textDecoration} style="white-space: pre">${tspans}</text>`;
        }
        case 'arc': {
             const fill = shape.style === 'arc' ? 'none' : shape.fill;
             return `<path d="${getArcPathData(shape)}" ${commonProps(shape)} fill="${fill}" ${lineLikeProps(shape)} />`;
        }
        default: { // All other shapes become paths
            const unrotatedShape = { ...shape, rotation: 0 };
            const unrotatedPoints = getFinalPoints(unrotatedShape);
            if (!unrotatedPoints) return '';

            const d = unrotatedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
            const isClosed = shape.type !== 'line' && shape.type !== 'pencil' && !(shape.type === 'polyline' && !shape.isClosed) && !(shape.type === 'bezier' && !shape.isClosed);
            const path = `${d} ${isClosed ? 'Z' : ''}`;
            const fill = isClosed && 'fill' in shape ? fillProps(shape as any) : 'fill="none"';
            
            return `<path d="${path}" ${commonProps(shape)} ${fill} ${lineLikeProps(shape as any)} ${joinStyleProps(shape as any)} />`;
        }
    }
}

export function generateSvg(shapes: Shape[], width: number, height: number, backgroundColor: string): string {
    const usedStipples = new Set<string>();
    const usedBitmaps = new Set<string>();
    const usedMarkers = new Map<string, { color: string; shapeParams: [number, number, number] }>();

    shapes.forEach(shape => {
        if (!shape) return;
        if ('stipple' in shape && shape.stipple) usedStipples.add(shape.stipple);
        if (shape.type === 'bitmap') usedBitmaps.add(shape.bitmapType);
        if ((shape.type === 'line' || shape.type === 'bezier' || shape.type === 'polyline' || shape.type === 'arc') && shape.arrow && shape.arrow !== 'none' && shape.stroke !== 'none' && shape.strokeWidth > 0 && shape.arrowshape) {
             const [d1m, d2m, d3m] = shape.arrowshape;
             const w = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
             const key = `${shape.stroke.replace(/[^a-zA-Z0-9]/g, '')}-${d1m*w}-${d2m*w}-${d3m*w}`;
             if (!usedMarkers.has(key)) {
                usedMarkers.set(key, { color: shape.stroke, shapeParams: [d1m*w, d2m*w, d3m*w] });
            }
        }
    });

    const stippleDefs = Array.from(usedStipples).map(stipple => {
        if (stipple === 'gray12') return `<pattern id="pattern-gray12-fill" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="${backgroundColor}"/><rect x="1" y="1" width="1" height="1" fill="${backgroundColor === '#000000' ? '#333' : '#000'}"/></pattern>`;
        if (stipple === 'gray25') return `<pattern id="pattern-gray25-fill" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${backgroundColor}"/><rect x="0" y="0" width="1" height="1" fill="${backgroundColor === '#000000' ? '#444' : '#000'}"/></pattern>`;
        if (stipple === 'gray50') return `<pattern id="pattern-gray50-fill" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${backgroundColor}"/><rect x="0" y="0" width="1" height="1" fill="${backgroundColor === '#000000' ? '#555' : '#000'}"/><rect x="1" y="1" width="1" height="1" fill="${backgroundColor === '#000000' ? '#555' : '#000'}"/></pattern>`;
        if (stipple === 'gray75') return `<pattern id="pattern-gray75-fill" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" fill="${backgroundColor === '#fff' ? '#000' : '#fff'}"/><rect x="1" y="1" width="1" height="1" fill="${backgroundColor}"/></pattern>`;
        return '';
    }).join('\n');
    
    const bitmapDefs = Array.from(usedBitmaps).map(bitmap => 
        `<pattern id="pattern-bitmap-${bitmap}-fill" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,0 L8,8 M8,0 L0,8" stroke="currentColor" stroke-width="1" shape-rendering="crispEdges"/></pattern>`
    ).join('\n');
    
    const markerDefs = Array.from(usedMarkers.values()).map(({ color, shapeParams }) => {
        const [d1, d2, d3] = shapeParams;
        if (d1 <= 0 || d2 <= 0) return '';
        const key = `${color.replace(/[^a-zA-Z0-9]/g, '')}-${d1}-${d2}-${d3}`;
        return `
            <marker id="arrow-end-${key}" viewBox="0 0 ${d1} ${d2}" refX="${d1}" refY="${d2 / 2}" markerUnits="userSpaceOnUse" markerWidth="${d1}" markerHeight="${d2}" orient="auto">
                <path d="M 0,0 L ${d1},${d2/2} L 0,${d2} L ${d3},${d2/2} z" fill="${color}" />
            </marker>
            <marker id="arrow-start-${key}" viewBox="0 0 ${d1} ${d2}" refX="0" refY="${d2 / 2}" markerUnits="userSpaceOnUse" markerWidth="${d1}" markerHeight="${d2}" orient="auto-start-reverse">
                <path d="M ${d1},0 L 0,${d2/2} L ${d1},${d2} L ${d1-d3},${d2/2} z" fill="${color}" />
            </marker>`;
    }).join('\n');

    const defs = `<defs>${stippleDefs}${bitmapDefs}${markerDefs}</defs>`;
    const shapesSvg = shapes.map(shapeToSvgString).join('\n');

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        ${defs}
        <rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}" />
        ${shapesSvg}
    </svg>`;
}

export async function exportToRaster(
    format: 'png' | 'jpeg',
    svgString: string,
    width: number,
    height: number,
    scale: number,
    quality: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Не вдалося отримати контекст canvas.'));
        }

        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, quality / 100);
            resolve(dataUrl);
        };
        img.onerror = (err) => {
            console.error("Помилка завантаження SVG в зображення:", err);
            reject(new Error('Не вдалося завантажити SVG для конвертації.'));
        };

        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
    });
}