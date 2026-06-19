const fs = require('fs');

let tCode = fs.readFileSync('lib/translations.ts', 'utf8');

// match cyrillic letter + ' + cyrillic letter, e.g. прив'я
tCode = tCode.replace(/([абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ])'([абвгґдеєжзиіїйклмнопрстуфхцчшщьюяАБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ])/g, "$1\\'$2");

fs.writeFileSync('lib/translations.ts', tCode);
