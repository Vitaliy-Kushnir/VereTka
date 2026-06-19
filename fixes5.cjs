const fs = require('fs');

let tCode = fs.readFileSync('lib/translations.ts', 'utf8');

tCode = tCode.replace(/o\'clock/g, "o\\'clock");

fs.writeFileSync('lib/translations.ts', tCode);
