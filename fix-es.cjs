const fs = require('fs');

async function translateText(text) {
    if (!(/[a-zA-Z]/.test(text))) return text;
    // Unescape text for translation
    let unescaped = text.replace(/\\'/g, "'").replace(/\\"/g, '"');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(unescaped)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Fetch failed", res.status);
        return text;
      }
      const data = await res.json();
      let translated = '';
      for (let i = 0; i < data[0].length; i++) {
         translated += data[0][i][0];
      }
      return translated;
    } catch (e) {
      console.error("Error", e);
      return text;
    }
}

async function fixEs() {
    let content = fs.readFileSync('lib/translations.ts', 'utf8');
    const esMatch = content.match(/es: \{([\s\S]*?)\n  \}/);
    const enMatch = content.match(/en: \{([\s\S]*?)\n  \},/);
    if (!esMatch || !enMatch) {
       console.log("Could not find en or es block");
       return;
    }
    
    let esLines = esMatch[1].split('\n');
    let enLines = enMatch[1].split('\n');
    
    for (let i=0; i<esLines.length; i++) {
        let esLine = esLines[i];
        let enLine = enLines[i];
        if (!enLine) continue;
        const match = esLine.match(/^(\s*'[^']+':\s*)('.*?'|".*?"),?(.*)$/);
        if (!match) continue;
        
        const enMatchLine = enLine.match(/^(\s*'[^']+':\s*)('.*?'|".*?"),?(.*)$/);
        if (!enMatchLine) continue;
        
        let esText = match[2].slice(1, -1);
        let enText = enMatchLine[2].slice(1, -1);
        
        let isDoubleQuote = match[2].startsWith('"');
        
        if (esText === enText && enText.trim() !== '' && /[a-zA-Z]/.test(enText) && match[1].indexOf('_languageName') === -1) {
            console.log(`Fixing translation for: ${enText}`);
            let translated = await translateText(enText);
            if (translated !== enText) {
                let escapedTranslated = translated;
                if (isDoubleQuote) {
                    escapedTranslated = escapedTranslated.replace(/"/g, '\\"');
                } else {
                    escapedTranslated = escapedTranslated.replace(/'/g, "\\'");
                }
                esLines[i] = `${match[1]}${isDoubleQuote ? '"' : "'"}${escapedTranslated}${isDoubleQuote ? '"' : "'"}${match[3] ? ',' + match[3] : ','}`;
            }
            await new Promise(r => setTimeout(r, 200)); // rate limit protection
        }
    }
    
    let esBlock = `es: {\n${esLines.join('\n')}\n  }`;
    content = content.replace(/es: \{([\s\S]*?)\n  \}/, esBlock);
    fs.writeFileSync('lib/translations.ts', content);
    console.log("Done");
}

fixEs();
