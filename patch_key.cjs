const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetStr = `case 'KeyD':
                    if (selectedShapeIds.length > 0) {
                        e.preventDefault();
                        const newIds = duplicateShape(selectedShapeIds) as string[];
                        setSelectedShapeIds(newIds);
                    }
                    return;`;

const insertStr = `case 'KeyD':
                    if (selectedShapeIds.length > 0 && !distributePathState) {
                        e.preventDefault();
                        const newIds = duplicateShape(selectedShapeIds) as string[];
                        setSelectedShapeIds(newIds);
                    }
                    return;`;

code = code.replace(targetStr, insertStr);
fs.writeFileSync('App.tsx', code);
console.log('patched key shortcut');
