const fs = require('fs');
let code = fs.readFileSync('types.ts', 'utf-8');

const layerInterfaces = `export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    shapeIds: string[]; // references to shapes inside this layer
}

export interface LayerState {
    layers: Layer[];
    activeLayerId: string | null;
}
`;

if (!code.includes('export interface Layer {')) {
    code = code + '\n' + layerInterfaces;
    fs.writeFileSync('types.ts', code);
    console.log('Added Layer types to types.ts');
} else {
    console.log('Layer types already exist');
}
