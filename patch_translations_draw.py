import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

target_uk = "    'action.cancel': 'Скасувати',"
replacement_uk = target_uk + "\n    'action.drawAnyway': 'Малювати все одно',"
text = text.replace(target_uk, replacement_uk)

target_en = "    'action.cancel': 'Cancel',"
replacement_en = target_en + "\n    'action.drawAnyway': 'Draw anyway',"
text = text.replace(target_en, replacement_en)

target_it = "    'action.cancel': 'Annulla',"
replacement_it = target_it + "\n    'action.drawAnyway': 'Disegna comunque',"
text = text.replace(target_it, replacement_it)

target_es = "    'action.cancel': 'Cancelar',"
replacement_es = target_es + "\n    'action.drawAnyway': 'Dibujar de todos modos',"
text = text.replace(target_es, replacement_es)

with open("lib/translations.ts", "w") as f:
    f.write(text)
