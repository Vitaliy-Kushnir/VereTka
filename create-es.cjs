const fs = require('fs');

async function translateText(text) {
    if (!(/[a-zA-Z]/.test(text))) return text;
    let unescaped = text.replace(/\\'/g, "'").replace(/\\"/g, '"');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(unescaped)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log("Fetch failed for text:", text, "Status:", res.status);
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

async function createEs() {
    let content = fs.readFileSync('lib/translations.ts', 'utf8');
    const enMatch = content.match(/en: \{([\s\S]*?)\n  \},/);
    if (!enMatch) {
       console.log("Could not find en block");
       return;
    }
    
    let enLines = enMatch[1].split('\n');
    let esLines = new Array(enLines.length);
    
    async function processChunk(startIndex, endIndex) {
        const promises = [];
        for (let i = startIndex; i < endIndex; i++) {
            promises.push((async () => {
                let enLine = enLines[i];
                const match = enLine.match(/^(\s*'[^']+':\s*)('.*?'|".*?"),?(.*)$/);
                if (!match) {
                    esLines[i] = enLine.replace("_languageName: 'English'", "_languageName: 'Español'");
                    return;
                }
                
                let enText = match[2].slice(1, -1);
                let isDoubleQuote = match[2].startsWith('"');
                
                if (enText.trim() !== '' && /[a-zA-Z]/.test(enText) && match[1].indexOf('_languageName') === -1) {
                    let translated = await translateText(enText);
                    
                    // Revert back app title
                    if (enText.includes("VereTka")) {
                        translated = translated.replace(/veretka|Veretka/gi, "VereTka");
                    }
                    
                    let escapedTranslated = translated;
                    if (isDoubleQuote) {
                        escapedTranslated = escapedTranslated.replace(/"/g, '\\"');
                    } else {
                        escapedTranslated = escapedTranslated.replace(/'/g, "\\'");
                    }
                    esLines[i] = `${match[1]}${isDoubleQuote ? '"' : "'"}${escapedTranslated}${isDoubleQuote ? '"' : "'"}${match[3] ? ',' + match[3] : ','}`;
                } else {
                    esLines[i] = enLine;
                }
            })());
        }
        await Promise.all(promises);
    }
    
    for (let i = 0; i < enLines.length; i += 50) {
        await processChunk(i, Math.min(i + 50, enLines.length));
    }
    
    let esBlock = `\n  es: {\n${esLines.join('\n')}\n  }`;
    content = content.replace(/\n  \},\n\};/, '\n  },' + esBlock + '\n};');
    fs.writeFileSync('lib/translations.ts', content);
    console.log("Done adding es");
}

createEs();
