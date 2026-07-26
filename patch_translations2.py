import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

# Add to uk
uk_target = "'menu.file.generate': 'Згенерувати код...',"
uk_replacement = """'menu.file.generate': 'Згенерувати код...',
    'action.ok': 'ОК',
    'action.cancel': 'Скасувати',
    'action.drawOnHiddenLayer': 'Малювати на прихованому шарі',
    'action.drawAnyway': 'Малювати все одно',
    'warning.layerHidden.title': 'Шар прихований',
    'warning.layerLocked.title': 'Шар заблокований',
    'warning.layerHidden.message': "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.",
    'warning.layerLocked.message': "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.",
    'warning.selectLayer': 'Виберіть робочий шар:',"""

if uk_target in text:
    text = text.replace(uk_target, uk_replacement)
else:
    print("uk_target NOT FOUND")

# Add to en
en_target = "'menu.file.generate': 'Generate code...',"
en_replacement = """'menu.file.generate': 'Generate code...',
    'action.ok': 'OK',
    'action.cancel': 'Cancel',
    'action.drawOnHiddenLayer': 'Draw on hidden layer',
    'action.drawAnyway': 'Draw anyway',
    'warning.layerHidden.title': 'Layer is hidden',
    'warning.layerLocked.title': 'Layer is locked',
    'warning.layerHidden.message': "You are trying to draw on a hidden layer. Please select a different one.",
    'warning.layerLocked.message': "You are trying to draw on a locked layer. Please select a different one.",
    'warning.selectLayer': 'Select an active layer:',"""

if en_target in text:
    text = text.replace(en_target, en_replacement)
else:
    print("en_target NOT FOUND")

with open("lib/translations.ts", "w") as f:
    f.write(text)
