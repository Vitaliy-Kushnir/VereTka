const fs = require('fs');

// 1. translations.ts
let tCode = fs.readFileSync('lib/translations.ts', 'utf8');
tCode = tCode.replace(/З'єднати/g, "З\\'єднати");
tCode = tCode.replace(/об'єкт/g, "об\\'єкт");
tCode = tCode.replace(/зв'яз/g, "зв\\'яз");
fs.writeFileSync('lib/translations.ts', tCode);

// 2. PropertyEditor.tsx
let pCode = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');
pCode = pCode.replace("t('fonts.sans'):", "[t('fonts.sans')]:");
pCode = pCode.replace("t('fonts.serif'):", "[t('fonts.serif')]:");
pCode = pCode.replace("t('fonts.mono'):", "[t('fonts.mono')]:");
pCode = pCode.replace("t('fonts.decorative'):", "[t('fonts.decorative')]:");
fs.writeFileSync('components/PropertyEditor.tsx', pCode);

// 3. HelpModal.tsx
let hCode = fs.readFileSync('components/HelpModal.tsx', 'utf8');
hCode = hCode.replace("    const { language, t } = useLanguage();", "    const { language } = useLanguage();");
fs.writeFileSync('components/HelpModal.tsx', hCode);

// 4. Broken imports
const brokenFiles = [
    'components/Canvas.tsx',
    'components/PreviewModal.tsx',
    'components/NewProjectModal.tsx',
    'components/ConfirmationModal.tsx',
    'components/AboutModal.tsx',
    'components/SaveAsModal.tsx',
    'components/SaveCodeModal.tsx',
    'components/StatusBar.tsx',
    'components/CheatCodeModal.tsx',
    'components/FeedbackModal.tsx'
];

brokenFiles.forEach(f => {
    let code = fs.readFileSync(f, 'utf8');
    code = code.replace("import { useLanguage } from '../LanguageContext';, {", "import { useLanguage } from '../LanguageContext';\nimport {");
    code = code.replace("import { useLanguage } from '../LanguageContext'; from 'react';", "import { useLanguage } from '../LanguageContext';");
    fs.writeFileSync(f, code);
});
console.log('fixes done');
