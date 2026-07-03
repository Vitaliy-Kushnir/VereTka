const fs = require('fs');
let code = fs.readFileSync('lib/translations.ts', 'utf-8');

// For uk
code = code.replace(
    "'tool.distribute.v': 'Розподілити вертикально',",
    "'tool.distribute.v': 'Розподілити вертикально',\n    'tool.distribute.path': 'Розподілити за шляхом',\n    'tool.distribute.path.orient.radial': 'Радіально',\n    'tool.distribute.path.orient.tangent': 'Дотично',\n    'tool.distribute.path.orient.parallel': 'Вздовж лінії',\n    'tool.distribute.path.orient.perpendicular': 'Перпендикулярно',\n    'tool.distribute.path.orient.custom': 'Під кутом',"
);

// For en
code = code.replace(
    "'tool.distribute.v': 'Distribute Vertically',",
    "'tool.distribute.v': 'Distribute Vertically',\n    'tool.distribute.path': 'Distribute by Path',\n    'tool.distribute.path.orient.radial': 'Radial',\n    'tool.distribute.path.orient.tangent': 'Tangent',\n    'tool.distribute.path.orient.parallel': 'Parallel',\n    'tool.distribute.path.orient.perpendicular': 'Perpendicular',\n    'tool.distribute.path.orient.custom': 'Custom',"
);

fs.writeFileSync('lib/translations.ts', code);
console.log('patched translations');
