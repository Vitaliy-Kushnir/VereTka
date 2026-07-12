import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace("confirmText={t('app.confirm') || 'Так'}", "confirmText={t('action.confirm') || 'Підтвердити'}")
content = content.replace("cancelText={t('app.cancel') || 'Ні'}", "cancelText={t('action.cancel') || 'Скасувати'}")

with open('App.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
