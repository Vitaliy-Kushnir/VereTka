const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const target = `  useEffect(() => {
    if (generatorType === 'local' && isProjectActive) {`;

const logCode = `  const prevDeps = useRef<any[]>([]);
  useEffect(() => {
    const currentDeps = [displayedShapes, shapes, canvasWidth, canvasHeight, canvasBgColor, generatorType, projectName, isProjectActive, canvasVarName, autoGenerateComments, generateTkinterTags, activeCheats, outlineWithFill, t];
    const changedIndices = [];
    currentDeps.forEach((dep, i) => {
      if (prevDeps.current[i] !== dep) changedIndices.push(i);
    });
    if (changedIndices.length > 0) {
      console.log('Deps changed in generation effect:', changedIndices);
    }
    prevDeps.current = currentDeps;

    if (generatorType === 'local' && isProjectActive) {`;

code = code.replace(target, logCode);
fs.writeFileSync('App.tsx', code);
