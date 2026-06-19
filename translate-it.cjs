const fs = require('fs');
const https = require('https');

function translateText(text) {
  return new Promise((resolve, reject) => {
    // Wait for 1 second between requests to avoid rate limit
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=it&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let translated = '';
          for (let i = 0; i < json[0].length; i++) {
             translated += json[0][i][0];
          }
          resolve(translated);
        } catch (e) {
          resolve(text); // fallback
        }
      });
    }).on('error', err => resolve(text));
  });
}

async function run() {
  const translationsPath = './lib/translations.ts';
  let content = fs.readFileSync(translationsPath, 'utf8');

  // Extract the `en` block
  const enMatch = content.match(/en: \{([\s\S]*?)\n  \}\n\};/);
  if (!enMatch) {
    console.error('Could not find en dictionary');
    return;
  }

  const enContent = enMatch[1];
  
  // Parse lines
  const lines = enContent.split('\n');
  const itLines = new Array(lines.length);

  async function processChunk(startIndex, endIndex) {
    const promises = [];
    for (let i = startIndex; i < endIndex; i++) {
        promises.push((async () => {
        const line = lines[i];
        const match = line.match(/^(\s*'[^']+':\s*)('.*?'|".*?"),?(.*)$/);
        if (!match) {
           itLines[i] = (line.replace("_languageName: 'English'", "_languageName: 'Italiano'"));
           return;
        }

        const [, prefix, strValue, suffix] = match;
        const isDoubleQuote = strValue.startsWith('"');
        let text = strValue.slice(1, -1);
        
        if (text.trim() === '') {
           itLines[i] = line;
           return;
        }
        
        let translated = await translateText(text);
        let escapedTranslated = translated;
        if (isDoubleQuote) {
            escapedTranslated = escapedTranslated.replace(/"/g, '\\"');
        } else {
            escapedTranslated = escapedTranslated.replace(/'/g, "\\'");
        }
        
        itLines[i] = (`${prefix}${isDoubleQuote ? '"' : "'"}${escapedTranslated}${isDoubleQuote ? '"' : "'"}${suffix ? ',' + suffix : ','}`);   
        })());
    }
    await Promise.all(promises);
  }

  for (let i = 0; i < lines.length; i += 50) {
      await processChunk(i, Math.min(i + 50, lines.length));
  }

  const itBlock = `\n  it: {\n${itLines.join('\n')}\n  }\n};\n`;
  content = content.replace(/\n  \}\n\};/, '\n  },' + itBlock);

  fs.writeFileSync(translationsPath, content, 'utf8');
  console.log('Done!');
}

run();
