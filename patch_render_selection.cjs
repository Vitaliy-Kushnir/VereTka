const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

const targetRender = `            })}
            
            {!props.distributePathState && selectedShapes.map((shape) => (`.trim();

const insertRender = `            })}
            
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
            
            {!props.distributePathState && selectedShapes.map((shape) => (`.trim();

const lines = code.split('\\n');
const idx = lines.findIndex(l => l.includes('            {!props.distributePathState && selectedShapes.map((shape) => ('));
if (idx !== -1) {
    lines.splice(idx, 0, `            {action?.type === 'selecting' && (
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
            )}`);
    fs.writeFileSync('components/Canvas.tsx', lines.join('\\n'));
    console.log('patched selection box render by array splice');
} else {
    console.log('not found');
}
