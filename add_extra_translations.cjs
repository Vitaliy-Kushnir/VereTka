const fs = require('fs');

const extraStrings = {
    'welcome.action.cloud': 'Хмарна галерея',
    'welcome.action.cloudDesc': 'Перегляд та відкриття спільних та власних хмарних проєктів.',
    'menu.file.publishCloud': 'Опублікувати в хмарі...',
    'toolbar.cloudGallery': 'Галерея & Сховище',
    'toolbar.cloudGalleryDesc': 'Хмарне сховище, персональний кабінет та галерея проєктів'
};

async function translateText(text, targetLang) {
    if (!text || text.trim() === '') return text;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        return json[0].map(x => x[0]).join('');
    } catch (e) {
        return text;
    }
}

async function main() {
    const langs = ['en', 'it', 'es', 'de', 'fr'];
    let allTranslations = { uk: extraStrings };
    
    for (const lang of langs) {
        allTranslations[lang] = {};
        for (const [key, val] of Object.entries(extraStrings)) {
            let translated = await translateText(val, lang);
            allTranslations[lang][key] = translated;
        }
        await new Promise(r => setTimeout(r, 500));
    }
    
    let tsFile = fs.readFileSync('lib/translations.ts', 'utf-8');
    const lines = tsFile.split('\n');
    
    for (const lang of ['uk', ...langs]) {
        const langIndex = lines.findIndex(l => l.startsWith(`  ${lang}: {`));
        if (langIndex !== -1) {
            let newLines = [];
            for (const [key, val] of Object.entries(allTranslations[lang])) {
                // If the key already exists, we should replace it or delete the old one.
                // Let's just remove the existing line if it's there
                for(let i = 0; i < lines.length; i++) {
                   if(lines[i].includes(`'${key}':`)) {
                       lines[i] = ""; // remove
                   }
                }
                const escapedValue = (val || '').replace(/'/g, "\\'").replace(/\n/g, "\\n");
                newLines.push(`    '${key}': '${escapedValue}',`);
            }
            lines.splice(langIndex + 1, 0, ...newLines);
        }
    }
    
    fs.writeFileSync('lib/translations.ts', lines.filter(l => l !== "").join('\n'));
    console.log("Translations injected.");
}

main();
