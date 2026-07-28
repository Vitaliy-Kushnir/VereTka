const fs = require('fs');
const content = fs.readFileSync('lib/translations.ts', 'utf-8');
const enStart = content.indexOf('en: {');
let esStart = content.indexOf('es: {');
if (esStart < enStart) {
    esStart = content.indexOf('es: {', enStart);
}
if (esStart < enStart) { // might be something else
    esStart = content.indexOf('it: {', enStart);
}
// more reliable: find the start of the next language block
const ukStart = content.indexOf('uk: {');
const langs = ['uk: {', 'en: {', 'es: {', 'it: {'];
const starts = langs.map(l => content.indexOf(l)).filter(idx => idx > -1).sort((a,b) => a-b);
const myIdx = starts.indexOf(enStart);
const nextStart = starts[myIdx + 1];

let enBlock = content.substring(enStart + 4, nextStart).trim();
enBlock = enBlock.replace(/,\s*$/, '');
fs.writeFileSync('en_block.js', 'module.exports = ' + enBlock + ';');
