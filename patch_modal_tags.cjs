const fs = require('fs');
let code = fs.readFileSync('components/SettingsModal.tsx', 'utf-8');

code = code.replace(
  'autoGenerateComments: boolean;',
  'autoGenerateComments: boolean;\n  generateTkinterTags: boolean;'
);

code = code.replace(
  'setAutoGenerateComments: (show: boolean) => void;',
  'setAutoGenerateComments: (show: boolean) => void;\n  setGenerateTkinterTags: (show: boolean) => void;'
);

code = code.replace(
  'autoGenerateComments,',
  'autoGenerateComments,\n  generateTkinterTags,'
);

code = code.replace(
  'setAutoGenerateComments,',
  'setAutoGenerateComments,\n  setGenerateTkinterTags,'
);

const translationAdd = `
                        <label className="flex items-center space-x-2 text-sm text-[var(--text-primary)] mb-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoGenerateComments}
                                onChange={(e) => setAutoGenerateComments(e.target.checked)}
                                className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-blue-500 focus:ring-blue-500 focus:ring-offset-[var(--bg-primary)]"
                            />
                            <span>{t('settings.code.autoComments')}</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm text-[var(--text-primary)] mb-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={generateTkinterTags}
                                onChange={(e) => setGenerateTkinterTags(e.target.checked)}
                                className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-blue-500 focus:ring-blue-500 focus:ring-offset-[var(--bg-primary)]"
                            />
                            <span>{t('settings.code.generateTags') || 'Generate Tkinter tags (groups/layers)'}</span>
                        </label>`;

code = code.replace(
  `<label className="flex items-center space-x-2 text-sm text-[var(--text-primary)] mb-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoGenerateComments}
                                onChange={(e) => setAutoGenerateComments(e.target.checked)}
                                className="rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-blue-500 focus:ring-blue-500 focus:ring-offset-[var(--bg-primary)]"
                            />
                            <span>{t('settings.code.autoComments')}</span>
                        </label>`,
  translationAdd
);

fs.writeFileSync('components/SettingsModal.tsx', code);
console.log('SettingsModal patched.');
