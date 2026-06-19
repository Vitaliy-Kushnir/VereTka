const fs = require('fs');

let code = fs.readFileSync('components/FormControls.tsx', 'utf8');

const tReplace = [
    { from: /<h2 className=\"text-xl font-bold text-\\[var\(--text-primary\)\\]\">Усі кольори Tkinter<\\/h2>/g, en: '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\\\'color.allColors\\\')}</h2>', key: 'color.allColors', key_en: 'All Tkinter Colors', key_uk: 'Усі кольори Tkinter' },
    { from: /placeholder=\"Пошук за назвою або HEX...\"/g, en: 'placeholder={t(\\\'color.search\\\')}', key: 'color.search', key_en: 'Search by name or HEX...', key_uk: 'Пошук за назвою або HEX...' },
    { from: /title=\"Очистити пошук\"/g, en: 'title={t(\\\'color.clearSearch\\\')}', key: 'color.clearSearch', key_en: 'Clear search', key_uk: 'Очистити пошук' },
    { from: /aria-label=\"Очистити пошук\"/g, en: 'aria-label={t(\\\'color.clearSearch\\\')}' },
    { from: /aria-label=\"Закрити\"/g, en: 'aria-label={t(\\\'action.close\\\')}', key: 'action.close', key_en: 'Close', key_uk: 'Закрити' },
    { from: />Сортувати:</g, en: '>{t(\\\'color.sortBy\\\')}<', key: 'color.sortBy', key_en: 'Sort by:', key_uk: 'Сортувати:' },
    { from: /label=\"За групою\"/g, en: 'label={t(\\\'color.byGroup\\\')}', key: 'color.byGroup', key_en: 'By group', key_uk: 'За групою' },
    { from: /title=\"Сортувати за логічними групами кольорів\"/g, en: 'title={t(\\\'color.byGroupDesc\\\')}', key: 'color.byGroupDesc', key_en: 'Sort by logical color groups', key_uk: 'Сортувати за логічними групами кольорів' },
    { from: /label=\"За алфавітом \\(A-Z\\)\"/g, en: 'label={t(\\\'color.byAlpha\\\')}', key: 'color.byAlpha', key_en: 'Alphabetical (A-Z)', key_uk: 'За алфавітом (A-Z)' },
    { from: /title=\"Сортувати за назвою в алфавітному порядку\"/g, en: 'title={t(\\\'color.byAlphaDesc\\\')}', key: 'color.byAlphaDesc', key_en: 'Sort by name alphabetically', key_uk: 'Сортувати за назвою в алфавітному порядку' },
    { from: /label=\"За кодом \\(#\\)\"/g, en: 'label={t(\\\'color.byHex\\\')}', key: 'color.byHex', key_en: 'By code (#)', key_uk: 'За кодом (#)' },
    { from: /title=\"Сортувати за шістнадцятковим кодом\"/g, en: 'title={t(\\\'color.byHexDesc\\\')}', key: 'color.byHexDesc', key_en: 'Sort by hexadecimal code', key_uk: 'Сортувати за шістнадцятковим кодом' },
    { from: />Вибрано:</g, en: '>{t(\\\'color.selected\\\')}<', key: 'color.selected', key_en: 'Selected:', key_uk: 'Вибрано:' },
    { from: />Нічого</g, en: '>{t(\\\'color.none\\\')}<', key: 'color.none', key_en: 'Nothing', key_uk: 'Нічого' },
    { from: />Скасувати</g, en: '>{t(\\\'action.cancel\\\')}<', key: 'action.cancel', key_en: 'Cancel', key_uk: 'Скасувати' },
    { from: />Застосувати</g, en: '>{t(\\\'action.apply\\\')}<', key: 'action.apply', key_en: 'Apply', key_uk: 'Застосувати' },
    { from: /\"HEX-код у форматі #RRGGBB або #RGB\\. Дозволені символи: 0-9, a-f\\.\"/g, en: 't(\\\'color.hexHint\\\')', key: 'color.hexHint', key_en: 'HEX-code in #RRGGBB or #RGB format. Allowed chars: 0-9, a-f.', key_uk: 'HEX-код у форматі #RRGGBB або #RGB. Дозволені символи: 0-9, a-f.' },
    { from: /\"Введіть назву кольору \\(напр\\., \\'Red\\', \\'LightBlue\\'\\) або HEX-код\\.\"/g, en: 't(\\\'color.nameHint\\\')', key: 'color.nameHint', key_en: 'Enter color name (e.g. \\\'Red\\\', \\\'LightBlue\\\') or HEX-code.', key_uk: 'Введіть назву кольору (напр., \\\'Red\\\', \\\'LightBlue\\\') або HEX-код.' },
    { from: /title=\\{\\`Перетворити на \\$\\{convertibleTo === \\'hex\\' \\? \\'HEX-код\\' : \\'назву\\'\\}\\`\\}/g, en: 'title={convertibleTo === \\\'hex\\\' ? t(\\\'color.toHex\\\') : t(\\\'color.toName\\\')}', key: 'color.toHex', key_en: 'Convert to HEX-code', key_uk: 'Перетворити на HEX-код', key2: 'color.toName', key2_en: 'Convert to name', key2_uk: 'Перетворити на назву' },
    { from: /title=\"Скасувати \\(Esc\\)\"/g, en: 'title={t(\\\'action.cancelEsc\\\')}', key: 'action.cancelEsc', key_en: 'Cancel (Esc)', key_uk: 'Скасувати (Esc)' },
    { from: /title=\"Підтвердити \\(Enter\\)\"/g, en: 'title={t(\\\'action.confirmEnter\\\')}', key: 'action.confirmEnter', key_en: 'Confirm (Enter)', key_uk: 'Підтвердити (Enter)' },
    { from: />Не знайдено</g, en: '>{t(\\\'color.notFound\\\')}<', key: 'color.notFound', key_en: 'Not found', key_uk: 'Не знайдено' },
    { from: />Усі кольори Tk\\.\\.\\.</g, en: '>{t(\\\'color.allColorsShort\\\')}<', key: 'color.allColorsShort', key_en: 'All Tk colors...', key_uk: 'Усі кольори Tk...' },
    { from: /title=\"Нестандартний колір\"/g, en: 'title={t(\\\'color.nonStandard\\\')}', key: 'color.nonStandard', key_en: 'Non-standard color', key_uk: 'Нестандартний колір' },
    { from: /message=\\{\\`Колір \"\\$\\{conversionChoice\\.name\\}\" не є стандартним веб-кольором\\. У редакторі він може відображатися чорним\\. Зберегти назву чи перетворити на HEX \\(\\$\\{conversionChoice\\.hex\\}\\) для коректного відображення\\?\\`\\}/g, en: 'message={t(\\\'color.nonStandardMsg\\\', {name: conversionChoice.name, hex: conversionChoice.hex})}', key: 'color.nonStandardMsg', key_en: 'Color "{name}" is not a standard web color and may display as black in the editor. Save as name or convert to HEX ({hex}) for correct display?', key_uk: 'Колір "{name}" не є стандартним веб-кольором. У редакторі він може відображатися чорним. Зберегти назву чи перетворити на HEX ({hex}) для коректного відображення?' },
    { from: /confirmText=\"Перетворити на HEX\"/g, en: 'confirmText={t(\\\'color.toHexConfirm\\\')}', key: 'color.toHexConfirm', key_en: 'Convert to HEX', key_uk: 'Перетворити на HEX' },
    { from: /cancelText=\"Зберегти назву\"/g, en: 'cancelText={t(\\\'color.keepName\\\')}', key: 'color.keepName', key_en: 'Keep name', key_uk: 'Зберегти назву' },
    { from: /name: \"Користувацький\"/g, en: 'name: t(\\\'dash.custom\\\')', key: 'dash.custom', key_en: 'Custom', key_uk: 'Користувацький' },
    { from: /description: \"Власний стиль штрихування\\.\"/g, en: 'description: t(\\\'dash.customDesc\\\')', key: 'dash.customDesc', key_en: 'Custom dash style.', key_uk: 'Власний стиль штрихування.' },
    { from: /title=\"Вибрати готовий стиль штрихування або налаштувати власний\"/g, en: 'title={t(\\\'dash.selectDesc\\\')}', key: 'dash.selectDesc', key_en: 'Select preset dash style or configure custom', key_uk: 'Вибрати готовий стиль штрихування або налаштувати власний' },
];

let ukEdits = '';
let enEdits = '';

tReplace.forEach(r => {
    code = code.replace(r.from, r.en);
    if (r.key) {
        ukEdits += `    '${r.key}': '${r.key_uk.replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key}': '${r.key_en.replace(/'/g, "\\'")}',\n`;
    }
    if (r.key2) {
        ukEdits += `    '${r.key2}': '${r.key2_uk.replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key2}': '${r.key2_en.replace(/'/g, "\\'")}',\n`;
    }
});

// Now we need to inject 'const { t } = useLanguage();' into the appropriate components in FormControls.tsx.
const componentsToUpdate = ['ColorPickerModal', 'ColorPicker', 'DashPicker'];
componentsToUpdate.forEach(comp => {
    code = code.replace(
        new RegExp(`const ${comp}: React\\.FC<[^>]+> = \\([^)]+\\) => \\{`),
        `$&\\n    const { t } = useLanguage();`
    );
     code = code.replace(
        new RegExp(`export const ${comp}: React\\.FC<[^>]+> = \\([^)]+\\) => \\{`),
        `$&\\n    const { t } = useLanguage();`
    );
});

if (!code.includes("import { useLanguage }")) {
   code = code.replace("import ConfirmationModal from './ConfirmationModal';", "import ConfirmationModal from './ConfirmationModal';\nimport { useLanguage } from './LanguageContext';");
}

let transCode = fs.readFileSync('lib/translations.ts', 'utf8');
transCode = transCode.replace(/'apikey\.delete': 'Видалити ключ',/g, "'apikey.delete': 'Видалити ключ',\n" + ukEdits);
transCode = transCode.replace(/'apikey\.delete': 'Delete key',/g, "'apikey.delete': 'Delete key',\n" + enEdits);

fs.writeFileSync('lib/translations.ts', transCode);
fs.writeFileSync('components/FormControls.tsx', code);
console.log('FormControls localized');
