const fs = require('fs');

let tsFile = fs.readFileSync('lib/translations.ts', 'utf-8');
tsFile = tsFile.replace(/Увага: Пароль є обов’язковим для захисту вашої скрині!\nБудь ласка, введіть пароль/g, 'Увага: Пароль є обов’язковим для захисту вашої скрині!\\nБудь ласка, введіть пароль');
tsFile = tsFile.replace(/Сховище для спільних проектів.\\n• Чудовий вибір для/g, 'Сховище для спільних проектів.\\n• Чудовий вибір для');

// To be safe, let's just do a regex replace on any newline that is inside the newly inserted block.
// Wait, an easier way is to just generate the string again, but this time replacing \n with \\n

const extracted = JSON.parse(fs.readFileSync('extracted.json', 'utf-8'));
let newUkLines = [];
for (const [key, value] of Object.entries(extracted)) {
    let escapedValue = value.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    newUkLines.push(`    '${key}': '${escapedValue}',`);
}

// But wait, the file already has the bad lines. We need to restore `lib/translations.ts` to its original state before injecting again, or just fix it manually using git.
