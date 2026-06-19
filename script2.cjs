const fs = require('fs');
let code = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');

const tReplace = [
    { from: /title="Вибрати патерн для заповнення фігури\."/g, key: 'prop.title.stipple', en: 'Select pattern to fill the shape.', uk: 'Вибрати патерн для заповнення фігури.' },
    { from: /Примітка: stipple може працювати лише на X11\./g, key: 'props.stippleNote', en: 'Note: stipple may only work on X11.', uk: 'Примітка: stipple може працювати лише на X11.' },
    { from: /title="Увімкнути або вимкнути заливку фігури\."/g, key: 'prop.title.enableFill', en: 'Enable or disable shape fill.', uk: 'Увімкнути або вимкнути заливку фігури.' },
    { from: /title="Колір заливки фігури\."/g, key: 'prop.title.fillColor', en: 'Shape fill color.', uk: 'Колір заливки фігури.' },
    { from: /title="Увімкнути або вимкнути контур фігури\."/g, key: 'prop.title.enableStroke', en: 'Enable or disable shape outline.', uk: 'Увімкнути або вимкнути контур фігури.' },
    { from: /title="Колір контуру фігури\."/g, key: 'prop.title.strokeColor', en: 'Shape outline color.', uk: 'Колір контуру фігури.' },
    { from: /title="Товщина лінії контуру в пікселях\."/g, key: 'prop.title.strokeWidthLine', en: 'Outline line width in pixels.', uk: 'Товщина лінії контуру в пікселях.' },
    { from: /title=\`X-координата вузла \$\{i\}\`/g, key: 'prop.title.nodeX', en: 'title={t(\\'prop.title.nodeX\\', {i})}', uk: 'X-координата вузла {i}' },
    { from: /title=\`Y-координата вузла \$\{i\}\`/g, key: 'prop.title.nodeY', en: 'title={t(\\'prop.title.nodeY\\', {i})}', uk: 'Y-координата вузла {i}' },
    { from: /title="Додати вузол між цим та наступним"/g, key: 'prop.title.addNode', en: 'Add node between this and next.', uk: 'Додати вузол між цим та наступним' },
    { from: /title="X-координата верхнього лівого кута рамки Tkinter\."/g, key: 'prop.title.tkX1', en: 'X-coordinate of top left Tkinter bounding box corner.', uk: 'X-координата верхнього лівого кута рамки Tkinter.' },
    { from: />x1:</g, key: 'props.tkX1', en: '>x1:<', uk: '>x1:<' },
    { from: />y1:</g, key: 'props.tkY1', en: '>y1:<', uk: '>y1:<' },
    { from: />x2:</g, key: 'props.tkX2', en: '>x2:<', uk: '>x2:<' },
    { from: />y2:</g, key: 'props.tkY2', en: '>y2:<', uk: '>y2:<' },
    { from: /title="З'єднати початкову та кінцеву точки\."/g, key: 'prop.title.connectEnds', en: 'Connect start and end points.', uk: "З'єднати початкову та кінцеву точки." },
    { from: /"Популярні Sans-Serif"/g, key: 'fonts.sans' },
    { from: /"Популярні Serif"/g, key: 'fonts.serif' },
    { from: /"Популярні Monospace"/g, key: 'fonts.mono' },
    { from: /"Декоративні"/g, key: 'fonts.decorative' },
];

let ukEdits = '';
let enEdits = '';

tReplace.forEach(r => {
    if (r.en && r.en.includes('title=')) {
        code = code.replace(r.from, r.en);
        ukEdits += `    '${r.key}': '${r.uk.replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key}': 'X-coordinate of node {i}',\n`; // special case for X
        if(r.key === 'prop.title.nodeY') {
            enEdits += `    '${r.key}': 'Y-coordinate of node {i}',\n`;
        }
    } else if (r.en) {
        ukEdits += `    '${r.key}': '${r.uk.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
        enEdits += `    '${r.key}': '${r.en.replace(/>|</g, '').replace(/'/g, "\\'")}',\n`;
        if (r.en.includes('>')) {
            code = code.replace(r.from, ">\"{t('" + r.key + "')}\"<");
        } else if (r.en.includes('label=')) {
            code = code.replace(r.from, "label={t('" + r.key + "')}");
        } else if (r.from.source.includes('Примітка')) {
            code = code.replace(r.from, "{t('" + r.key + "')}");
        } else {
            code = code.replace(r.from, "title={t('" + r.key + "')}");
        }
    }
});

let transCode = fs.readFileSync('lib/translations.ts', 'utf8');
transCode = transCode.replace(/'props\.splinesteps': 'Кроки сплайна',/g, "'props.splinesteps': 'Кроки сплайна',\n" + ukEdits);
transCode = transCode.replace(/'props\.splinesteps': 'Spline Steps',/g, "'props.splinesteps': 'Spline Steps',\n" + enEdits);

fs.writeFileSync('lib/translations.ts', transCode);
fs.writeFileSync('components/PropertyEditor.tsx', code);

console.log('Translated the very last remaining texts in PropertyEditor.');
