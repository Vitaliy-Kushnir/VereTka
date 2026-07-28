const fs = require('fs');

async function translateText(text, targetLang) {
    if (!text || text.trim() === '') return text;
    // Free Google Translate API (URL format)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        return json[0].map(x => x[0]).join('');
    } catch (e) {
        console.error("Failed to translate:", text, e.message);
        return text;
    }
}

async function main() {
    const enDict = require('./en_block.cjs');
    const deDict = {};
    const frDict = {};
    
    const keys = Object.keys(enDict);
    console.log(`Translating ${keys.length} keys...`);
    
    // Process in batches
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
        const batchKeys = keys.slice(i, i + batchSize);
        await Promise.all(batchKeys.map(async (key) => {
            const val = enDict[key];
            if (typeof val === 'string') {
                deDict[key] = await translateText(val, 'de');
                frDict[key] = await translateText(val, 'fr');
            } else {
                deDict[key] = val;
                frDict[key] = val;
            }
        }));
        if (i % 50 === 0) console.log(`Progress: ${i} / ${keys.length}`);
    }
    
    fs.writeFileSync('de_dict.json', JSON.stringify(deDict, null, 2));
    fs.writeFileSync('fr_dict.json', JSON.stringify(frDict, null, 2));
    console.log("Translation complete!");
}

main();
