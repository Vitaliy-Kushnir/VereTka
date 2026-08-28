const fs = require('fs');
const content = fs.readFileSync('lib/translations.ts', 'utf8');
const frIndex = content.indexOf('  "fr": {');
if (frIndex === -1) {
  console.log("fr not found");
  process.exit(1);
}
let newContent = content.substring(0, frIndex);
// Let's get the english keys
const match = content.match(/"en":\s*\{([\s\S]*?)\n  },/);
if (!match) {
  console.log("en not found");
  process.exit(1);
}
const enStr = '{' + match[1] + '\n}';
// Since enStr is not valid JSON (trailing commas, maybe single quotes?), we can evaluate it
const enDict = eval('(' + enStr + ')');

let frDict = {};
try {
  frDict = JSON.parse(fs.readFileSync('fr_dict.json', 'utf8'));
} catch (e) {
  console.log("no fr_dict.json or invalid");
}

let frLines = [];
frLines.push('  "fr": {');
for (const key of Object.keys(enDict)) {
  let val = frDict[key];
  if (!val) val = enDict[key]; // fallback to en
  const escaped = val.replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  frLines.push(`    "${key}": "${escaped}",`);
}
// remove last comma
if (frLines.length > 1) {
  frLines[frLines.length - 1] = frLines[frLines.length - 1].replace(/,$/, '');
}
frLines.push('  }');
frLines.push('};');

newContent += frLines.join('\n') + '\n';
fs.writeFileSync('lib/translations.ts', newContent);
console.log("Fixed translations.ts");
