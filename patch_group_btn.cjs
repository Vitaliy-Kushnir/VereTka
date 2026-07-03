const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetGroup = `<button 
                          onClick={() => { onGroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!isShapeSelected}`;
const replaceGroup = `<button 
                          onClick={() => { onGroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!isShapeSelected || isDistributingPath}`;

const targetUngroup = `<button 
                          onClick={() => { onUngroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!isShapeSelected}`;
const replaceUngroup = `<button 
                          onClick={() => { onUngroup(); setIsToolsMenuOpen(false); }} 
                          disabled={!isShapeSelected || isDistributingPath}`;

code = code.replace(targetGroup, replaceGroup);
code = code.replace(targetUngroup, replaceUngroup);

fs.writeFileSync('App.tsx', code);
console.log('patched group buttons');
