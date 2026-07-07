const fs = require('fs');
let code = fs.readFileSync('lib/translations.ts', 'utf-8');

code = code.replace(
  "'settings.code.highlightDesc': 'Підсвічувати рядок коду, що відповідає вибраній фігурі.',",
  "'settings.code.highlightDesc': 'Підсвічувати рядок коду, що відповідає вибраній фігурі.',\n    'settings.code.generateTags': 'Генерувати теги (для груп/шарів)',\n    'settings.code.generateTagsDesc': 'Додавати параметр tags= у Tkinter для фігур.',"
);

code = code.replace(
  "'settings.code.highlightDesc': 'Highlight the code line corresponding to the selected shape.',",
  "'settings.code.highlightDesc': 'Highlight the code line corresponding to the selected shape.',\n    'settings.code.generateTags': 'Generate Tkinter tags',\n    'settings.code.generateTagsDesc': 'Add tags= parameter for groups/layers in Tkinter code.',"
);

code = code.replace(
  "'settings.code.highlightDesc': 'Evidenzia la riga del codice corrispondente alla forma selezionata.',",
  "'settings.code.highlightDesc': 'Evidenzia la riga del codice corrispondente alla forma selezionata.',\n    'settings.code.generateTags': 'Generare tag Tkinter',\n    'settings.code.generateTagsDesc': 'Aggiungi il parametro tags= per gruppi/livelli.',"
);

code = code.replace(
  "'settings.code.highlightDesc': 'Resaltar la línea en el editor de código al seleccionar un objeto.',",
  "'settings.code.highlightDesc': 'Resaltar la línea en el editor de código al seleccionar un objeto.',\n    'settings.code.generateTags': 'Generar etiquetas Tkinter',\n    'settings.code.generateTagsDesc': 'Añadir parámetro tags= para grupos/capas.',"
);

fs.writeFileSync('lib/translations.ts', code);
console.log('translations patched.');
