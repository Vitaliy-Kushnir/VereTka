const fs = require('fs');

const pEditorCode = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');
fs.writeFileSync('components/PropertyEditor.tsx', pEditorCode.replace(/<\/\/Label>/g, "</Label>"));

const stmCode = fs.readFileSync('components/SaveTemplateModal.tsx', 'utf8');
fs.writeFileSync('components/SaveTemplateModal.tsx', stmCode.replace(/from \'\.\.\/LanguageContext\'/g, "from './LanguageContext'"));

let tCode = fs.readFileSync('lib/translations.ts', 'utf8');
tCode = tCode.replace(/Прив'язка/g, "Прив\\'язка");
tCode = tCode.replace(/об'єкті/g, "об\\'єкті");
tCode = tCode.replace(/об'єктів/g, "об\\'єктів");
fs.writeFileSync('lib/translations.ts', tCode);

console.log('fixes 3');
