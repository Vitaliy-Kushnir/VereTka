const fs = require('fs');
let content = fs.readFileSync('App.tsx', 'utf8');
content = content.replace(/className="fixed inset-0([^"]*) z-50/g, 'className="fixed inset-0$1 z-[9999]');
content = content.replace(/className="fixed inset-0([^"]*)z-50/g, 'className="fixed inset-0$1z-[9999]');
content = content.replace(/className="fixed inset-0([^"]*) z-\[200\]/g, 'className="fixed inset-0$1 z-[9999]');
fs.writeFileSync('App.tsx', content);
