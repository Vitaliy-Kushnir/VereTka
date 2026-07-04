const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetEmpty = `        } else {
            // Clicked on empty space, initiate pan. Deselection happens on mouseUp if it was just a click.
            setAction({ type: 'panning', initialPos: { x: e.clientX, y: e.clientY } });
        }
        return;
    }`;

const insertEmpty = `        } else {
            // Clicked on empty space, initiate selection box.
            setAction({ type: 'selecting', startPos: pos, currentPos: pos });
        }
        return;
    }`;

if (code.includes(targetEmpty)) {
    code = code.replace(targetEmpty, insertEmpty);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched select empty click to selecting');
} else {
    console.log('Target empty click not found');
}
