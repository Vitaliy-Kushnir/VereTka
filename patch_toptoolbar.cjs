const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetStrProps = `    textFontSize: number; setTextFontSize: (s: number) => void;
}> = React.memo((props) => {`;
const insertStrProps = `    textFontSize: number; setTextFontSize: (s: number) => void;
    isDistributingPath: boolean;
}> = React.memo((props) => {`;

const targetStrDestruct = `        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear
    } = props;`;
const insertStrDestruct = `        selectedShapes, activeTool, setActiveTool, onGenerate, showGenerateButton, onClear, isDistributingPath
    } = props;`;

if (code.includes(targetStrProps)) {
    code = code.replace(targetStrProps, insertStrProps);
} else { console.log('Props not found'); }

if (code.includes(targetStrDestruct)) {
    code = code.replace(targetStrDestruct, insertStrDestruct);
} else { console.log('Destruct not found'); }

const targetStrUsage = `<TopToolbar
              activeTool={activeTool}`;
const insertStrUsage = `<TopToolbar
              isDistributingPath={!!distributePathState}
              activeTool={activeTool}`;

if (code.includes(targetStrUsage)) {
    code = code.replace(targetStrUsage, insertStrUsage);
} else { console.log('Usage not found'); }

fs.writeFileSync('App.tsx', code);
console.log('patched TopToolbar props');
