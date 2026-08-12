const fs = require('fs');

const extracted = JSON.parse(fs.readFileSync('extracted.json', 'utf-8'));
const translationsContent = fs.readFileSync('lib/translations.ts', 'utf-8');

// We need to inject these keys into the `uk` dictionary
// The `uk` dictionary starts at `uk: {` and ends before `en: {` or similar.
// Wait, an easier way is to just generate the string to inject and insert it right after `uk: {`

let newUkLines = [];
for (const [key, value] of Object.entries(extracted)) {
    // Escape single quotes inside the value
    const escapedValue = value.replace(/'/g, "\\'");
    newUkLines.push(`    '${key}': '${escapedValue}',`);
}

const lines = translationsContent.split('\n');
const ukIndex = lines.findIndex(l => l.includes('uk: {'));

lines.splice(ukIndex + 1, 0, ...newUkLines);

fs.writeFileSync('lib/translations.ts', lines.join('\n'));
console.log("Injected to uk dictionary.");

