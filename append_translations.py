import re

with open("lib/translations.ts", "r") as f:
    text = f.read()

# Add English
en_target = "'menu.file.generate': 'Generate Code...',"
en_replacement = """'menu.file.generate': 'Generate Code...',
    'action.ok': 'OK',
    'action.cancel': 'Cancel',
    'action.drawOnHiddenLayer': 'Draw on hidden layer',
    'action.drawAnyway': 'Draw anyway',
    'warning.layerHidden.title': 'Layer is hidden',
    'warning.layerLocked.title': 'Layer is locked',
    'warning.layerHidden.message': "You are trying to draw on a hidden layer. Please select a different one.",
    'warning.layerLocked.message': "You are trying to draw on a locked layer. Please select a different one.",
    'warning.selectLayer': 'Select an active layer:',"""
text = text.replace(en_target, en_replacement)

# Add Italian
it_target = "'menu.file.generate': 'Genera codice...',"
it_replacement = """'menu.file.generate': 'Genera codice...',
    'action.ok': 'OK',
    'action.cancel': 'Annulla',
    'action.drawOnHiddenLayer': 'Disegna su livello nascosto',
    'action.drawAnyway': 'Disegna comunque',
    'warning.layerHidden.title': 'Il livello è nascosto',
    'warning.layerLocked.title': 'Il livello è bloccato',
    'warning.layerHidden.message': "Stai cercando di disegnare su un livello nascosto. Selezionane un altro.",
    'warning.layerLocked.message': "Stai cercando di disegnare su un livello bloccato. Selezionane un altro.",
    'warning.selectLayer': 'Seleziona un livello attivo:',"""
text = text.replace(it_target, it_replacement)

# Add Spanish
es_target = "'menu.file.generate': 'Generar Código...',"
es_replacement = """'menu.file.generate': 'Generar Código...',
    'action.ok': 'Aceptar',
    'action.cancel': 'Cancelar',
    'action.drawOnHiddenLayer': 'Dibujar en capa oculta',
    'action.drawAnyway': 'Dibujar de todos modos',
    'warning.layerHidden.title': 'La capa está oculta',
    'warning.layerLocked.title': 'La capa está bloqueada',
    'warning.layerHidden.message': "Estás intentando dibujar en una capa oculta. Selecciona otra.",
    'warning.layerLocked.message': "Estás intentando dibujar en una capa bloqueada. Selecciona otra.",
    'warning.selectLayer': 'Selecciona una capa activa:',"""
text = text.replace(es_target, es_replacement)

with open("lib/translations.ts", "w") as f:
    f.write(text)
