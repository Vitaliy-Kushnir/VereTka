const fs = require('fs');

let content = fs.readFileSync('lib/translations.ts', 'utf-8');

const ukrainianAdditions = `
    'props.commonTitle': 'Спільні властивості',
    'props.stroke': 'Контур:',
    'props.strokeWidth': 'Товщина контуру:',
    'props.fill': 'Заливка:',
    'props.mixed': 'Різні',
    'props.none': 'Немає',
`;

const englishAdditions = `
    'props.commonTitle': 'Common Properties',
    'props.stroke': 'Stroke:',
    'props.strokeWidth': 'Stroke Width:',
    'props.fill': 'Fill:',
    'props.mixed': 'Mixed',
    'props.none': 'None',
`;

const italianAdditions = `
    'props.commonTitle': 'Proprietà Comuni',
    'props.stroke': 'Tratto:',
    'props.strokeWidth': 'Spessore:',
    'props.fill': 'Riempimento:',
    'props.mixed': 'Misto',
    'props.none': 'Nessuno',
`;

const spanishAdditions = `
    'props.commonTitle': 'Propiedades Comunes',
    'props.stroke': 'Trazo:',
    'props.strokeWidth': 'Grosor:',
    'props.fill': 'Relleno:',
    'props.mixed': 'Mixto',
    'props.none': 'Ninguno',
`;

content = content.replace(/'props\.title': 'Властивості',/, `'props.title': 'Властивості',` + ukrainianAdditions);
content = content.replace(/'props\.title': 'Properties',/, `'props.title': 'Properties',` + englishAdditions);
content = content.replace(/'props\.title': 'Proprietà',/, `'props.title': 'Proprietà',` + italianAdditions);
content = content.replace(/'props\.title': 'Propiedades',/, `'props.title': 'Propiedades',` + spanishAdditions);

fs.writeFileSync('lib/translations.ts', content, 'utf-8');
