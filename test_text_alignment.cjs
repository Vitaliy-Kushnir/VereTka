const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf8');

// Replace dominantBaseline="hanging" with standard baseline and dy
code = code.replace(/dominantBaseline="hanging"/g, '');
code = code.replace(/dy=\{index === 0 \? 0 : `\$\{fontSize \* 1.2\}px`\}/g, 'dy={index === 0 ? `${fontSize * 0.88}px` : `${fontSize * 1.2}px`}');

fs.writeFileSync('components/Canvas.tsx', code);
console.log("Updated Canvas.tsx text baseline");

let editorCode = fs.readFileSync('components/InlineTextEditor.tsx', 'utf8');
editorCode = editorCode.replace(/const topGap = shape\.fontSize \* 0\.1;/g, 'const topGap = 0;');
fs.writeFileSync('components/InlineTextEditor.tsx', editorCode);
console.log("Updated InlineTextEditor.tsx topGap");
