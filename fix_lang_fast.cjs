const fs = require('fs');

async function translateText(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) {
      return text;
    }
    const data = await res.json();
    let translated = '';
    for (let i = 0; i < data[0].length; i++) {
       translated += data[0][i][0];
    }
    return translated;
  } catch (e) {
    return text;
  }
}

async function run() {
  const translationsPath = './lib/translations.ts';
  let content = fs.readFileSync(translationsPath, 'utf8');

  // Convert to CJS temporarily
  const cjsContent = content.replace('export const translations =', 'module.exports =');
  fs.writeFileSync('./lib/temp_trans.cjs', cjsContent);
  const transObj = require('./lib/temp_trans.cjs');
  
  const enDict = transObj['en'];
  
  // Try to load full dicts if they exist
  let frFull = {};
  if (fs.existsSync('./fr_full_dict.json')) {
      frFull = JSON.parse(fs.readFileSync('./fr_full_dict.json', 'utf8'));
  }

  const targetLangs = ['fr', 'de', 'es', 'it', 'uk']; 

  for (const lang of targetLangs) {
    if (!transObj[lang]) transObj[lang] = {};
    const dict = transObj[lang];
    const missingKeys = [];
    
    for (const key of Object.keys(enDict)) {
      if (!dict[key] || dict[key].trim() === '') {
          if (lang === 'fr' && frFull[key]) {
              dict[key] = frFull[key];
          } else {
              missingKeys.push(key);
          }
      }
    }
    
    console.log(`Language ${lang}: ${missingKeys.length} missing keys after local merge`);
    
    if (missingKeys.length > 0) {
      console.log(`Translating missing keys for ${lang}...`);
      
      const batchSize = 30; // parallel requests
      for (let i = 0; i < missingKeys.length; i += batchSize) {
          const chunk = missingKeys.slice(i, i + batchSize);
          await Promise.all(chunk.map(async (key) => {
              let originalText = enDict[key];
              if (!originalText) {
                  dict[key] = '';
                  return;
              }
              let translated = await translateText(originalText, lang);
              translated = translated.replace(/\{\s+([a-zA-Z0-9_]+)\s+\}/g, '{$1}');
              dict[key] = translated;
          }));
          console.log(`Translated ${Math.min(i + batchSize, missingKeys.length)}/${missingKeys.length} for ${lang}`);
      }
    }
  }

  function objToString(obj) {
    return Object.keys(obj).map(k => `    '${k}': ${JSON.stringify(obj[k])}`).join(',\n');
  }

  // Now reconstruct the TS file
  let newContent = '// UTF-8 Translations\nexport const translations = {\n';
  for (const lang of Object.keys(transObj)) {
    newContent += `  '${lang}': {\n${objToString(transObj[lang])}\n  },\n`;
  }
  newContent += '};\n';

  fs.writeFileSync(translationsPath, newContent);
  fs.unlinkSync('./lib/temp_trans.cjs');
  console.log('Done!');
}

run();
