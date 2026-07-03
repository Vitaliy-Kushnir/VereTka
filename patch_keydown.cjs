const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetDelete = `            case 'Delete':
            case 'Backspace':
                e.preventDefault();
                if (activeTool === 'edit-points' && selectedShapeIds.length === 1 && activePointIndex !== null) {
                    deletePoint(selectedShapeIds[0], activePointIndex);
                } else if (selectedShapeIds.length > 0) {
                    selectedShapeIds.forEach(id => deleteShape(id));
                }
                return;`;
const insertDelete = `            case 'Delete':
            case 'Backspace':
                if (distributePathState) {
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                if (activeTool === 'edit-points' && selectedShapeIds.length === 1 && activePointIndex !== null) {
                    deletePoint(selectedShapeIds[0], activePointIndex);
                } else if (selectedShapeIds.length > 0) {
                    selectedShapeIds.forEach(id => deleteShape(id));
                }
                return;`;

if (code.includes(targetDelete)) {
    code = code.replace(targetDelete, insertDelete);
    fs.writeFileSync('App.tsx', code);
    console.log('patched keydown successfully');
} else {
    console.log('Targets not found!');
}
