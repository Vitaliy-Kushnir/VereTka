const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add states
const stateMatch = `const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);`;
const stateReplace = `const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [reorderConfirmInfo, setReorderConfirmInfo] = useState<{
      draggedId: string,
      targetId: string,
      position: 'top' | 'bottom',
      action: 'add' | 'remove',
      groupId: string
  } | null>(null);
  const [extractConfirmInfo, setExtractConfirmInfo] = useState<boolean>(false);`;
code = code.replace(stateMatch, stateReplace);

// Add ConfirmationModal import if not exists
if (!code.includes('ConfirmationModal')) {
    code = code.replace(`import PropertyEditor from './components/PropertyEditor';`, `import PropertyEditor from './components/PropertyEditor';\nimport ConfirmationModal from './components/ConfirmationModal';`);
}

fs.writeFileSync('App.tsx', code);
console.log("States added.");
