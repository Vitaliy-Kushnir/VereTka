const fs = require('fs');
let code = fs.readFileSync('services/localGeneratorService.ts', 'utf-8');

code = code.replace(
  '    outlineWithFill: boolean,\n    t: (key: string) => string\n): Promise<{ codeLines: CodeLine[] }> {',
  '    outlineWithFill: boolean,\n    generateTkinterTags: boolean,\n    t: (key: string) => string\n): Promise<{ codeLines: CodeLine[] }> {'
);

fs.writeFileSync('services/localGeneratorService.ts', code);
console.log('Fixed signature');
