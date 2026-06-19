const fs = require('fs');
['components/CheatCodeModal.tsx', 'components/SaveCodeModal.tsx', 'components/PreviewModal.tsx', 'components/StatusBar.tsx', 'components/WelcomeScreen.tsx'].forEach(file => {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes('useLanguage')) {
        code = code.replace("import React", "import React, {useContext} from 'react';\nimport { useLanguage } from '../LanguageContext';");
    }
    
    // Inject t if it's not there
    let lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const ') && lines[i].includes('React.FC') && lines[i].includes('=> {')) {
            if (!lines[i + 1].includes('const { t } = useLanguage();')) {
                lines.splice(i + 1, 0, '    const { t } = useLanguage();');
            }
            break;
        }
        else if (lines[i].includes('function ') && lines[i].includes('(') && lines[i].includes(') {')) {
            if (!lines[i + 1].includes('const { t } = useLanguage();')) {
                lines.splice(i + 1, 0, '    const { t } = useLanguage();');
            }
            break;
        }
    }
    fs.writeFileSync(file, lines.join('\n'));
});
console.log('done inject useLanguage');
