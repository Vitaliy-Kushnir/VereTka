const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetGroupHandler = `  const handleGroup = useCallback(() => {
    if (selectedShapeIds.length < 2) return;`;
const insertGroupHandler = `  const handleGroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length < 2) return;`;

const targetUngroupHandler = `  const handleUngroup = useCallback(() => {
    if (selectedShapeIds.length === 0) return;`;
const insertUngroupHandler = `  const handleUngroup = useCallback(() => {
    if (distributePathState) return;
    if (selectedShapeIds.length === 0) return;`;

code = code.replace(targetGroupHandler, insertGroupHandler);
code = code.replace(targetUngroupHandler, insertUngroupHandler);

fs.writeFileSync('App.tsx', code);
console.log('patched group handlers');
