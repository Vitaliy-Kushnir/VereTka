const fs = require('fs');
const files = [
    'components/ConfirmationModal.tsx',
    'components/SaveAsModal.tsx',
    'components/ShareModal.tsx',
    'components/SaveCodeModal.tsx',
    'components/WelcomeScreen.tsx',
    'components/AboutModal.tsx',
    'components/FeedbackModal.tsx',
    'components/ApiKeyModal.tsx',
    'components/HelpModal.tsx',
    'components/KeyboardShortcutsModal.tsx',
    'components/PreviewModal.tsx',
    'components/ExportModal.tsx',
    'components/SettingsModal.tsx',
    'components/SaveTemplateModal.tsx',
    'components/NewProjectModal.tsx',
    'components/CloudGalleryModal.tsx',
    'components/ActionModal.tsx',
    'components/PromptModal.tsx'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/className="fixed inset-0([^"]*) z-50/g, 'className="fixed inset-0$1 z-[9999]');
        content = content.replace(/className="fixed inset-0([^"]*) z-\[200\]/g, 'className="fixed inset-0$1 z-[9999]');
        content = content.replace(/className="fixed inset-0([^"]*)z-50/g, 'className="fixed inset-0$1z-[9999]');
        content = content.replace(/className="fixed inset-0([^"]*)z-\[200\]/g, 'className="fixed inset-0$1z-[9999]');
        fs.writeFileSync(file, content);
    }
});
