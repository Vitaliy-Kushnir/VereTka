const fs = require('fs');

const replaces = [
  // SaveCodeModal
  { file: 'components/SaveCodeModal.tsx', from: /<h2 className=\"text-xl font-bold text-\\[var\(--text-primary\)\\]\">Зберегти код як...<\\/h2>/g, to: '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\\\'code.saveFileAs\\\')}</h2>', key: 'code.saveFileAs', en: 'Save Code As...', uk: 'Зберегти код як...' },
  { file: 'components/SaveCodeModal.tsx', from: /aria-label=\"Закрити\"/g, to: 'aria-label={t(\\\'action.close\\\')}' },
  { file: 'components/SaveCodeModal.tsx', from: /<p className=\"text-sm text-\\[var\(--text-secondary\)\\]\">Задайте назву та оберіть необхідне розширення \\(тип\\) файлу\\.<\\/p>/g, to: '<p className="text-sm text-[var(--text-secondary)]">{t(\\\'code.saveDesc\\\')}</p>', key: 'code.saveDesc', en: 'Set a name and select the desired file extension (type).', uk: 'Задайте назву та оберіть необхідне розширення (тип) файлу.' },
  { file: 'components/SaveCodeModal.tsx', from: /<Label htmlFor=\"codeFileName\" title=\"Введіть назву для вашого файлу\\.\">Назва файлу:<\\/Label>/g, to: '<Label htmlFor="codeFileName" title={t(\\\'code.fileNameDesc\\\')}>{t(\\\'code.fileName\\\')}</Label>', key: 'code.fileNameDesc', en: 'Enter a name for your file.', uk: 'Введіть назву для вашого файлу.', key2: 'code.fileName', en2: 'File Name:', uk2: 'Назва файлу:' },
  { file: 'components/SaveCodeModal.tsx', from: /title=\"Вибрати розширення файлу\"/g, to: 'title={t(\\\'code.selectExt\\\')}', key: 'code.selectExt', en: 'Select file extension', uk: 'Вибрати розширення файлу' },
  { file: 'components/SaveCodeModal.tsx', from: /label=\"Зберігати із номерами рядків\"/g, to: 'label={t(\\\'code.saveLineNumbers\\\')}', key: 'code.saveLineNumbers', en: 'Save with line numbers', uk: 'Зберігати із номерами рядків' },
  { file: 'components/SaveCodeModal.tsx', from: /title=\"Додати номери рядків на початок кожного рядка у текстовому файлі\"/g, to: 'title={t(\\\'code.saveLineNumbersDesc\\\')}', key: 'code.saveLineNumbersDesc', en: 'Add line numbers to the beginning of each line in the text file', uk: 'Додати номери рядків на початок кожного рядка у текстовому файлі' },
  { file: 'components/SaveCodeModal.tsx', from: />Скасувати</g, to: '>{t(\\\'action.cancel\\\')}<' },
  { file: 'components/SaveCodeModal.tsx', from: />Зберегти</g, to: '>{t(\\\'action.save\\\')}<' },

  // CheatCodeModal
  { file: 'components/CheatCodeModal.tsx', from: /showNotification\\(\\'Усі активні чит-коди скинуто\\.\\', \\'info\\'\\);/g, to: 'showNotification(t(\\\'cheat.reset\\\'), \\\'info\\\');', key: 'cheat.reset', en: 'All active cheat codes have been reset.', uk: 'Усі активні чит-коди скинуто.' },
  { file: 'components/CheatCodeModal.tsx', from: /showNotification\\(\\`Чит-код \"\\$\\{trimmedValue\\}\" активовано!\\`, \\'info\\'\\);/g, to: 'showNotification(t(\\\'cheat.activated\\\', { code: trimmedValue }), \\\'info\\\');', key: 'cheat.activated', en: 'Cheat code "{code}" activated!', uk: 'Чит-код "{code}" активовано!' },
  { file: 'components/CheatCodeModal.tsx', from: /showNotification\\(\\`Невірний чит-код: \"\\$\\{trimmedValue\\}\"\\`, \\'error\\'\\);/g, to: 'showNotification(t(\\\'cheat.invalid\\\', { code: trimmedValue }), \\\'error\\\');', key: 'cheat.invalid', en: 'Invalid cheat code: "{code}"', uk: 'Невірний чит-код: "{code}"' },
  { file: 'components/CheatCodeModal.tsx', from: /showNotification\\(\\'Неправильний формат коду\\. Очікується \"#000\"\\.\\', \\'error\\'\\);/g, to: 'showNotification(t(\\\'cheat.formatError\\\'), \\\'error\\\');', key: 'cheat.formatError', en: 'Invalid format. Expected "#000".', uk: 'Неправильний формат коду. Очікується "#000".' },
  { file: 'components/CheatCodeModal.tsx', from: /<h2 className=\"text-xl font-bold text-\\[var\(--text-primary\)\\]\">Введення чит-коду<\\/h2>/g, to: '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\\\'cheat.title\\\')}</h2>', key: 'cheat.title', en: 'Enter cheat code', uk: 'Введення чит-коду' },
  { file: 'components/CheatCodeModal.tsx', from: /aria-label=\"Закрити\"/g, to: 'aria-label={t(\\\'action.close\\\')}' },
  { file: 'components/CheatCodeModal.tsx', from: /<p className=\"text-sm text-center text-\\[var\(--text-tertiary\)\\]\">Введіть код у форматі #000<\\/p>/g, to: '<p className="text-sm text-center text-[var(--text-tertiary)]">{t(\\\'cheat.desc\\\')}</p>', key: 'cheat.desc', en: 'Enter code in format #000', uk: 'Введіть код у форматі #000' },
  { file: 'components/CheatCodeModal.tsx', from: />Скасувати</g, to: '>{t(\\\'action.cancel\\\')}<' },
  { file: 'components/CheatCodeModal.tsx', from: />Активувати</g, to: '>{t(\\\'cheat.activate\\\')}<', key: 'cheat.activate', en: 'Activate', uk: 'Активувати' },

  // PreviewModal
  { file: 'components/PreviewModal.tsx', from: /title=\\{\\`Попередній перегляд: \\$\\{projectName\\}\\`\\}/g, to: 'title={`${t(\\\'preview.title\\\')}: ${projectName}`}', key: 'preview.title', en: 'Preview', uk: 'Попередній перегляд' },
  { file: 'components/PreviewModal.tsx', from: />Попередній перегляд: \\{projectName\\}</g, to: '>{t(\\\'preview.title\\\')}: {projectName}<' },

  // StatusBar
  { file: 'components/StatusBar.tsx', from: /title=\"Показувати\\/приховувати координати біля курсора\"/g, to: 'title={t(\\\'status.toggleCoords\\\')}', key: 'status.toggleCoords', en: 'Show/hide coordinates near cursor', uk: 'Показувати/приховувати координати біля курсора' },
  { file: 'components/StatusBar.tsx', from: /title=\"Координати курсора на полотні\"/g, to: 'title={t(\\\'status.coords\\\')}', key: 'status.coords', en: 'Cursor coordinates on canvas', uk: 'Координати курсора на полотні' },
  { file: 'components/StatusBar.tsx', from: /title=\\{\\`Масштаб: \\$\\{formattedZoom\\}\\`\\}/g, to: 'title={`${t(\\\'status.zoom\\\')}: ${formattedZoom}`}', key: 'status.zoom', en: 'Zoom', uk: 'Масштаб' },
  { file: 'components/StatusBar.tsx', from: /title=\"Натисніть, щоб змінити масштаб\"/g, to: 'title={t(\\\'status.zoomClick\\\')}', key: 'status.zoomClick', en: 'Click to change zoom', uk: 'Натисніть, щоб змінити масштаб' },
  { file: 'components/StatusBar.tsx', from: /title=\"Показати виділений об\\'єкт\"/g, to: 'title={t(\\\'status.showSelected\\\')}', key: 'status.showSelected', en: 'Show selected object', uk: 'Показати виділений об\\'єкт' },

  // WelcomeScreen
  { file: 'components/WelcomeScreen.tsx', from: /alt=\\{\\`Ескіз \\$\\{project\\.name\\}\\`\\}/g, to: 'alt={`${t(\\\'welcome.thumbnail\\\')} ${project.name}`}', key: 'welcome.thumbnail', en: 'Thumbnail', uk: 'Ескіз' },

  // FormControls
  { file: 'components/FormControls.tsx', from: />Скасувати<\\/button>/g, to: '>{t(\\'action.cancel\\')}</button>' },
  { file: 'components/FormControls.tsx', from: />Застосувати<\\/button>/g, to: '>{t(\\'action.apply\\')}</button>' },
  { file: 'components/FormControls.tsx', from: />Усі кольори Tk\\.\\.\\.</g, to: '>{t(\\'color.allColorsShort\\')}<' },
];

let ukEdits = '';
let enEdits = '';

replaces.forEach(r => {
    let code = fs.readFileSync(r.file, 'utf8');
    
    // Inject useLanguage if not present (only for modals/components that use components)
    if (r.file.includes('Modal') || r.file.includes('StatusBar') || r.file.includes('WelcomeScreen')) {
        if (!code.includes('useLanguage')) {
            code = code.replace("import React", "import React, {useContext} from 'react';\nimport { useLanguage } from '../LanguageContext';\n//");
        }
        // inject constant
        if (!code.includes('const { t } = useLanguage();')) {
             if (r.file.includes('StatusBar')) {
                code = code.replace("const StatusBar = ({", "const StatusBar = ({\n  // \n}) => {\n  const { t } = useLanguage();\n  //");
                code = code.replace("const StatusBar = (props) => {", "const StatusBar = (props) => {\n  const { t } = useLanguage();");
             }
        }
    }

    code = code.replace(r.from, r.to);

    if (r.key) {
        ukEdits += `    '${r.key}': '${r.uk.replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key}': '${r.en.replace(/'/g, "\\'")}',\n`;
    }
    if (r.key2) {
        ukEdits += `    '${r.key2}': '${r.uk2.replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key2}': '${r.en2.replace(/'/g, "\\'")}',\n`;
    }

    fs.writeFileSync(r.file, code);
});

let transCode = fs.readFileSync('lib/translations.ts', 'utf8');
transCode = transCode.replace(/'export\\.action': 'Експорт',/g, "'export.action': 'Експорт',\n" + ukEdits);
transCode = transCode.replace(/'export\\.action': 'Export',/g, "'export.action': 'Export',\n" + enEdits);

fs.writeFileSync('lib/translations.ts', transCode);
console.log('done smaller files translation');
