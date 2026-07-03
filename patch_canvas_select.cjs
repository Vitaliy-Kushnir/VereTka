const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetType = `  onSelectShape: (id: string | string[] | null, isShiftPressed?: boolean) => void;`;
const insertType = `  onSelectShape: (id: string | string[] | null, isCtrlPressed?: boolean, isShiftPressed?: boolean) => void;`;

const target1 = `          if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.shiftKey);
          else if (e.shiftKey) onSelectShape(clickedShape.id, e.shiftKey);`;
const insert1 = `          if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
          else if (e.ctrlKey || e.metaKey || e.shiftKey) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);`;

const target2 = `            if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.shiftKey);
            else if (e.shiftKey) onSelectShape(clickedShape.id, e.shiftKey);`;
const insert2 = `            if (!selectedShapeIds.includes(clickedShape.id)) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);
            else if (e.ctrlKey || e.metaKey || e.shiftKey) onSelectShape(clickedShape.id, e.ctrlKey || e.metaKey, e.shiftKey);`;

if (code.includes(targetType) && code.includes(target1) && code.includes(target2)) {
    code = code.replace(targetType, insertType);
    code = code.replace(target1, insert1);
    code = code.replace(target2, insert2);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched Canvas.tsx successfully');
} else {
    console.log('Targets not found in Canvas.tsx!');
}
