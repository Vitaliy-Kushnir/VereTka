import { GoogleGenAI } from "@google/genai";
import { type Shape, EllipseShape, LineShape, BezierCurveShape, JoinStyle, RectangleShape, PolylineShape, PolygonShape, ArcShape, ImageShape, TextShape, BitmapShape, PathShape } from '../types';
import { getFinalPoints, getShapeCenter, rotatePoint, isPolylineAxisAlignedRectangle, getTextBoundingBox } from '../lib/geometry';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Rounds a number to a maximum of two decimal places.
 * Integers and numbers with one decimal place are returned as is.
 * @param num The number to round.
 * @returns The rounded number.
 */
const round = (num: number): number => {
    // Using Math.round is safer for floating point issues than toFixed()
    return Math.round(num * 100) / 100;
};

interface DrawCommand {
    command: 'create_rectangle' | 'create_oval' | 'create_line' | 'create_polygon' | 'create_arc' | 'create_text' | 'create_image' | 'create_bitmap';
    coords?: number[];
    points?: number[];
    options: {
        fill?: string;
        outline?: string;
        width?: number;
        stipple?: string;
        dash?: number[];
        dashoffset?: number;
        arrow?: 'none' | 'first' | 'last' | 'both';
        activefill?: string;
        arrowshape?: [number, number, number];
        capstyle?: 'butt' | 'round' | 'projecting';
        state?: 'normal' | 'hidden' | 'disabled';
        smooth?: boolean;
        splinesteps?: number;
        joinstyle?: JoinStyle;
        start?: number;
        extent?: number;
        style?: 'pieslice' | 'chord' | 'arc';
        text?: string;
        font?: string;
        anchor?: string;
        image?: string;
        bitmap?: string;
        foreground?: string;
        background?: string;
        justify?: 'left' | 'center' | 'right';
        angle?: number;
        tags?: string[];
        comment?: string;
    };
    imageData?: string;
    imageId?: string;
}


