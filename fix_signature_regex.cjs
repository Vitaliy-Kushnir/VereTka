const fs = require('fs');
let code = fs.readFileSync('services/localGeneratorService.ts', 'utf-8');

code = code.replace(
  /outlineWithFill: boolean,\s*t: \(key: string\) => string\s*\): Promise<{ codeLines: CodeLine\[\] }> {/m,
  'outlineWithFill: boolean,\n    generateTkinterTags: boolean,\n    t: (key: string) => string): Promise<{ codeLines: CodeLine[] }> {'
);

fs.writeFileSync('services/localGeneratorService.ts', code);
console.log('Fixed signature regex');
