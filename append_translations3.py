import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

# Add to uk
text = text.replace("'action.cancel': 'Скасувати',", """'action.cancel': 'Скасувати',
    'list.layerHidden': 'Прихований',
    'menu.edit.lock': 'Заблоковано',""")

# Add to en
text = text.replace("'action.cancel': 'Cancel',", """'action.cancel': 'Cancel',
    'list.layerHidden': 'Hidden',
    'menu.edit.lock': 'Locked',""")

# Add to it
text = text.replace("'action.cancel': 'Annulla',", """'action.cancel': 'Annulla',
    'list.layerHidden': 'Nascosto',
    'menu.edit.lock': 'Bloccato',""")

# Add to es
text = text.replace("'action.cancel': 'Cancelar',", """'action.cancel': 'Cancelar',
    'list.layerHidden': 'Oculto',
    'menu.edit.lock': 'Bloqueado',""")

with open("lib/translations.ts", "w") as f:
    f.write(text)
