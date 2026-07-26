const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const targetStr = `
                      if (direction === 'horizontal') {
                          if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;
`;

const newStr = `                      if (direction === 'vertical') {
                          if (newS.rotationHandlePosition === 'bottom') {
                              delete newS.rotationHandlePosition;
                          } else {
                              newS.rotationHandlePosition = 'bottom';
                          }
                      }
                      if (direction === 'horizontal') {
                          if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;
`;

if (code.includes(targetStr.trim())) {
    code = code.replace(targetStr.trim(), newStr.trim());
    fs.writeFileSync('App.tsx', code);
    console.log("Fixed flip handles");
} else {
    console.log("Could not find target string");
}
