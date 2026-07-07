const fs = require('fs');
let code = fs.readFileSync('services/localGeneratorService.ts', 'utf-8');

const target = `    if (generateTkinterTags) {
        options.tags = shape.id;
    }`;
const replacement = `    if (generateTkinterTags) {
        if (shape.groupId) {
            options.tags = [\`"\${shape.id}"\`, \`"\${shape.groupId}"\`];
        } else {
            options.tags = shape.id;
        }
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('services/localGeneratorService.ts', code);
console.log('Fixed tags logic');
