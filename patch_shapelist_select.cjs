const fs = require('fs');
let code = fs.readFileSync('components/ShapeList.tsx', 'utf-8');

const targetType = `  onSelectShape: (id: string | null, isShiftPressed?: boolean) => void;`;
const insertType = `  onSelectShape: (id: string | null, isCtrlPressed?: boolean, isShiftPressed?: boolean) => void;`;

const targetCall = `                onClick={(e) => onSelectShape(shape.id, e.shiftKey)}`;
const insertCall = `                onClick={(e) => onSelectShape(shape.id, e.ctrlKey || e.metaKey, e.shiftKey)}`;

if (code.includes(targetType) && code.includes(targetCall)) {
    code = code.replace(targetType, insertType);
    code = code.replace(targetCall, insertCall);
    fs.writeFileSync('components/ShapeList.tsx', code);
    console.log('patched ShapeList.tsx successfully');
} else {
    console.log('Targets not found in ShapeList.tsx!');
}
