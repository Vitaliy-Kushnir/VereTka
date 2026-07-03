const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetStr = `    if (e.button === 2) { // Right mouse button for duplicating
        const clickedShapeId = (e.target as SVGElement).dataset.id;`;

const insertStr = `    if (e.button === 2) { // Right mouse button for duplicating
        if (props.distributePathState) {
            e.preventDefault();
            return;
        }
        const clickedShapeId = (e.target as SVGElement).dataset.id;`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, insertStr);
} else {
    console.error('Target not found in Canvas.tsx');
}

fs.writeFileSync('components/Canvas.tsx', code);
console.log('patched Canvas.tsx');
