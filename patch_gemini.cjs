const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

code = code.replace(
  '    outlineWithFill: boolean\n)',
  '    outlineWithFill: boolean,\n    generateTkinterTags: boolean\n)'
);
code = code.replace(
  '    outlineWithFill: boolean\n): Promise<string> {',
  '    outlineWithFill: boolean,\n    generateTkinterTags: boolean\n): Promise<string> {'
);

if (code.includes('Якщо autoGenerateComments = true')) {
  code = code.replace(
    'Якщо autoGenerateComments = true, додай до кожної',
    'Якщо generateTkinterTags = true, додай параметр tags= для кожної фігури (наприклад, tags=("shape_id", "group_id") якщо є група, або tags="shape_id").\nЯкщо autoGenerateComments = true, додай до кожної'
  );
}

fs.writeFileSync('services/geminiService.ts', code);
console.log('gemini patched');
