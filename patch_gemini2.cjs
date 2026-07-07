const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

const target = `    *   \${autoGenerateComments ? 'Add a short, descriptive comment for each shape based on its properties (e.g., \`# A blue square\`).' : 'Do not add any descriptive comments unless one is provided in the shape object\\'s "comment" property.'}`;
const add = `    *   \${generateTkinterTags ? 'Add a tags= parameter for each shape (e.g. tags=("shape_id", "group_id") if it is part of a group, or tags="shape_id").' : 'Do not add tags= parameter.'}`;

if (code.includes(target)) {
  code = code.replace(target, add + '\\n' + target);
  fs.writeFileSync('services/geminiService.ts', code);
  console.log('patched');
} else {
  console.log('not found');
}
