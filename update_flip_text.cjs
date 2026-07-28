const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const oldHorizontal = `                      if (direction === 'horizontal') {
                          if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;`;

const newHorizontal = `                      if (direction === 'horizontal') {
                          if (newS.type === 'text') {
                              newS.x = 2 * centerAxis - newS.x;
                          } else if ('x' in newS && 'width' in newS) {
                              newS.x = 2 * centerAxis - newS.x - newS.width;`;

const oldVertical = `                      } else {
                          if ('y' in newS && 'height' in newS) {
                              newS.y = 2 * centerAxis - newS.y - newS.height;`;

const newVertical = `                      } else {
                          if (newS.type === 'text') {
                              newS.y = 2 * centerAxis - newS.y;
                          } else if ('y' in newS && 'height' in newS) {
                              newS.y = 2 * centerAxis - newS.y - newS.height;`;

code = code.replace(oldHorizontal, newHorizontal);
code = code.replace(oldVertical, newVertical);
fs.writeFileSync('App.tsx', code);
console.log("Updated App.tsx handleFlip text logic");
