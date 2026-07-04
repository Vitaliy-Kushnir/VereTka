const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetMouseUp = `    if (action?.type === 'panning' && !hasDraggedRef.current && e.button === 0) {
        onSelectShape(null);
    }
    
    if (action?.type === 'drawing' && hasDraggedRef.current) {`;

const insertMouseUp = `    if (action?.type === 'panning' && !hasDraggedRef.current && e.button === 0) {
        onSelectShape(null);
    }
    
    if (action?.type === 'selecting') {
        if (hasDraggedRef.current) {
            const minX = Math.min(action.startPos.x, action.currentPos.x);
            const minY = Math.min(action.startPos.y, action.currentPos.y);
            const maxX = Math.max(action.startPos.x, action.currentPos.x);
            const maxY = Math.max(action.startPos.y, action.currentPos.y);
            
            const selectedIds = [];
            shapes.forEach(shape => {
                if (shape.state === 'disabled' || shape.state === 'hidden') return;
                // Simple fast rect intersection:
                let x = 0, y = 0, w = 0, h = 0;
                
                if (shape.type === 'rectangle' || shape.type === 'triangle' || shape.type === 'right-triangle' || shape.type === 'rhombus' || shape.type === 'trapezoid' || shape.type === 'parallelogram' || shape.type === 'star' || shape.type === 'polygon' || shape.type === 'image' || shape.type === 'bitmap') {
                    const sx = 'x' in shape ? shape.x : 0;
                    const sy = 'y' in shape ? shape.y : 0;
                    const sw = 'width' in shape ? shape.width : 0;
                    const sh = 'height' in shape ? shape.height : 0;
                    if (sx < maxX && sx + sw > minX && sy < maxY && sy + sh > minY) {
                        selectedIds.push(shape.id);
                    }
                } else if (shape.type === 'ellipse') {
                    const cx = shape.cx, cy = shape.cy, rx = shape.rx, ry = shape.ry;
                    if (cx - rx < maxX && cx + rx > minX && cy - ry < maxY && cy + ry > minY) {
                        selectedIds.push(shape.id);
                    }
                } else if (shape.type === 'line' || shape.type === 'pencil' || shape.type === 'polyline' || shape.type === 'bezier') {
                    const pts = shape.points;
                    let mx = Infinity, my = Infinity, mxx = -Infinity, myy = -Infinity;
                    for (const p of pts) {
                        if (p.x < mx) mx = p.x;
                        if (p.x > mxx) mxx = p.x;
                        if (p.y < my) my = p.y;
                        if (p.y > myy) myy = p.y;
                    }
                    if (mx < maxX && mxx > minX && my < maxY && myy > minY) {
                        selectedIds.push(shape.id);
                    }
                } else if (shape.type === 'text') {
                    const sx = shape.x, sy = shape.y, sw = (shape.text.length * shape.fontSize * 0.6), sh = shape.fontSize;
                    if (sx < maxX && sx + sw > minX && sy - sh < maxY && sy > minY) {
                        selectedIds.push(shape.id);
                    }
                }
            });
            onSelectShape(selectedIds.length > 0 ? selectedIds : null);
        } else {
            onSelectShape(null);
        }
    }
    
    if (action?.type === 'drawing' && hasDraggedRef.current) {`;

if (code.includes(targetMouseUp)) {
    code = code.replace(targetMouseUp, insertMouseUp);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched mouse up for selecting');
} else {
    console.log('Target not found in Canvas.tsx for mouse up');
}
