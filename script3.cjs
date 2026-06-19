const fs = require('fs');
let code = fs.readFileSync('components/ApiKeyModal.tsx', 'utf8');

const tReplace = [
    { from: /<h2 className=\"text-xl font-bold text-\\[var\(--text-primary\)\\]\">Керування ключем Gemini API<\\/h2>/g, key: 'apikey.title', en: 'Gemini API Key Management', uk: 'Керування ключем Gemini API' },
    { from: /aria-label=\"Закрити\"/g, key: 'action.close', en: 'Close', uk: 'Закрити' },
    { from: /<strong>Важливо:<\\/strong> Ваш ключ API зберігатиметься лише на час поточної сесії і буде видалений після оновлення або закриття сторінки. Він не зберігається назавжди для вашої безпеки./g, key: 'apikey.warning1', en: '<strong>Important:</strong> Your API key will only be stored for the duration of the current session and will be deleted upon refreshing or closing the page. It is not saved permanently for your security.', uk: '<strong>Важливо:</strong> Ваш ключ API зберігатиметься лише на час поточної сесії і буде видалений після оновлення або закриття сторінки. Він не зберігається назавжди для вашої безпеки.' },
    { from: /placeholder=\"Вставте ваш API ключ сюди\"/g, key: 'apikey.placeholder', en: 'Paste your API key here', uk: 'Вставте ваш API ключ сюди' },
    { from: /title=\{isKeyVisible \? \"Приховати ключ\" : \"Показати ключ\"\}/g, key: 'apikey.toggleVisibility' },
    { from: /Де взяти API ключ\?/g, key: 'apikey.whereToGet', en: 'Where to get an API key?', uk: 'Де взяти API ключ?' },
    { from: /← Повернутися до введення ключа/g, key: 'apikey.backToInput', en: '← Back to key input', uk: '← Повернутися до введення ключа' },
    { from: /Як отримати ключ Gemini API/g, key: 'apikey.howToGetTitle', en: 'How to get a Gemini API key', uk: 'Як отримати ключ Gemini API' },
    { from: /Ви можете безкоштовно отримати ключ API для доступу до моделей Gemini у Google AI Studio./g, key: 'apikey.howToGet1', en: 'You can get a free API key to access Gemini models in Google AI Studio.', uk: 'Ви можете безкоштовно отримати ключ API для доступу до моделей Gemini у Google AI Studio.' },
    { from: /<li>Перейдіть на сайт <a href=\"https:\/\/aistudio.google.com\/app\/apikey\" target=\"_blank\" rel=\"noopener noreferrer\" className=\"underline text-\\[var\(--accent-primary\)\\] hover:text-\\[var\(--accent-primary-hover\)\\]\">Google AI Studio<\/a>.<\\/li>/g, key: 'apikey.step1', en: '<li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]">Google AI Studio</a>.</li>', uk: '<li>Перейдіть на сайт <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]">Google AI Studio</a>.</li>' },
    { from: /<li>Увійдіть за допомогою вашого Google акаунту.<\\/li>/g, key: 'apikey.step2', en: '<li>Sign in with your Google account.</li>', uk: '<li>Увійдіть за допомогою вашого Google акаунту.</li>' },
    { from: /<li>На сторінці, що відкриється, натисніть на кнопку <strong>\"Create API key in new project\"<\\/strong>.<\\/li>/g, key: 'apikey.step3', en: '<li>On the opened page, click the <strong>"Create API key in new project"</strong> button.</li>', uk: '<li>На сторінці, що відкриється, натисніть на кнопку <strong>"Create API key in new project"</strong>.</li>' },
    { from: /<li>Через декілька секунд буде згенеровано ваш ключ. Він виглядатиме як довгий рядок з випадкових символів.<\\/li>/g, key: 'apikey.step4', en: '<li>After a few seconds, your key will be generated. It will look like a long string of random characters.</li>', uk: '<li>Через декілька секунд буде згенеровано ваш ключ. Він виглядатиме як довгий рядок з випадкових символів.</li>' },
    { from: /<li>Натисніть на іконку копіювання поруч з ключем.<\\/li>/g, key: 'apikey.step5', en: '<li>Click the copy icon next to the key.</li>', uk: '<li>Натисніть на іконку копіювання поруч з ключем.</li>' },
    { from: /<li>Поверніться сюди та вставте скопійований ключ у поле вище.<\\/li>/g, key: 'apikey.step6', en: '<li>Return here and paste the copied key into the field above.</li>', uk: '<li>Поверніться сюди та вставте скопійований ключ у поле вище.</li>' },
    { from: /<strong>Важливо:<\\/strong> Зберігайте ваш ключ у безпечному місці та не діліться ним ні з ким. Редактор не зберігає ключ на постійній основі і не передає його нікуди, окрім як безпосередньо до Google API при генерації коду./g, key: 'apikey.warning2', en: '<strong>Important:</strong> Keep your key in a safe place and do not share it with anyone. The editor does not save the key permanently and does not transmit it anywhere except directly to the Google API when generating code.', uk: '<strong>Важливо:</strong> Зберігайте ваш ключ у безпечному місці та не діліться ним ні з ким. Редактор не зберігає ключ на постійній основі і не передає його нікуди, окрім як безпосередньо до Google API при генерації коду.' },
    { from: />Видалити ключ</g, key: 'apikey.delete', en: '>Delete key<', uk: '>Видалити ключ<' },
    { from: />Скасувати</g, key: 'action.cancel2', en: '>Cancel<', uk: '>Скасувати<' },
    { from: />Зберегти</g, key: 'action.save', en: '>Save<', uk: '>Зберегти<' },
];

let ukEdits = '';
let enEdits = '';

tReplace.forEach(r => {
    if (r.key === 'apikey.toggleVisibility') {
        ukEdits += `    'apikey.hide': 'Приховати ключ',\n    'apikey.show': 'Показати ключ',\n`;
        enEdits += `    'apikey.hide': 'Hide key',\n    'apikey.show': 'Show key',\n`;
        code = code.replace(r.from, "title={isKeyVisible ? t('apikey.hide') : t('apikey.show')}");
        return;
    }
    ukEdits += `    '${r.key}': '${r.uk.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
    enEdits += `    '${r.key}': '${r.en.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
    
    if (r.en.includes('>')) {
        code = code.replace(r.from, ">\"{t('" + r.key + "')}\"<");
    } else if (r.en.includes('aria-label=')) {
        code = code.replace(r.from, "aria-label={t('" + r.key + "')}");
    } else if (r.en.includes('placeholder=')) {
         code = code.replace(r.from, "placeholder={t('" + r.key + "')}");
    } else if (r.from.source.includes('h2')) {
        code = code.replace(r.from, "<h2 className=\"text-xl font-bold text-[var(--text-primary)]\">{t('" + r.key + "')}</h2>");
    } else if (r.from.source.includes('h3')) {
        code = code.replace(r.from, "{t('" + r.key + "')}");
    } else if (r.from.source.includes('<strong>')) {
        code = code.replace(r.from, "<span dangerouslySetInnerHTML={{ __html: t('" + r.key + "') }} />");
    } else if (r.from.source.includes('<li>')) {
        code = code.replace(r.from, "<span dangerouslySetInnerHTML={{ __html: t('" + r.key + "') }} />");
    } else {
        code = code.replace(r.from, "{t('" + r.key + "')}");
    }
});

if (!code.includes('useLanguage')) {
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useLanguage } from '../LanguageContext';");
    code = code.replace("const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {", "const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {\n    const { t } = useLanguage();");
}

let transCode = fs.readFileSync('lib/translations.ts', 'utf8');
transCode = transCode.replace(/'export\.action': 'Експорт',/g, "'export.action': 'Експорт',\n" + ukEdits);
transCode = transCode.replace(/'export\.action': 'Export',/g, "'export.action': 'Export',\n" + enEdits);

fs.writeFileSync('lib/translations.ts', transCode);
fs.writeFileSync('components/ApiKeyModal.tsx', code);

console.log('Translated ApiKeyModal');
