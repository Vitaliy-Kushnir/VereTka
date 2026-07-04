const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetMouseDown = `  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) { // Middle mouse button for panning
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    hasDraggedRef.current = false;
    const pos = getTransformedPointerPosition(getPointerPosition(e));
    mouseDownPosRef.current = pos;`;

const insertMouseDown = `  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) { // Middle mouse button or Space+Left for panning
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    hasDraggedRef.current = false;
    const pos = getTransformedPointerPosition(getPointerPosition(e));
    mouseDownPosRef.current = pos;`;

if (code.includes(targetMouseDown)) {
    code = code.replace(targetMouseDown, insertMouseDown);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched handleMouseDown panning');
} else {
    console.log('Target not found in components/Canvas.tsx');
}
