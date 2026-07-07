const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(
  'const code = await generateTkinterCode(apiKey!, finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill);',
  'const code = await generateTkinterCode(apiKey!, finalShapesForGeneration, canvasWidth, canvasHeight, canvasBgColor, projectName, canvasVarName, autoGenerateComments, outlineWithFill, generateTkinterTags);'
);

fs.writeFileSync('App.tsx', code);
console.log('App gemini patched');