function shapeToCommand(shape: Shape, imageVarMap: Map<string, string>): DrawCommand | null {
    const options: DrawCommand['options'] = {
        tags: [`ID:${shape.id}`]
    };

    if (shape.comment) {
        options.comment = shape.comment;
    }

    if (shape.type === 'text') {
        if (shape.state !== 'normal') options.state = shape.state;

        options.text = shape.text;
        options.fill = shape.fill;

        const fontParts = [shape.font, Math.round(shape.fontSize)];
        if (shape.weight === 'bold') fontParts.push('bold');
        if (shape.slant === 'italic') fontParts.push('italic');
        if (shape.underline) fontParts.push('underline');
        if (shape.overstrike) fontParts.push('overstrike');
        options.font = fontParts.join(' ');
        
        options.anchor = shape.anchor;
        if (shape.width > 0) options.width = round(shape.width);
        if (shape.justify) options.justify = shape.justify;
        if (shape.stipple && shape.fill !== 'none') options.stipple = shape.stipple;
        
        if (shape.rotation !== 0) options.angle = round(shape.rotation);

        return { command: 'create_text', coords: [round(shape.x), round(shape.y)], options };
    }
    
    const isUnclosedLine = (shape.type === 'line' || shape.type === 'pencil' ||
                           (shape.type === 'polyline' && !shape.isClosed) ||
                           (shape.type === 'bezier' && !shape.isClosed) ||
                           (shape.type === 'arc' && shape.style === 'arc'));

    if (shape.state !== 'normal') {
        options.state = shape.state;
    }
    
    if ('fill' in shape && shape.fill !== 'none' && !isUnclosedLine) {
        options.fill = shape.fill;
    }
    
    if (shape.stroke !== 'none' && shape.strokeWidth > 0) {
        options.width = round(shape.strokeWidth);
        if (isUnclosedLine) {
            options.fill = shape.stroke;
        } else {
            options.outline = shape.stroke;
        }
    }

    if ('joinstyle' in shape && shape.joinstyle) {
        options.joinstyle = shape.joinstyle;
    }
    
    if ('stipple' in shape && shape.stipple && 'fill' in shape && shape.fill !== 'none') {
        options.stipple = shape.stipple;
    }
    if ('dash' in shape && shape.dash) {
        const strokeWidth = shape.strokeWidth > 0 ? shape.strokeWidth : 1;
        options.dash = shape.dash.map(v => round(v * strokeWidth));
        if ('dashoffset' in shape && shape.dashoffset !== undefined) {
            options.dashoffset = round(shape.dashoffset);
        }
    }
    
    if (shape.type === 'polyline' && shape.isClosed && !shape.rotation && isPolylineAxisAlignedRectangle(shape as PolylineShape)) {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        const coords = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round);
        return { command: 'create_rectangle', coords, options };
    }

    if (shape.rotation !== 0 && (shape.type === 'image' || shape.type === 'bitmap')) {
        const currentComment = options.comment ? options.comment + '\n' : '';
        options.comment = `${currentComment}Tkinter не підтримує обертання для цього об'єкта. Він буде відображений без обертання.`;
    }

    const lineLikeProps = (s: LineShape | BezierCurveShape | PolylineShape | ArcShape | PathShape) => {
        if ('dash' in s && s.dash) {
            const strokeWidth = s.strokeWidth > 0 ? s.strokeWidth : 1;
            options.dash = s.dash.map(v => round(v * strokeWidth));
            if ('dashoffset' in s && s.dashoffset) options.dashoffset = round(s.dashoffset);
        }
        if (s.arrow && s.arrow !== 'none' && s.arrowshape) {
            options.arrow = s.arrow;
            if (s.arrowshape) {
                const [d1m, d2m, d3m] = s.arrowshape;
                const w = s.strokeWidth > 0 ? s.strokeWidth : 1;
                options.arrowshape = [round(d1m * w), round(d2m * w), round(d3m * w)];
            }
        }
        if ('activeStroke' in s && s.activeStroke) options.activefill = s.activeStroke;
        if (s.capstyle) options.capstyle = s.capstyle;
    }

    // Generate concise code for smooth bezier/polyline using their raw control points.
    if ((shape.type === 'bezier' || shape.type === 'polyline') && shape.smooth) {
        options.smooth = true;
        if ('splinesteps' in shape && shape.splinesteps) {
            options.splinesteps = shape.splinesteps;
        }
        lineLikeProps(shape);

        let controlPoints = shape.points;
        if (shape.rotation !== 0) {
            const center = getShapeCenter(shape);
            if (center) {
                controlPoints = shape.points.map(p => rotatePoint(p, center, shape.rotation));
            }
        }
        
        const flattenedPoints = controlPoints.flatMap(p => [round(p.x), round(p.y)]);
        const command = shape.isClosed ? 'create_polygon' : 'create_line';
        return { command, points: flattenedPoints, options };
    }
    
    const isEffectivelyUnrotated = (!('rotation' in shape) || shape.rotation === 0) || (shape.type === 'ellipse' && shape.isAspectRatioLocked);
    
    if (isEffectivelyUnrotated) {
        switch (shape.type) {
            case 'rectangle':
                return { command: 'create_rectangle', coords: [round(shape.x), round(shape.y), round(shape.x + shape.width), round(shape.y + shape.height)], options };
            case 'ellipse':
                return { command: 'create_oval', coords: [round(shape.cx - shape.rx), round(shape.cy - shape.ry), round(shape.cx + shape.rx), round(shape.cy + shape.ry)], options };
            case 'arc':
                options.start = round(shape.start);
                options.extent = round(shape.extent);
                if (shape.style !== 'pieslice') {
                    options.style = shape.style;
                }
                 if (shape.style === 'arc') {
                    if (options.fill && options.fill !== shape.stroke) delete options.fill; 
                }
                lineLikeProps(shape);
                return { command: 'create_arc', coords: [round(shape.x), round(shape.y), round(shape.x + shape.width), round(shape.y + shape.height)], options };
            case 'image':
                options.image = imageVarMap.get(shape.id);
                return { command: 'create_image', coords: [round(shape.x + shape.width / 2), round(shape.y + shape.height / 2)], options };
            case 'bitmap':
                options.bitmap = shape.bitmapType;
                options.foreground = shape.foreground;
                options.background = shape.background;
                return { command: 'create_bitmap', coords: [round(shape.x + shape.width / 2), round(shape.y + shape.height / 2)], options };
        }
    }
    
    // Optimization for rotated CIRCULAR arcs: bake rotation into the start angle.
    // Rotated elliptical arcs will fall through to the polygon conversion.
    if (shape.type === 'arc' && shape.rotation !== 0) {
        if (shape.width === shape.height) { // It's a circular arc
            options.start = round(shape.start + shape.rotation);
            options.extent = round(shape.extent);
            if (shape.style !== 'pieslice') {
                options.style = shape.style;
            }
            if (shape.style === 'arc') {
                if (options.outline && options.fill && options.fill !== options.outline) delete options.fill;
                else if (options.fill && !options.outline) delete options.fill;
            }
            lineLikeProps(shape);
            return { command: 'create_arc', coords: [round(shape.x), round(shape.y), round(shape.x + shape.width), round(shape.y + shape.height)], options };
        }
    }
    
    // Fallback for all other shapes (rotated, complex polygons, etc.)
    const points = getFinalPoints(shape);
    if (!points || points.length < 2) return null;

    if ('smooth' in shape && shape.smooth) {
        options.smooth = true;
        if ('splinesteps' in shape && shape.splinesteps) {
            options.splinesteps = shape.splinesteps;
        }
    }
    
    if (shape.type === 'line' || shape.type === 'bezier' || shape.type === 'polyline' || shape.type === 'arc' || shape.type === 'pencil') {
        lineLikeProps(shape);
    }
    
    const flattenedPoints = points.flatMap(p => [round(p.x), round(p.y)]);
    
    if (isUnclosedLine) {
         return { command: 'create_line', points: flattenedPoints, options };
    }

    return { command: 'create_polygon', points: flattenedPoints, options };
}

