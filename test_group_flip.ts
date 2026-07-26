import { getVisualBoundingBox, getBoundingBox, getShapeCenter } from './lib/geometry';

const group = {
    id: 'g1',
    type: 'group',
    shapeIds: ['r1'],
    rotation: 45,
    rotationCenter: { x: 5, y: 5 }
};

// Child was originally at x=0, y=0, w=10, h=10, rot=0
// But when group was rotated by 45, child was updated in App.tsx!
// Let's simulate what App.tsx does to the child when group is rotated by 45.
// Original center of child: (5,5). Rotated around (5,5) by 45.
// Child center is still (5,5). rotation = 45.
const child = {
    id: 'r1',
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    rotation: 45,
    rotationCenter: { x: 5, y: 5 }
};

const shapes = [group, child];

const groupBbox = getBoundingBox(group, shapes);
console.log("Group unrotated bbox:", groupBbox);

const groupVisualBbox = getVisualBoundingBox(group, undefined, shapes);
console.log("Group visual bbox (gray frame):", groupVisualBbox);

// Now flip horizontal around visual center
const centerAxis = groupVisualBbox!.x + groupVisualBbox!.width / 2;
console.log("Flip centerAxis:", centerAxis);

const newGroup = { ...group };
newGroup.rotation = (360 - newGroup.rotation) % 360;
newGroup.rotationCenter = { x: 2 * centerAxis - newGroup.rotationCenter.x, y: newGroup.rotationCenter.y };

const newChild = { ...child };
newChild.rotation = (360 - newChild.rotation) % 360;
newChild.x = 2 * centerAxis - newChild.x - newChild.width;
newChild.rotationCenter = { x: 2 * centerAxis - newChild.rotationCenter.x, y: newChild.rotationCenter.y };

const newShapes = [newGroup, newChild];
console.log("New Group:", newGroup);
console.log("New Child:", newChild);

const newGroupBbox = getBoundingBox(newGroup, newShapes);
console.log("New Group unrotated bbox:", newGroupBbox);

const newGroupVisualBbox = getVisualBoundingBox(newGroup, undefined, newShapes);
console.log("New Group visual bbox (gray frame):", newGroupVisualBbox);
