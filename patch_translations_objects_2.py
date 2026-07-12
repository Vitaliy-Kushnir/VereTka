import re

with open('lib/translations.ts', 'r') as f:
    content = f.read()

# Fix unescaped single quotes inside single quotes
content = re.sub(r"'Об'єкти'", r"'Об\'єкти'", content)
content = re.sub(r"'Об'єктів:'", r"'Об\'єктів:'", content)

with open('lib/translations.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
