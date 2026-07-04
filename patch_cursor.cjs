const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetCursor = `            case 'drawing':
                return 'crosshair';`;
const replaceCursor = `            case 'drawing':
            case 'selecting':
                return 'crosshair';`;

if (code.includes(targetCursor)) {
    code = code.replace(targetCursor, replaceCursor);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched cursor for selecting');
} else {
    console.log('Cursor target not found');
}
