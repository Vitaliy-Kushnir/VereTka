const fs = require('fs');

function fixAppTsx() {
  let app = fs.readFileSync('App.tsx', 'utf8');
  
  // Fix state initialization
  app = app.replace(/const \[selectedShapeIds, setSelectedShapeIdss\] = useState<string \| null>\(null\);/g, 'const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);');
  app = app.replace(/const \[selectedShapeIds, setSelectedShapeIds\] = useState<string \| null>\(null\);/g, 'const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);');
  
  // Fix handleSelectShape implementation
  // It needs to support shift click.
  app = app.replace(/const handleSelectShape = useCallback\(\(id: string \| null\) => \{[\s\S]*?\}, \[.*\]\);/, 
    `const handleSelectShape = useCallback((id: string | null, isShiftPressed: boolean = false) => {
    setSelectedShapeIds((prev) => {
      if (!id) return [];
      if (isShiftPressed) {
        return prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      }
      return [id];
    });
    setIsDrawingPolyline(false);
    setPolylinePoints([]);
    setIsDrawingBezier(false);
    setBezierPoints([]);
  }, []);`);

  // Everywhere it sets null -> []
  app = app.replace(/setSelectedShapeIds\(null\)/g, 'setSelectedShapeIds([])');
  
  // Everywhere it sets shape.id -> [shape.id]
  app = app.replace(/setSelectedShapeIds\(shape\.id\)/g, 'setSelectedShapeIds([shape.id])');
  app = app.replace(/setSelectedShapeIds\(newShape\.id\)/g, 'setSelectedShapeIds([newShape.id])');
  app = app.replace(/setSelectedShapeIds\(shapeId\)/g, 'setSelectedShapeIds([shapeId])');

  // selectedShape = shapes.find(...) needs to become selectedShapes
  // In TopToolbar props: selectedShape: Shape | null -> selectedShapes: Shape[]
  app = app.replace(/selectedShapeIds=\{(selectedShapeIds.length > 0)\}/g, 'isShapeSelected={(selectedShapeIds.length > 0)}');
  app = app.replace(/selectedShape: Shape \| null;/g, 'selectedShapes: Shape[];');
  
  app = app.replace(/const selectedShape = shapes\.find\(s => s\.id === selectedShapeIds\)/g, 'const selectedShapes = shapes.filter(s => selectedShapeIds.includes(s.id))');
  // There are some places where it looks for `.id` on the selection
  
  fs.writeFileSync('App.tsx', app);
}

fixAppTsx();
console.log("App script run.");
