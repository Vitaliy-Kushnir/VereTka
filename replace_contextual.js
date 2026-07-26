import fs from 'fs';
let code = fs.readFileSync('App.tsx', 'utf-8');
const replacement = fs.readFileSync('replacement.txt', 'utf-8');
const startTag = 'type ContextualControlsProps = {';
const endTag = 'const DistributePathTopControls';
const startIdx = code.indexOf(startTag);
const endIdx = code.indexOf(endTag, startIdx);
code = code.substring(0, startIdx) + replacement + '\n\n' + code.substring(endIdx);
fs.writeFileSync('App.tsx', code);
