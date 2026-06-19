const fs = require('fs');

let code = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');

const tReplace = [
    { from: /title="Y-координата верхнього лівого кута рамки Tkinter\."/g, key: 'prop.title.tkY1', en: 'Y-coordinate of top left Tkinter bounding box corner.', uk: 'Y-координата верхнього лівого кута рамки Tkinter.' },
    { from: /title="X-координата нижнього правого кута рамки Tkinter\."/g, key: 'prop.title.tkX2', en: 'X-coordinate of bottom right Tkinter bounding box corner.', uk: 'X-координата нижнього правого кута рамки Tkinter.' },
    { from: /title="Y-координата нижнього правого кута рамки Tkinter\."/g, key: 'prop.title.tkY2', en: 'Y-coordinate of bottom right Tkinter bounding box corner.', uk: 'Y-координата нижнього правого кута рамки Tkinter.' },
    { from: /title="Стан видимості та інтерактивності об'єкта\."/g, key: 'prop.title.state', en: 'Visibility and interactivity state of object.', uk: "Стан видимості та інтерактивності об'єкта." },
    { from: /title="Стиль з'єднання сегментів лінії\."/g, key: 'prop.title.joinstyle', en: 'Line segment join style.', uk: "Стиль з'єднання сегментів лінії." },
    { from: /title="Визначає, як виглядають кути при з'єднанні ліній\."/g, key: 'prop.title.joinstyleDesc', en: 'Determines how corners look when connecting lines.', uk: "Визначає, як виглядають кути при з'єднанні ліній." },
    { from: /title="Стиль кінців незамкнених ліній\."/g, key: 'prop.title.capstyle', en: 'Cap style of unclosed lines.', uk: 'Стиль кінців незамкнених ліній.' },
    { from: /title="Визначає, як виглядають кінці ліній\."/g, key: 'prop.title.capstyleDesc', en: 'Determines how line ends look.', uk: 'Визначає, як виглядають кінці ліній.' },
    { from: /title="Додати стрілки на кінці лінії\."/g, key: 'prop.title.addArrows', en: 'Add arrows to line ends.', uk: 'Додати стрілки на кінці лінії.' },
    { from: /title="Додати стрілки на початок, кінець або на обидва кінці лінії\."/g, key: 'prop.title.arrowDesc', en: 'Add arrows to start, end, or both ends of the line.', uk: 'Додати стрілки на початок, кінець або на обидва кінці лінії.' },
    { from: />Відступ вістря:</g, key: 'props.arrowTipOffset', en: '>Tip Offset:<', uk: '>Відступ вістря:<' },
    { from: /title="Відстань від кінця лінії до вістря стрілки\."/g, key: 'prop.title.arrowTipOffset', en: 'Distance from line end to arrow tip.', uk: 'Відстань від кінця лінії до вістря стрілки.' },
    { from: />Відступ крил:</g, key: 'props.arrowWingsOffset', en: '>Wings Offset:<', uk: '>Відступ крил:<' },
    { from: /title="Відстань від кінця лінії до найширшої частини стрілки\."/g, key: 'prop.title.arrowWingsOffset', en: 'Distance from line end to the widest part of arrow.', uk: 'Відстань від кінця лінії до найширшої частини стрілки.' },
    { from: />Ширина крила:</g, key: 'props.arrowWingWidth', en: '>Wing Width:<', uk: '>Ширина крила:<' },
    { from: /title="Ширина одного крила стрілки\. Загальна ширина буде вдвічі більшою\."/g, key: 'prop.title.arrowWingWidth', en: 'Width of one arrow wing. Total width will be doubled.', uk: 'Ширина одного крила стрілки. Загальна ширина буде вдвічі більшою.' },
    { from: /title="Кількість сторін або променів у фігури\."/g, key: 'prop.title.sides', en: 'Number of sides or rays in the shape.', uk: 'Кількість сторін або променів у фігури.' },
    { from: />Внутр\. радіус:</g, key: 'props.innerRadius', en: '>Inner Radius:<', uk: '>Внутр. радіус:<' },
    { from: /title="Радіус внутрішніх вершин зірки\."/g, key: 'prop.title.innerRadius', en: 'Radius of inner vertices of the star.', uk: 'Радіус внутрішніх вершин зірки.' },
    { from: />Довжина сторони:</g, key: 'props.sideLength', en: '>Side Length:<', uk: '>Довжина сторони:<' },
    { from: /title="Довжина однієї сторони багатокутника\."/g, key: 'prop.title.sideLength', en: 'Length of one polygon side.', uk: 'Довжина однієї сторони багатокутника.' },
    { from: />Зсув вершини:</g, key: 'props.topOffset', en: '>Top Offset:<', uk: '>Зсув вершини:<' },
    { from: /title="Горизонтальне зміщення верхньої вершини відносно центру основи\."/g, key: 'prop.title.topOffset', en: 'Horizontal offset of the top vertex relative to the base center.', uk: 'Горизонтальне зміщення верхньої вершини відносно центру основи.' },
    { from: /label="Симетрична:"/g, key: 'props.symmetric', en: 'label="Symmetric:"', uk: 'label="Симетрична:"' },
    { from: /title="Зробити зміщення верхніх кутів однаковим\."/g, key: 'prop.title.symmetric', en: 'Make the offset of top corners equal.', uk: 'Зробити зміщення верхніх кутів однаковим.' },
    { from: />Зсув зліва \(%\):</g, key: 'props.offsetL', en: '>Left Offset (%):<', uk: '>Зсув зліва (%):<' },
    { from: /title="Зміщення верхнього лівого кута всередину у відсотках від ширини\."/g, key: 'prop.title.offsetL', en: 'Offset of the top left corner inwards in percentage of width.', uk: 'Зміщення верхнього лівого кута всередину у відсотках від ширини.' },
    { from: />Зсув справа \(%\):</g, key: 'props.offsetR', en: '>Right Offset (%):<', uk: '>Зсув справа (%):<' },
    { from: /title="Зміщення верхнього правого кута всередину у відсотках від ширини\."/g, key: 'prop.title.offsetR', en: 'Offset of the top right corner inwards in percentage of width.', uk: 'Зміщення верхнього правого кута всередину у відсотках від ширини.' },
    { from: />Кут \(º\):</g, key: 'props.angle', en: '>Angle (º):<', uk: '>Кут (º):<' },
    { from: /title="Кут нахилу бічних сторін \(90 градусів = прямокутник\)\."/g, key: 'prop.title.angle', en: 'Tilt angle of side edges (90 degrees = rectangle).', uk: 'Кут нахилу бічних сторін (90 градусів = прямокутник).' },
];

