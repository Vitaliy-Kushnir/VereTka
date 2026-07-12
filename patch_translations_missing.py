import re

with open('lib/translations.ts', 'r') as f:
    content = f.read()

def insert_after(lang, key_values):
    global content
    lang_marker = f"  {lang}: {{"
    if lang_marker in content:
        insert_text = "\n" + "\n".join([f"    '{k}': '{v}'," for k, v in key_values.items()])
        content = content.replace(lang_marker, lang_marker + insert_text)

keys_uk = {
    'prop.pathType': 'Тип шляху',
    'tool.distribute.path.circle': 'Коло',
    'tool.distribute.path.line': 'Лінія',
    'prop.orientAlongPath': 'Орієнтувати вздовж',
    'prop.rotateAlongPath': 'Обертати вздовж',
    'layer.title': 'Шари',
    'shape.list': 'Список фігур',
    'tool.distribute.path.customAngle': 'Власний кут'
}

keys_en = {
    'prop.pathType': 'Path Type',
    'tool.distribute.path.circle': 'Circle',
    'tool.distribute.path.line': 'Line',
    'prop.orientAlongPath': 'Orient Along',
    'prop.rotateAlongPath': 'Rotate Along',
    'layer.title': 'Layers',
    'shape.list': 'Shape List',
    'tool.distribute.path.customAngle': 'Custom Angle'
}

keys_it = {
    'prop.pathType': 'Tipo di Percorso',
    'tool.distribute.path.circle': 'Cerchio',
    'tool.distribute.path.line': 'Linea',
    'prop.orientAlongPath': 'Orienta lungo',
    'prop.rotateAlongPath': 'Ruota lungo',
    'layer.title': 'Livelli',
    'shape.list': 'Elenco forme',
    'tool.distribute.path.customAngle': 'Angolo personalizzato'
}

keys_es = {
    'prop.pathType': 'Tipo de Ruta',
    'tool.distribute.path.circle': 'Círculo',
    'tool.distribute.path.line': 'Línea',
    'prop.orientAlongPath': 'Orientar a lo largo',
    'prop.rotateAlongPath': 'Rotar a lo largo',
    'layer.title': 'Capas',
    'shape.list': 'Lista de formas',
    'tool.distribute.path.customAngle': 'Ángulo personalizado'
}

keys_pt = {
    'prop.pathType': 'Tipo de Caminho',
    'tool.distribute.path.circle': 'Círculo',
    'tool.distribute.path.line': 'Linha',
    'prop.orientAlongPath': 'Orientar ao longo',
    'prop.rotateAlongPath': 'Girar ao longo',
    'layer.title': 'Camadas',
    'shape.list': 'Lista de formas',
    'tool.distribute.path.customAngle': 'Ângulo personalizado'
}

keys_fr = {
    'prop.pathType': 'Type de Chemin',
    'tool.distribute.path.circle': 'Cercle',
    'tool.distribute.path.line': 'Ligne',
    'prop.orientAlongPath': 'Orienter le long de',
    'prop.rotateAlongPath': 'Tourner le long de',
    'layer.title': 'Calques',
    'shape.list': 'Liste des formes',
    'tool.distribute.path.customAngle': 'Angle personnalisé'
}

keys_de = {
    'prop.pathType': 'Pfadtyp',
    'tool.distribute.path.circle': 'Kreis',
    'tool.distribute.path.line': 'Linie',
    'prop.orientAlongPath': 'Entlang ausrichten',
    'prop.rotateAlongPath': 'Entlang drehen',
    'layer.title': 'Ebenen',
    'shape.list': 'Formenliste',
    'tool.distribute.path.customAngle': 'Benutzerdefinierter Winkel'
}

keys_pl = {
    'prop.pathType': 'Typ ścieżki',
    'tool.distribute.path.circle': 'Okrąg',
    'tool.distribute.path.line': 'Linia',
    'prop.orientAlongPath': 'Orientuj wzdłuż',
    'prop.rotateAlongPath': 'Obracaj wzdłuż',
    'layer.title': 'Warstwy',
    'shape.list': 'Lista kształtów',
    'tool.distribute.path.customAngle': 'Własny kąt'
}

insert_after('uk', keys_uk)
insert_after('en', keys_en)
insert_after('it', keys_it)
insert_after('es', keys_es)
insert_after('pt', keys_pt)
insert_after('fr', keys_fr)
insert_after('de', keys_de)
insert_after('pl', keys_pl)

with open('lib/translations.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
