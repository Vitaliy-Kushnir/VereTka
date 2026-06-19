const fs = require('fs');

const pEditorCode = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');
fs.writeFileSync('components/PropertyEditor.tsx', pEditorCode.replace("<//Label>", "</Label>"));

const files = [
    'components/Canvas.tsx',
    'components/PreviewModal.tsx',
    'components/NewProjectModal.tsx',
    'components/ConfirmationModal.tsx',
    'components/AboutModal.tsx',
    'components/SaveAsModal.tsx',
    'components/SaveCodeModal.tsx',
    'components/StatusBar.tsx',
    'components/CheatCodeModal.tsx',
    'components/FeedbackModal.tsx',
    'components/SelectionControls.tsx'
];

files.forEach(f => {
    if(!fs.existsSync(f)) return;
    let code = fs.readFileSync(f, 'utf8');
    code = code.replace(/from \'\.\.\/LanguageContext\'/g, "from './LanguageContext'");
    fs.writeFileSync(f, code);
});
console.log('done fixes again');
