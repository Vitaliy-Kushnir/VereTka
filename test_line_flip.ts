import { getVisualBoundingBox } from './lib/geometry';

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
const centerAxis = bbox.x + bbox.width / 2;

// If we flip x around centerAxis
const newX = 2 * centerAxis - shape.x - shape.width;
console.log("centerAxis:", centerAxis, "newX:", newX);
