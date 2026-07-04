const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetMouseMove = `    if (action.type === 'panning') {
        const dx = e.clientX - action.initialPos.x;
        const dy = e.clientY - action.initialPos.y;
        setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }`;

const insertMouseMove = `    if (action.type === 'panning') {
        const dx = e.clientX - action.initialPos.x;
        const dy = e.clientY - action.initialPos.y;
        setViewTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        return;
    }
    
    if (action.type === 'selecting') {
        setAction({ ...action, currentPos: pos });
        return;
    }`;

if (code.includes(targetMouseMove)) {
    code = code.replace(targetMouseMove, insertMouseMove);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched mouse move for selecting');
} else {
    console.log('Target not found in Canvas.tsx for mouse move');
}
