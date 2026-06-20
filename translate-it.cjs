const fs = require('fs');
const https = require('https');

function translateText(text) {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Fetch failed", res.status);
        resolve(text);
        return;
      }
      const data = await res.json();
      let translated = '';
      for (let i = 0; i < data[0].length; i++) {
         translated += data[0][i][0];
      }
      resolve(translated);
    } catch (e) {
      console.error("Error formatting/running fetch", e);
      resolve(text);
    }
  });
}

async function run() {
  const translationsPath = './lib/translations.ts';
  let content = fs.readFileSync(translationsPath, 'utf8');

  // Extract the `en` block
  const enMatch = content.match(/en: \{([\s\S]*?)\n  \},/);
  if (!enMatch) {
    console.error('Could not find en dictionary');
    return;
  }

  const enContent = enMatch[1];
  
  // Parse lines
  const lines = enContent.split('\n');
  const esLines = new Array(lines.length);

  async function processChunk(startIndex, endIndex) {
    const promises = [];
    for (let i = startIndex; i < endIndex; i++) {
        promises.push((async () => {
        const line = lines[i];
        const match = line.match(/^(\s*'[^']+':\s*)('.*?'|".*?"),?(.*)$/);
        if (!match) {
           esLines[i] = (line.replace("_languageName: 'English'", "_languageName: 'Español'"));
           return;
        }

        const [, prefix, strValue, suffix] = match;
        const isDoubleQuote = strValue.startsWith('"');
        let text = strValue.slice(1, -1);
        
        if (text.trim() === '') {
           esLines[i] = line;
           return;
        }
        
        let translated = await translateText(text);
        if (translated === text && text !== '' && /[a-zA-Z]/.test(text)) {
            console.log(`Translation failed (idx=${i}): `, text);
        }
        let escapedTranslated = translated;
        if (isDoubleQuote) {
            escapedTranslated = escapedTranslated.replace(/"/g, '\\"');
        } else {
            escapedTranslated = escapedTranslated.replace(/'/g, "\\'");
        }
        
        esLines[i] = (`${prefix}${isDoubleQuote ? '"' : "'"}${escapedTranslated}${isDoubleQuote ? '"' : "'"}${suffix ? ',' + suffix : ','}`);   
        })());
    }
    await Promise.all(promises);
  }

  for (let i = 0; i < lines.length; i += 50) {
      await processChunk(i, Math.min(i + 50, lines.length));
  }

  const esBlock = `\n  es: {\n${esLines.join('\n')}\n  }\n};\n`;
  content = content.replace(/\n  \}\n\};/, '\n  },' + esBlock);

  fs.writeFileSync(translationsPath, content, 'utf8');
  console.log('Done!');
}

run();
