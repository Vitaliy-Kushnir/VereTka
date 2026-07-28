const fs = require('fs');

const deDict = JSON.parse(fs.readFileSync('de_dict.json', 'utf-8'));
const frDict = JSON.parse(fs.readFileSync('fr_dict.json', 'utf-8'));

let content = fs.readFileSync('lib/translations.ts', 'utf-8');
content = content.replace(/};\s*$/, ''); // remove trailing };

function objToString(obj) {
    return Object.keys(obj).map(k => `    '${k}': ${JSON.stringify(obj[k])},`).join('\n');
}

content += `\n  de: {\n${objToString(deDict)}\n  },\n`;
content += `  fr: {\n${objToString(frDict)}\n  }\n};\n`;

fs.writeFileSync('lib/translations.ts', content);
