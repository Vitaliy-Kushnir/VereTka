const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(/{t\('menu\.object\.flipHorizontal'\)[^}]+}/g, "{t('menu.edit.flipH')}");
code = code.replace(/{t\('menu\.object\.flipVertical'\)[^}]+}/g, "{t('menu.edit.flipV')}");
fs.writeFileSync('App.tsx', code);
console.log("Fixed App.tsx text");

let propEdit = fs.readFileSync('components/PropertyEditor.tsx', 'utf8');
propEdit = propEdit.replace(/{t\('menu\.object\.flipHorizontal'\)[^}]+}/g, "{t('menu.edit.flipH')}");
propEdit = propEdit.replace(/{t\('menu\.object\.flipVertical'\)[^}]+}/g, "{t('menu.edit.flipV')}");
fs.writeFileSync('components/PropertyEditor.tsx', propEdit);
console.log("Fixed PropertyEditor text");
