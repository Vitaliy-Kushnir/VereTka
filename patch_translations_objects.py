import re

with open('lib/translations.ts', 'r') as f:
    content = f.read()

def update_or_add(lang, key, new_val):
    global content
    lang_marker = f"  {lang}: {{"
    if lang_marker not in content:
        return
    
    start_idx = content.find(lang_marker)
    end_idx = content.find("\n  },", start_idx)
    if end_idx == -1:
        end_idx = content.find("\n  }", start_idx)
    if end_idx == -1:
        end_idx = len(content)
        
    block = content[start_idx:end_idx]
    
    pattern = re.compile(r"'" + re.escape(key) + r"':\s*'.*?',?")
    if pattern.search(block):
        new_block = pattern.sub(f"'{key}': '{new_val}',", block)
        content = content[:start_idx] + new_block + content[end_idx:]
    else:
        content = content.replace(lang_marker, f"{lang_marker}\n    '{key}': '{new_val}',")

update_or_add('uk', 'shape.list', "Об'єкти")
update_or_add('uk', 'props.objectsCount', "Об'єктів:")

update_or_add('en', 'shape.list', 'Objects')
update_or_add('en', 'props.objectsCount', 'Objects:')

update_or_add('it', 'shape.list', 'Oggetti')
update_or_add('it', 'props.objectsCount', 'Oggetti:')

update_or_add('es', 'shape.list', 'Objetos')
update_or_add('es', 'props.objectsCount', 'Objetos:')

update_or_add('pt', 'shape.list', 'Objetos')
update_or_add('pt', 'props.objectsCount', 'Objetos:')

update_or_add('fr', 'shape.list', 'Objets')
update_or_add('fr', 'props.objectsCount', 'Objets:')

update_or_add('de', 'shape.list', 'Objekte')
update_or_add('de', 'props.objectsCount', 'Objekte:')

update_or_add('pl', 'shape.list', 'Obiekty')
update_or_add('pl', 'props.objectsCount', 'Obiekty:')

with open('lib/translations.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
