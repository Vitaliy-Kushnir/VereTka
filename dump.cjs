const fs = require('fs');
let content = fs.readFileSync('lib/translations.ts', 'utf8');
const enMatch = content.match(/en: \{([\s\S]*?)\n  \},/);
let enLines = enMatch[1].split('\n');
let enDict = {};
for (let line of enLines) {
    let m = line.match(/^\s*'([^']+)':\s*('.*?'|".*?"),?/);
    if (m) enDict[m[1]] = m[2].slice(1, -1);
}
let missing = JSON.parse(fs.readFileSync('missing_es_keys.json'));
let out = {};
for (let key of missing) out[key] = enDict[key];
fs.writeFileSync('missing.json', JSON.stringify(out, null, 2));
