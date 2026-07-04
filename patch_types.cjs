const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf-8');

const target = `    | { type: 'edit-distribute-path', handle: 'center' | 'radius' | 'start' | 'end', startPoint: { x: number, y: number }, initialDistributePath: DistributePathState }
    | null;`;
const replacement = `    | { type: 'edit-distribute-path', handle: 'center' | 'radius' | 'start' | 'end', startPoint: { x: number, y: number }, initialDistributePath: DistributePathState }
    | { type: 'selecting', startPos: { x: number, y: number }, currentPos: { x: number, y: number } }
    | null;`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('types.ts', code);
    console.log('patched types.ts');
} else {
    console.log('Target not found in types.ts');
}
