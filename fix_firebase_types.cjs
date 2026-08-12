const fs = require('fs');
let content = fs.readFileSync('lib/firebase.ts', 'utf-8');
content = content.replace(/export interface GroupData \{[\s\S]*?\}/, `
import { CloudGroup } from '../types';
export type GroupData = CloudGroup;
`);
fs.writeFileSync('lib/firebase.ts', content);
