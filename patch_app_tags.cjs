const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// State
code = code.replace(
  'const [autoGenerateComments, setAutoGenerateComments] = useState<boolean>(true);',
  'const [autoGenerateComments, setAutoGenerateComments] = useState<boolean>(true);\n  const [generateTkinterTags, setGenerateTkinterTags] = useState<boolean>(false);'
);

// Settings save 1
code = code.replace(
  'uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill }',
  'uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags }'
);
code = code.replace(
  'showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill]);',
  'showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags]);'
);

// Code Generation Local 1
code = code.replace(
  'generateTkinterCodeLocally(finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, t);',
  'generateTkinterCodeLocally(finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, t);'
);

// Code Generation Local 2
code = code.replace(
  'generateTkinterCodeLocally(shapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, t);',
  'generateTkinterCodeLocally(shapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags, t);'
);

// Dep array 1
code = code.replace(
  'canvasVarName, autoGenerateComments, apiKey, activeCheats, outlineWithFill, showNotification]);',
  'canvasVarName, autoGenerateComments, generateTkinterTags, apiKey, activeCheats, outlineWithFill, showNotification]);'
);

// Dep array 2
code = code.replace(
  'canvasVarName, autoGenerateComments, activeCheats, outlineWithFill]);',
  'canvasVarName, autoGenerateComments, generateTkinterTags, activeCheats, outlineWithFill]);'
);

// Settings save 2
code = code.replace(
  'uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill }',
  'uiSettings: { theme, showGrid, gridSize, snapToGrid, gridSnapStep, showAxes, showCenterGuides, enableSnapping, showCursorCoords, showRotationAngle, showLineNumbers, showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags }'
);
code = code.replace(
  'showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateProjectThumbnail]);',
  'showTkinterNames, generatorType, highlightCodeOnSelection, autoGenerateComments, showComments, outlineWithFill, generateTkinterTags, generateProjectThumbnail]);'
);

// Load 1
code = code.replace(
  'setAutoGenerateComments(ui.autoGenerateComments ?? true);',
  'setAutoGenerateComments(ui.autoGenerateComments ?? true);\n            setGenerateTkinterTags(ui.generateTkinterTags ?? false);'
);

// Modal Props
code = code.replace(
  'autoGenerateComments={autoGenerateComments} setAutoGenerateComments={setAutoGenerateComments}',
  'autoGenerateComments={autoGenerateComments} setAutoGenerateComments={setAutoGenerateComments}\n              generateTkinterTags={generateTkinterTags} setGenerateTkinterTags={setGenerateTkinterTags}'
);


fs.writeFileSync('App.tsx', code);
console.log('App patched.');
