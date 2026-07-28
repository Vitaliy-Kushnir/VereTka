const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf8');
code = code.replace(
    /const isBeingEdited = inlineEditingShape && inlineEditingShape.id === shape.id;/g,
    "const isBeingEdited = inlineEditingShapeId === shape.id;"
);
fs.writeFileSync('components/Canvas.tsx', code);
console.log("Fixed Canvas.tsx build error");
