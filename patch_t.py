with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("t('warning.layerHidden.title', \"Шар прихований\")", "t('warning.layerHidden.title') || \"Шар прихований\"")
text = text.replace("t('warning.layerLocked.title', \"Шар заблокований\")", "t('warning.layerLocked.title') || \"Шар заблокований\"")
text = text.replace("t('warning.layerHidden.message', \"Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.\")", "t('warning.layerHidden.message') || \"Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.\"")
text = text.replace("t('warning.layerLocked.message', \"Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.\")", "t('warning.layerLocked.message') || \"Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.\"")
text = text.replace("t('warning.selectLayer', \"Виберіть робочий шар:\")", "t('warning.selectLayer') || \"Виберіть робочий шар:\"")
text = text.replace("t('action.cancel', 'Скасувати')", "t('action.cancel') || 'Скасувати'")
text = text.replace("t('action.drawAnyway', 'Малювати все одно')", "t('action.drawAnyway') || 'Малювати все одно'")
text = text.replace("t('action.ok', 'ОК')", "t('action.ok') || 'ОК'")

with open("App.tsx", "w") as f:
    f.write(text)
