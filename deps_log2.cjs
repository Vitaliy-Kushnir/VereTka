const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const target = `  useEffect(() => {
      cancelShapePreview();
  }, [selectedShapeIds, cancelShapePreview]);`;

const logCode = `  const prevDeps2 = useRef<any[]>([]);
  useEffect(() => {
      if (prevDeps2.current[0] !== selectedShapeIds) console.log('cancelShapePreview effect: selectedShapeIds changed');
      if (prevDeps2.current[1] !== cancelShapePreview) console.log('cancelShapePreview effect: cancelShapePreview changed');
      prevDeps2.current = [selectedShapeIds, cancelShapePreview];
      cancelShapePreview();
  }, [selectedShapeIds, cancelShapePreview]);`;

code = code.replace(target, logCode);
fs.writeFileSync('App.tsx', code);
