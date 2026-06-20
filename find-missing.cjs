const fs = require('fs');

async function fixEs() {
    let content = fs.readFileSync('lib/translations.ts', 'utf8');
    const esMatch = content.match(/es: \{([\s\S]*?)\n  \}/);
    const enMatch = content.match(/en: \{([\s\S]*?)\n  \},/);
    
    let esLines = esMatch[1].split('\n');
    let enLines = enMatch[1].split('\n');
    
    let enDict = {};
    for (let line of enLines) {
        let m = line.match(/^\s*'([^']+)':\s*('.*?'|".*?"),?/);
        if (m) enDict[m[1]] = m[2].slice(1, -1);
    }
    
    let missingKeys = [];
    for (let line of esLines) {
        let m = line.match(/^\s*'([^']+)':\s*('.*?'|".*?"),?/);
        if (m) {
             let key = m[1];
             let esText = m[2].slice(1, -1);
             let enText = enDict[key];
             if (enText && esText === enText && enText.trim() !== '' && /[a-zA-Z]/.test(enText) && key !== '_languageName') {
                 missingKeys.push(key);
             }
        }
    }
    
    fs.writeFileSync('missing_es_keys.json', JSON.stringify(missingKeys, null, 2));
    console.log("Missing properties:", missingKeys.length);
}

fixEs();
