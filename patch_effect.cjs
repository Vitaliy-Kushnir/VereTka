const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetEffect = `const [alignRelativeTo, setAlignRelativeTo] = useState<'selection' | 'canvas'>('selection');`;
const insertEffect = `const [alignRelativeTo, setAlignRelativeTo] = useState<'selection' | 'canvas'>('selection');

    useEffect(() => {
        if (isDistributingPath) {
            setAlignRelativeTo('canvas');
        }
    }, [isDistributingPath]);`;

code = code.replace(targetEffect, insertEffect);
fs.writeFileSync('App.tsx', code);
console.log('added useEffect');
