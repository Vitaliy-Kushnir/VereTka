const { cos, sin, min, max, PI } = Math;
function rotate(p, c, angle) {
    const rad = angle * PI / 180;
    return {
        x: c.x + (p.x - c.x) * cos(rad) - (p.y - c.y) * sin(rad),
        y: c.y + (p.x - c.x) * sin(rad) + (p.y - c.y) * cos(rad)
    };
}
// Original shape
const p1 = {x: 0, y: 10};
const p2 = {x: 10, y: 10};
const rotCenter = {x: 5, y: 10};
const rotation = 45;

// Visual points
const v1 = rotate(p1, rotCenter, rotation);
const v2 = rotate(p2, rotCenter, rotation);
console.log("Original visual points:", v1, v2);

// Visual bounds
const minX = min(v1.x, v2.x);
const maxX = max(v1.x, v2.x);
const centerAxis = minX + (maxX - minX) / 2;
console.log("centerAxis:", centerAxis);

// Flip
const newP1 = {x: 2 * centerAxis - p1.x, y: p1.y};
const newP2 = {x: 2 * centerAxis - p2.x, y: p2.y};
const newRotCenter = {x: 2 * centerAxis - rotCenter.x, y: rotCenter.y};
const newRot = -rotation;

// New visual points
const nv1 = rotate(newP1, newRotCenter, newRot);
const nv2 = rotate(newP2, newRotCenter, newRot);
console.log("New visual points:", nv1, nv2);

// Flipped original visual points
const ev1 = {x: 2 * centerAxis - v1.x, y: v1.y};
const ev2 = {x: 2 * centerAxis - v2.x, y: v2.y};
console.log("Expected new visual points:", ev1, ev2);
