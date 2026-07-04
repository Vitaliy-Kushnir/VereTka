const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf-8');

// The prepended string is:
const prepended = `            {action?.type === 'selecting' && (
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
            )}\\n`;

if (code.startsWith(prepended)) {
    code = code.substring(prepended.length);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log('Fixed Canvas.tsx prepended string');
} else {
    // If we used '\n' instead of '\\n', maybe it's this:
    const prepended2 = `            {action?.type === 'selecting' && (
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
            )}\\n`;
    if (code.startsWith(prepended2.replace('\\\\n', '\\n'))) {
       code = code.replace(prepended2.replace('\\\\n', '\\n'), '');
       fs.writeFileSync('components/Canvas.tsx', code);
       console.log('Fixed Canvas.tsx prepended string 2');
    } else {
       console.log('Not found');
    }
}
