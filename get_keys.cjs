const fs = require('fs');
const content = fs.readFileSync('lib/translations.ts', 'utf-8');
const ukStart = content.indexOf('uk: {');
const enStart = content.indexOf('en: {');
const ukBlock = content.substring(ukStart, enStart);
const lines = ukBlock.split('\n');
const keys = [];
lines.forEach(line => {
    const match = line.match(/^\s*'([^']+)'\s*:/) || line.match(/^\s*"([^"]+)"\s*:/) || line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) keys.push(match[1]);
});
console.log(keys.length);
fs.writeFileSync('keys.json', JSON.stringify(keys, null, 2));
