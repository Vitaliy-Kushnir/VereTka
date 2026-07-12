const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const propMatch = `<PropertyEditor showSystemTags={showSystemTags} shapes={shapes}`;

const propReplace = `<PropertyEditor onExtractFromGroup={handleExtractFromGroup} showSystemTags={showSystemTags} shapes={shapes}`;

code = code.replace(propMatch, propReplace);
fs.writeFileSync('App.tsx', code);
console.log("prop passed.");