let ukEdits = '';
let enEdits = '';

tReplace.forEach(r => {
    ukEdits += `    '${r.key}': '${r.uk.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
    enEdits += `    '${r.key}': '${r.en.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
    if (r.en.includes('>')) {
        code = code.replace(r.from, ">\"{t('" + r.key + "')}\"<");
    } else if (r.en.includes('label=')) {
        code = code.replace(r.from, "label={t('" + r.key + "')}");
    } else {
        code = code.replace(r.from, "title={t('" + r.key + "')}");
    }
});

code = code.replace(/'Популярні Sans-Serif'/g, "t('fonts.sans')");
code = code.replace(/'Популярні Serif'/g, "t('fonts.serif')");
code = code.replace(/'Популярні Monospace'/g, "t('fonts.mono')");
code = code.replace(/'Декоративні'/g, "t('fonts.decorative')");

ukEdits += `    'fonts.sans': 'Популярні Sans-Serif',
    'fonts.serif': 'Популярні Serif',
    'fonts.mono': 'Популярні Monospace',
    'fonts.decorative': 'Декоративні',
`;
enEdits += `    'fonts.sans': 'Popular Sans-Serif',
    'fonts.serif': 'Popular Serif',
    'fonts.mono': 'Popular Monospace',
    'fonts.decorative': 'Decorative',
`;

code = code.replace(/'Ваш браузер або середовище не підтримує завантаження локальних шрифтів\.'/g, "t('fonts.error.notSupported')");
code = code.replace(/'Локальні шрифти не знайдено або дозвіл не було надано\.'/g, "t('fonts.error.notFound')");
code = code.replace(/`Завантажено \$\{uniqueSystemFonts.length\} нових системних шрифтів\.`/g, "t('fonts.success.loaded').replace('{count}', uniqueSystemFonts.length.toString())");
code = code.replace(/'Нових унікальних системних шрифтів не знайдено\.'/g, "t('fonts.success.noNew')");
code = code.replace(/'Помилка під час завантаження системних шрифтів:'/g, "t('fonts.error.loading')");
code = code.replace(/'Не вдалося завантажити шрифти\. Дивіться консоль для деталей\.'/g, "t('fonts.error.details')");
code = code.replace(/'Доступ до шрифтів заблоковано політикою безпеки середовища\.'/g, "t('fonts.error.blocked')");
code = code.replace(/'Ви відхилили дозвіл на доступ до шрифтів\.'/g, "t('fonts.error.denied')");

ukEdits += `    'fonts.error.notSupported': 'Ваш браузер або середовище не підтримує завантаження локальних шрифтів.',
    'fonts.error.notFound': 'Локальні шрифти не знайдено або дозвіл не було надано.',
    'fonts.success.loaded': 'Завантажено {count} нових системних шрифтів.',
    'fonts.success.noNew': 'Нових унікальних системних шрифтів не знайдено.',
    'fonts.error.loading': 'Помилка під час завантаження системних шрифтів:',
    'fonts.error.details': 'Не вдалося завантажити шрифти. Дивіться консоль для деталей.',
    'fonts.error.blocked': 'Доступ до шрифтів заблоковано політикою безпеки середовища.',
    'fonts.error.denied': 'Ви відхилили дозвіл на доступ до шрифтів.',
`;

enEdits += `    'fonts.error.notSupported': 'Your browser or environment does not support loading local fonts.',
    'fonts.error.notFound': 'Local fonts not found or permission not granted.',
    'fonts.success.loaded': 'Loaded {count} new system fonts.',
    'fonts.success.noNew': 'No new unique system fonts found.',
    'fonts.error.loading': 'Error loading system fonts:',
    'fonts.error.details': 'Failed to load fonts. Check console for details.',
    'fonts.error.blocked': 'Font access is blocked by environment security policy.',
    'fonts.error.denied': 'You denied permission to access fonts.',
`;

let transCode = fs.readFileSync('lib/translations.ts', 'utf8');
transCode = transCode.replace(/'props\.splinesteps': 'Кроки сплайна',/g, "'props.splinesteps': 'Кроки сплайна',\n" + ukEdits);
transCode = transCode.replace(/'props\.splinesteps': 'Spline Steps',/g, "'props.splinesteps': 'Spline Steps',\n" + enEdits);

fs.writeFileSync('lib/translations.ts', transCode);
fs.writeFileSync('components/PropertyEditor.tsx', code);

console.log('Translated the rest of properties.');
