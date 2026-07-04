const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const target = `            })} 
            
            {!props.distributePathState && selectedShapes.map((shape) => (`;
            
const target2 = `            })} 
             {!props.distributePathState && selectedShapes.map((shape) => (`;
             
const target3 = `            })}
             {!props.distributePathState && selectedShapes.map((shape) => (`;

const insert = `            })}
             {action?.type === 'selecting' && (
                 <rect 
                     x={Math.min(action.startPos.x, action.currentPos.x)}
                     y={Math.min(action.startPos.y, action.currentPos.y)}
                     width={Math.abs(action.currentPos.x - action.startPos.x)}
                     height={Math.abs(action.currentPos.y - action.startPos.y)}
                     fill="rgba(59, 130, 246, 0.1)"
                     stroke="rgba(59, 130, 246, 0.8)"
                     strokeWidth={1 / viewTransform.scale}
                     style={{ pointerEvents: 'none' }}
                 />
             )}
             {!props.distributePathState && selectedShapes.map((shape) => (`;

if (code.includes(target)) {
    code = code.replace(target, insert);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched with target 1');
} else if (code.includes(target2)) {
    code = code.replace(target2, insert);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched with target 2');
} else if (code.includes(target3)) {
    code = code.replace(target3, insert);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('patched with target 3');
} else {
    // try finding just the map line
    const matchLine = `{!props.distributePathState && selectedShapes.map((shape) => (`
    if (code.includes(matchLine)) {
        code = code.replace(matchLine, `             {action?.type === 'selecting' && (
                 <rect 
                     x={Math.min(action.startPos.x, action.currentPos.x)}
                     y={Math.min(action.startPos.y, action.currentPos.y)}
                     width={Math.abs(action.currentPos.x - action.startPos.x)}
                     height={Math.abs(action.currentPos.y - action.startPos.y)}
                     fill="rgba(59, 130, 246, 0.1)"
                     stroke="rgba(59, 130, 246, 0.8)"
                     strokeWidth={1 / viewTransform.scale}
                     style={{ pointerEvents: 'none' }}
                 />
             )}
             ` + matchLine);
        fs.writeFileSync('components/Canvas.tsx', code);
        console.log('patched with fallback');
    }
}
