const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetDuplicateHandler = `  const handleDuplicate = useCallback(() => { 
    if (selectedShapeIds.length > 0) {`;
const insertDuplicateHandler = `  const handleDuplicate = useCallback(() => { 
    if (distributePathState) return;
    if (selectedShapeIds.length > 0) {`;

code = code.replace(targetDuplicateHandler, insertDuplicateHandler);

fs.writeFileSync('App.tsx', code);
console.log('patched duplicate handler');
