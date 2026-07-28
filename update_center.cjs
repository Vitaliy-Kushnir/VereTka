const fs = require('fs');
let code = fs.readFileSync('lib/geometry.ts', 'utf8');

const oldCode = `    if ('rotationCenter' in shape && shape.rotationCenter) {
        return shape.rotationCenter;
    }
    // Prioritize explicit center properties for accuracy, as they are the geometric center.`;

const newCode = `    if ('rotationCenter' in shape && shape.rotationCenter) {
        return shape.rotationCenter;
    }
    if (shape.type === 'text') {
        return { x: shape.x, y: shape.y };
    }
    // Prioritize explicit center properties for accuracy, as they are the geometric center.`;

if (code.includes(oldCode)) {
    code = code.replace(oldCode, newCode);
    fs.writeFileSync('lib/geometry.ts', code);
    console.log("Updated getShapeCenter");
} else {
    console.log("Could not find oldCode");
}
