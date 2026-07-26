import { getVisualBoundingBox, rotatePoint } from './lib/geometry';
import { RectangleShape } from './types';

// Let's create a mock
const shape: any = {
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotation: 45,
    rotationCenter: { x: 5, y: 5 }
};

const bbox = getVisualBoundingBox(shape);
console.log("Original bbox:", bbox);
const centerAxis = bbox.x + bbox.width / 2;
console.log("centerAxis:", centerAxis);

// Flip horizontal
const newShape = { ...shape };
newShape.rotation = (360 - newShape.rotation) % 360;
newShape.x = 2 * centerAxis - newShape.x - newShape.width;
newShape.rotationCenter = { x: 2 * centerAxis - newShape.rotationCenter.x, y: newShape.rotationCenter.y };

console.log("Flipped shape:", newShape);
const newBbox = getVisualBoundingBox(newShape);
console.log("Flipped bbox:", newBbox);
