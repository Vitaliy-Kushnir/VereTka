const fs = require('fs');
let code = fs.readFileSync('services/localGeneratorService.ts', 'utf-8');

code = code.replace(
  'function shapeToTkinterString(shape: Shape, imageVarMap: Map<string, string>, canvasVarName: string, outlineWithFill: boolean): string | null {',
  'function shapeToTkinterString(shape: Shape, imageVarMap: Map<string, string>, canvasVarName: string, outlineWithFill: boolean, generateTkinterTags: boolean): string | null {'
);

const optionsReplacement = `    if ('dash' in shape && shape.dash) {
        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        options.dash = shape.dash.map(v => round(v * strokeWidth));
        if ('dashoffset' in shape && shape.dashoffset !== undefined) {
            options.dashoffset = round(shape.dashoffset);
        }
    }
    
    if (generateTkinterTags) {
        options.tags = shape.id;
    }`;

code = code.replace(
  `    if ('dash' in shape && shape.dash) {
        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        options.dash = shape.dash.map(v => round(v * strokeWidth));
        if ('dashoffset' in shape && shape.dashoffset !== undefined) {
            options.dashoffset = round(shape.dashoffset);
        }
    }`,
  optionsReplacement
);

code = code.replace(
  'export async function generateTkinterCodeLocally(',
  'export async function generateTkinterCodeLocally('
);

code = code.replace(
  `    canvasVarName: string,
    autoGenerateComments: boolean,
    outlineWithFill: boolean,
    t: (key: string) => string): Promise<{ codeLines: CodeLine[] }> {`,
  `    canvasVarName: string,
    autoGenerateComments: boolean,
    outlineWithFill: boolean,
    generateTkinterTags: boolean,
    t: (key: string) => string): Promise<{ codeLines: CodeLine[] }> {`
);

code = code.replace(
  '            const lineContent = shapeToTkinterString(shape, imageVarMap, finalCanvasVarName, outlineWithFill);',
  '            const lineContent = shapeToTkinterString(shape, imageVarMap, finalCanvasVarName, outlineWithFill, generateTkinterTags);'
);

fs.writeFileSync('services/localGeneratorService.ts', code);
console.log('localGeneratorService patched.');
