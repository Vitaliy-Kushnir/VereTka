const fs = require('fs');
let code = fs.readFileSync('components/SettingsModal.tsx', 'utf-8');

code = code.replace(
  "<span>{t('settings.code.generateTags') || 'Generate Tkinter tags (groups/layers)'}</span>",
  "<div>\n                                <span className=\"block\">{t('settings.code.generateTags')}</span>\n                                <span className=\"text-xs text-[var(--text-secondary)]\">{t('settings.code.generateTagsDesc')}</span>\n                            </div>"
);

fs.writeFileSync('components/SettingsModal.tsx', code);
console.log('SettingsModal translations patched.');
