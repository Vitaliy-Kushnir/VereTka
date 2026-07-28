const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(
    `if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'text', 'arc'].includes(newS.type)) {`,
    `if (['polygon', 'star', 'triangle', 'right-triangle', 'trapezoid', 'parallelogram', 'image', 'bitmap', 'arc'].includes(newS.type)) {`
);
fs.writeFileSync('App.tsx', code);
console.log("Fixed App.tsx isFlipped");

let canvasCode = fs.readFileSync('components/Canvas.tsx', 'utf8');
canvasCode = canvasCode.replace(
    `const isSpecialFlip = ['image', 'bitmap', 'text', 'arc'].includes(shape.type);`,
    `const isSpecialFlip = ['image', 'bitmap', 'arc'].includes(shape.type);`
);
fs.writeFileSync('components/Canvas.tsx', canvasCode);
console.log("Fixed Canvas.tsx isFlipped");

