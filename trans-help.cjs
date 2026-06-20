const fs = require('fs');

async function translateText(text, targetLang) {
    if (!(/[a-zA-Z]/.test(text))) return text;
    let unescaped = text.replace(/\\'/g, "'").replace(/\\"/g, '"');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(unescaped)}`;
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

async function run() {
    let content = fs.readFileSync('components/help/HelpContentEN.tsx', 'utf8');
    
    // Quick regex to extract strings between > and <
    let parts = content.split(/(>)([^<]*?)(<)/g);
    
    for (let lang of ['it', 'es']) {
        let tempParts = [...parts];
        for (let i = 0; i < tempParts.length; i++) {
           let part = tempParts[i];
           if (i % 4 === 2) { // The text nodes are at index 2, 6, 10...
               let text = part.trim();
               if (text === '' || !(/[a-zA-Z]/.test(text))) continue;
               
               let translated = await translateText(text, lang);
               
               if (translated.includes("VereTka")) {
                   translated = translated.replace(/veretka|Veretka/gi, "VereTka");
               }
               
               tempParts[i] = part.replace(text, translated);
               await new Promise(r => setTimeout(r, 100)); // avoid rate limit
           }
        }
        
        // fix the imports and function name
        let out = tempParts.join('');
        out = out.replace('export const HelpContentEN', `export const HelpContent${lang.toUpperCase()}`);
        fs.writeFileSync(`components/help/HelpContent${lang.toUpperCase()}.tsx`, out);
        console.log(`Generated ${lang.toUpperCase()}`);
    }
}

run();