function buildSimplifiedPrompt(commands: DrawCommand[], width: number, height: number, backgroundColor: string, imageSetupCode: string, projectName: string, canvasVarName: string, autoGenerateComments: boolean): string {
  const commandsJson = JSON.stringify(commands, null, 2);

  const autoCommentRule = autoGenerateComments
    ? `6.  **AUTO-COMMENTS:** If a command has NO \`comment\` field, you MUST generate a brief, descriptive English comment about the shape (e.g., "# A large red circle for the background"). This comment MUST be placed on a new line immediately BEFORE the corresponding \`${canvasVarName}.create_...\` call.`
    : `6.  **AUTO-COMMENTS:** Auto-generation is disabled. DO NOT generate any comments unless a \`comment\` field is provided.`;

  return `You are a Python Tkinter code generation engine. Your task is to convert a JSON array of drawing commands into a simple, flat Python script.

**CRITICAL RULES:**
1.  **SCRIPT MUST BE FLAT:** Do NOT use functions, classes, loops, or any complex structures.
2.  **ONE COMMAND, ONE LINE:** For EACH object in the input JSON, you MUST generate EXACTLY ONE \`${canvasVarName}.create_...\` line.
3.  **SPECIAL VALUES:**
    - 'arrow' values ('first', 'last', 'both') MUST be passed as lowercase strings (e.g. arrow="first").
    - 'style' values for arcs ('chord', 'arc') MUST be passed as lowercase strings (e.g. style="chord"). The 'pieslice' style is omitted from the JSON as it's the default.
4.  **DIRECT OPTIONS:** Include all provided options (\`fill\`, \`outline\`, \`width\`, \`smooth\`, \`state\`, \`text\`, \`font\`, \`angle\`, etc.) directly in the corresponding \`${canvasVarName}.create_...\` call.
5.  **COORDINATES RULE:** Coordinates from the \`coords\` and \`points\` fields MUST be written directly into the function call as arguments. DO NOT use intermediate variables (e.g., \`points_1 = [...]\`).
${autoCommentRule}
7.  **USER COMMENTS:** If a \`comment\` field exists, you MUST add it as a Python comment. For multi-line comments, each line MUST start with '# '. The entire comment block MUST be placed on new lines immediately BEFORE the corresponding \`${canvasVarName}.create_...\` call. This rule has HIGHER PRIORITY than the auto-comment rule.
8.  **TAGS (ID):** If a \`tags\` field exists (containing the shape ID), you MUST append its content as a comment at the very END of the \`${canvasVarName}.create_...\` line (e.g., \`# ID:some-id\`).
9.  **IMAGES:** If \`imageData\` is present, use the provided \`imageSetupCode\` and the corresponding \`imageId\` to create the image variable.
10. **NO EXTRA CODE:** Do not add any logic, calculations, or variables not explicitly required by these rules.

**TEMPLATE:**
The final script must follow this exact structure.

\`\`\`python
from tkinter import *
# [Insert image setup code here if provided]

root = Tk()
root.title("${projectName}")
root.geometry("${width}x${height}")

${canvasVarName} = Canvas(root, width=${width}, height=${height}, bg="${backgroundColor}")
${canvasVarName}.pack()

# [Insert generated ${canvasVarName}.create_... lines here]

root.mainloop()
\`\`\`

**TASK DATA:**

**Image Setup Code (if any):**
\`\`\`python
${imageSetupCode || '# No images to set up.'}
\`\`\`

**JSON Drawing Commands:**
\`\`\`json
${commandsJson}
\`\`\`

Generate the complete, runnable Python Tkinter script based on the template and data provided, strictly following all rules.
`;
}


