import { GoogleGenAI } from "@google/genai";
import { type Shape } from '../types';

// Transliteration map for Ukrainian Cyrillic to Latin to prevent header errors.
const ua_map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ie', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'i',
    'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh',
    'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'iu', 'я': 'ia',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ie', 'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'I',
    'Й': 'I', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '', 'Ю': 'Iu', 'Я': 'Ia'
};

function transliterate(text: string): string {
    if (!text) return text;
    return text.split('').map(char => ua_map[char] || char).join('');
}

/**
 * Generates Python Tkinter code for a set of shapes using the Google Gemini API.
 * @param apiKey - The user's Google Gemini API key.
 * @param shapes - An array of shape objects to be drawn.
 * @param canvasWidth - The width of the Tkinter canvas.
 * @param canvasHeight - The height of the Tkinter canvas.
 * @param canvasBgColor - The background color of the canvas.
 * @param projectName - The title for the Tkinter window.
 * @param canvasVarName - The variable name to use for the canvas in the generated code.
 * @param autoGenerateComments - Whether to add descriptive comments for each shape.
 * @returns A promise that resolves to the generated Python code as a string.
 */
export async function generateTkinterCode(
    apiKey: string,
    shapes: Shape[], 
    canvasWidth: number, 
    canvasHeight: number, 
    canvasBgColor: string,
    projectName: string,
    canvasVarName: string,
    autoGenerateComments: boolean
): Promise<string> {
    
    if (!apiKey) {
        throw new Error("API ключ не надано. Будь ласка, введіть ваш ключ у налаштуваннях.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    // FIX: Sanitize projectName before using it in the prompt.
    const sanitizedProjectName = transliterate(projectName);
    
    // Sanitize all user-provided strings that might contain non-ISO-8859-1 characters.
    const sanitizedShapes = shapes.map(shape => {
        const newShape: any = { ...shape };

        if (newShape.type === 'rectangle') {
            delete newShape.joinstyle;
        }
        
        if (newShape.type === 'arc' || newShape.type === 'pieslice' || newShape.type === 'chord') {
            delete newShape.capstyle;
            delete newShape.arrow;
            delete newShape.arrowshape;
        }

        if ((newShape.type === 'polyline' || newShape.type === 'bezier') && newShape.isClosed) {
            delete newShape.capstyle;
            delete newShape.arrow;
            delete newShape.arrowshape;
        }

        if (newShape.name) {
            newShape.name = transliterate(newShape.name);
        }
        if (newShape.comment) {
            newShape.comment = transliterate(newShape.comment);
        }
        if (newShape.type === 'text') {
            newShape.text = transliterate(newShape.text);
        }
        return newShape;
    });


    const prompt = `
Generate a complete Python script using the Tkinter library to draw a scene. The output must be only the Python code, with no explanations, introductions, or markdown formatting.

Here are the specifications:

1.  **Window and Canvas:**
    *   The main window should be titled "${sanitizedProjectName}".
    *   The canvas variable must be named "${canvasVarName}".
    *   The canvas dimensions must be ${canvasWidth}x${canvasHeight} pixels.
    *   The canvas background color must be "${canvasBgColor}".

2.  **Script Structure:**
    *   Import tkinter: \`from tkinter import *\`.
    *   Create the root window: \`root = Tk()\`.
    *   Set the window title and geometry.
    *   Create the canvas: \`${canvasVarName} = Canvas(root, ...)\`.
    *   Pack the canvas: \`${canvasVarName}.pack()\`.
    *   Draw all the shapes provided below.
    *   For each shape, you MUST add a comment with its unique ID right before the drawing command, in the format: \`# ID:shape-id-123\`. This is critical for mapping code back to the editor.
    *   ${autoGenerateComments ? 'Add a short, descriptive comment for each shape based on its properties (e.g., `# A blue square`).' : 'Do not add any descriptive comments unless one is provided in the shape object\'s "comment" property.'}
    *   End the script with \`root.mainloop()\`.

3.  **Shapes to Draw (JSON format):**
    ${JSON.stringify(sanitizedShapes, null, 2)}

Please generate only the Python code as a single block of text.
`;

    const systemInstruction = "You are an expert Python developer specializing in the Tkinter library. Your task is to generate a complete, self-contained Python script based on a JSON description of shapes and canvas properties. The output must be only the Python code, with no surrounding text, explanations, or markdown formatting."

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.1 // Lower temperature for more deterministic code generation
            }
        });

        const code = response.text;
        
        // Clean up the response to ensure it's just Python code.
        const cleanedCode = code.replace(/^```(python)?\n/i, '').replace(/```$/, '').trim();
        
        return cleanedCode;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            // Provide a more user-friendly error message
            if (error.message.includes('API key not valid')) {
                throw new Error("Наданий ключ Gemini API недійсний. Будь ласка, перевірте його та спробуйте знову.");
            }
            throw new Error(`Сталася помилка під час зв'язку з Gemini API: ${error.message}`);
        }
        throw new Error("Невідома помилка під час генерації коду за допомогою Gemini.");
    }
}