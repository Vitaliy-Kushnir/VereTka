const fs = require('fs');
let code = fs.readFileSync('components/InlineTextEditor.tsx', 'utf8');
code = code.replace(/whiteSpace: 'pre-wrap'/g, "whiteSpace: 'pre'");
fs.writeFileSync('components/InlineTextEditor.tsx', code);
console.log("Fixed whiteSpace in InlineTextEditor");
