import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

# For UK
s_uk = "'menu.edit.extractFromGroup': 'Вилучити із групи',"
r_uk = s_uk + "\n    'menu.edit.flipH': 'Віддзеркалити по горизонталі',\n    'menu.edit.flipV': 'Віддзеркалити по вертикалі',"
if s_uk in text:
    text = text.replace(s_uk, r_uk)

# For EN
s_en = "'menu.edit.extractFromGroup': 'Extract from group',"
r_en = s_en + "\n    'menu.edit.flipH': 'Flip Horizontal',\n    'menu.edit.flipV': 'Flip Vertical',"
if s_en in text:
    text = text.replace(s_en, r_en)

# For IT
s_it = "'menu.edit.extractFromGroup': 'Estrai dal gruppo',"
r_it = s_it + "\n    'menu.edit.flipH': 'Capovolgi Orizzontalmente',\n    'menu.edit.flipV': 'Capovolgi Verticalmente',"
if s_it in text:
    text = text.replace(s_it, r_it)

# For ES
s_es = "'menu.edit.extractFromGroup': 'Extraer del grupo',"
r_es = s_es + "\n    'menu.edit.flipH': 'Voltear Horizontalmente',\n    'menu.edit.flipV': 'Voltear Verticalmente',"
if s_es in text:
    text = text.replace(s_es, r_es)

with open("lib/translations.ts", "w") as f:
    f.write(text)
