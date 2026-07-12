with open('App.tsx', 'r') as f:
    content = f.read()

target = """              />
          )}"""

replacement = """              />
          )}
          {reorderConfirmInfo && (
              <ConfirmationModal
                isOpen={true}
                title={t('app.confirmReorderTitle') || 'Підтвердження дії'}
                message={reorderConfirmInfo.action === 'add' 
                    ? (t('app.confirmGroupAdd') || 'Ви збираєтесь додати фігуру до групи. Продовжити?') 
                    : (t('app.confirmGroupRemove') || 'Ви збираєтесь вилучити фігуру з групи. Продовжити?')}
                onConfirm={() => {
                    executeReorderShape(reorderConfirmInfo.draggedId, reorderConfirmInfo.targetId, reorderConfirmInfo.position, reorderConfirmInfo.action);
                    setReorderConfirmInfo(null);
                }}
                onClose={() => setReorderConfirmInfo(null)}
                confirmText={t('app.confirm') || 'Так'}
                cancelText={t('app.cancel') || 'Ні'}
              />
          )}
          {extractConfirmInfo && (
              <ConfirmationModal
                isOpen={true}
                title={t('app.confirmExtractTitle') || 'Вилучення з групи'}
                message={t('app.confirmExtractMessage') || 'Ви дійсно бажаєте вилучити вибрану фігуру (або фігури) з групи?'}
                onConfirm={() => {
                    confirmExtractFromGroup();
                    setExtractConfirmInfo(false);
                }}
                onClose={() => setExtractConfirmInfo(false)}
                confirmText={t('app.confirm') || 'Так'}
                cancelText={t('app.cancel') || 'Ні'}
              />
          )}"""

new_content = content.replace(target, replacement, 1)

with open('App.tsx', 'w') as f:
    f.write(new_content)
print("SUCCESS")
