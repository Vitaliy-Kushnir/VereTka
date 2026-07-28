const fs = require('fs');
let code = fs.readFileSync('components/Canvas.tsx', 'utf8');

const target = `                const isHiddenAndSelected = isHidden && isSelected;`;
const replacement = `                const isHiddenAndSelected = isHidden && isSelected;
                const isBeingEdited = inlineEditingShape && inlineEditingShape.id === shape.id;
                if (isBeingEdited) return null;`;

if (code.includes(target) && !code.includes('isBeingEdited = inlineEditingShape')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('components/Canvas.tsx', code);
    console.log("Updated Canvas.tsx to hide edited text");
} else {
    console.log("Target not found or already modified");
}