export async function generateTkinterCode(shapes: Shape[], canvasWidth: number, canvasHeight: number, backgroundColor: string, projectName: string, canvasVarName: string, autoGenerateComments: boolean): Promise<string> {
  const finalCanvasVarName = canvasVarName.trim() || 'c';
  const imageShapes = shapes.filter(s => s.type === 'image') as ImageShape[];
  const imagePlaceholders = new Map<string, string>();
  let imageSetupCode = '';
  const imageVarMap = new Map<string, string>();

  if (imageShapes.length > 0) {
      imageSetupCode += `from PIL import Image, ImageTk\n`;
      imageSetupCode += `import base64\n`;
      imageSetupCode += `import io\n\n`;
      
      imageShapes.forEach((shape, index) => {
          const varName = `img_photo_${index}`;
          const rawDataBase64 = shape.src.split(',')[1];
          const placeholder = `"""###PLACEHOLDER_FOR_IMAGE_${index}###"""`;

          imageSetupCode += `img_data_${index} = base64.b64decode(${placeholder})\n`;
          imageSetupCode += `img_pil_${index} = Image.open(io.BytesIO(img_data_${index}))\n`;
          imageSetupCode += `${varName} = ImageTk.PhotoImage(img_pil_${index})\n`;

          imageVarMap.set(shape.id, varName);
          imagePlaceholders.set(placeholder, `b'${rawDataBase64}'`);
      });
  }

  const commands = shapes
      .map(shape => shapeToCommand(shape, imageVarMap))
      .filter((cmd): cmd is DrawCommand => cmd !== null);

  const prompt = buildSimplifiedPrompt(commands, canvasWidth, canvasHeight, backgroundColor, imageSetupCode, projectName, finalCanvasVarName, autoGenerateComments);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const responseText = response.text;

    if (!responseText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        let errorMessage = `Відповідь від API була порожньою або заблокована. Причина: ${finishReason || 'Невідомо'}.`;
        
        if (finishReason === 'SAFETY') {
            const blockedRating = safetyRatings?.find(r => r.blocked);
            if (blockedRating) {
                errorMessage = `Генерацію заблоковано через налаштування безпеки (категорія: ${blockedRating.category}). Спробуйте змінити текст або інші елементи.`;
            } else {
                errorMessage = `Генерацію заблоковано через налаштування безпеки. Спробуйте змінити вхідні дані.`;
            }
        }
        
        console.error("Gemini API returned no text.", { finishReason, safetyRatings });
        throw new Error(errorMessage);
    }

    let finalCode: string;
    const codeBlock = responseText.match(/```python\n([\s\S]*?)\n```/);
    if (codeBlock && codeBlock[1]) {
        finalCode = codeBlock[1].trim();
    } else {
        finalCode = responseText.trim();
    }
    
    // After generating the code, replace the placeholders with the actual base64 data.
    for (const [placeholder, data] of imagePlaceholders.entries()) {
        finalCode = finalCode.replace(placeholder, data);
    }

    return finalCode;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('Відповідь від API') || error.message.includes('Генерацію заблоковано')) {
            throw error;
        }
        throw new Error(`Помилка API: ${error.message}`);
    }
    throw new Error("Невідома помилка під час виклику API Gemini.");
  }
}