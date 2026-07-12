const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const returnMatch = `    return (
      <LanguageProvider>
        <div className="flex flex-col h-screen overflow-hidden text-[var(--text-primary)]" style={themeStyles as React.CSSProperties}>
          <Toolbar`;

const returnReplace = `    return (
      <LanguageProvider>
        <div className="flex flex-col h-screen overflow-hidden text-[var(--text-primary)]" style={themeStyles as React.CSSProperties}>
          <ConfirmationModal
            isOpen={!!reorderConfirmInfo}
            onClose={() => setReorderConfirmInfo(null)}
            onConfirm={() => {
                if (reorderConfirmInfo) {
                    executeReorderShape(reorderConfirmInfo.draggedId, reorderConfirmInfo.targetId, reorderConfirmInfo.position, reorderConfirmInfo.action);
                    setReorderConfirmInfo(null);
                }
            }}
            title={reorderConfirmInfo?.action === 'add' ? (t('modal.addToGroupTitle') || 'Додати до групи?') : (t('modal.removeFromGroupTitle') || 'Вилучити з групи?')}
            message={reorderConfirmInfo?.action === 'add' ? (t('modal.addToGroupMessage') || 'Ви впевнені, що хочете додати цю фігуру до групи?') : (t('modal.removeFromGroupMessage') || 'Ви впевнені, що хочете вилучити цю фігуру з групи?')}
            confirmText={t('modal.confirm') || 'Так'}
            cancelText={t('modal.cancel') || 'Ні'}
            variant="primary"
          />
          <ConfirmationModal
            isOpen={extractConfirmInfo}
            onClose={() => setExtractConfirmInfo(false)}
            onConfirm={confirmExtractFromGroup}
            title={t('modal.removeFromGroupTitle') || 'Вилучити з групи?'}
            message={t('modal.removeFromGroupMessageMultiple') || 'Ви впевнені, що хочете вилучити виділені фігури з групи?'}
            confirmText={t('modal.confirm') || 'Так'}
            cancelText={t('modal.cancel') || 'Ні'}
            variant="primary"
          />
          <Toolbar`;

code = code.replace(returnMatch, returnReplace);
fs.writeFileSync('App.tsx', code);
console.log("modals added.");
