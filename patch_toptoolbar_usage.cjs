const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const targetUsage = `          {isProjectActive && <TopToolbar
              isDistributingPath={!!distributePathState}`;

const insertUsage = `          {isProjectActive && <TopToolbar
              distributePathState={distributePathState}
              onDistributePathChange={setDistributePathState}
              isDistributingPath={!!distributePathState}`;

if (code.includes(targetUsage)) {
    code = code.replace(targetUsage, insertUsage);
    fs.writeFileSync('App.tsx', code);
    console.log('patched TopToolbar usage');
} else {
    console.log('Target not found in App.tsx');
}
