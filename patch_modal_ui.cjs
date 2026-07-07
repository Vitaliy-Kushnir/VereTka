const fs = require('fs');
let code = fs.readFileSync('components/SettingsModal.tsx', 'utf-8');

const targetLine = `<label htmlFor="autoGenerateComments" className="flex items-start pt-2"><input id="autoGenerateComments" type="checkbox" checked={props.autoGenerateComments} onChange={e => props.setAutoGenerateComments(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.comments')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.commentsDesc')}</p></div></label>`;

const addedLine = `
                                <label htmlFor="generateTkinterTags" className="flex items-start pt-2"><input id="generateTkinterTags" type="checkbox" checked={props.generateTkinterTags} onChange={e => props.setGenerateTkinterTags(e.target.checked)} className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary-hover)] bg-[var(--bg-secondary)] border-[var(--border-primary)]" /><div className="ml-3 text-sm font-medium text-[var(--text-secondary)]">{t('settings.code.generateTags')}<p className="text-xs text-[var(--text-tertiary)] mt-1">{t('settings.code.generateTagsDesc')}</p></div></label>`;

if (code.includes(targetLine)) {
    code = code.replace(targetLine, targetLine + addedLine);
    fs.writeFileSync('components/SettingsModal.tsx', code);
    console.log('Successfully patched SettingsModal UI');
} else {
    console.log('Target line not found in SettingsModal UI');
}
