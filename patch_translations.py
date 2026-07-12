import re

with open('lib/translations.ts', 'r') as f:
    content = f.read()

# Add uk
content = content.replace(
    "'action.confirm': 'Підтвердити',",
    "'action.confirm': 'Підтвердити',\n    'app.confirmReorderTitle': 'Підтвердження дії',\n    'app.confirmGroupAdd': 'Ви дійсно бажаєте перемістити вибрану фігуру до цієї групи?',\n    'app.confirmGroupRemove': 'Ви дійсно бажаєте вилучити вибрану фігуру з групи?',\n    'app.confirmExtractTitle': 'Вилучення з групи',\n    'app.confirmExtractMessage': 'Ви дійсно бажаєте вилучити вибрану фігуру з групи?',"
)

# Add en
content = content.replace(
    "'action.confirm': 'Confirm',",
    "'action.confirm': 'Confirm',\n    'app.confirmReorderTitle': 'Confirm Action',\n    'app.confirmGroupAdd': 'Are you sure you want to move the selected shape into this group?',\n    'app.confirmGroupRemove': 'Are you sure you want to remove the selected shape from its group?',\n    'app.confirmExtractTitle': 'Extract from Group',\n    'app.confirmExtractMessage': 'Are you sure you want to extract the selected shape from its group?',"
)

# Add it
content = content.replace(
    "'action.confirm': 'Confermare',",
    "'action.confirm': 'Confermare',\n    'app.confirmReorderTitle': 'Conferma Azione',\n    'app.confirmGroupAdd': 'Sei sicuro di voler spostare la forma selezionata in questo gruppo?',\n    'app.confirmGroupRemove': 'Sei sicuro di voler rimuovere la forma selezionata dal gruppo?',\n    'app.confirmExtractTitle': 'Estrai dal Gruppo',\n    'app.confirmExtractMessage': 'Sei sicuro di voler estrarre la forma selezionata dal gruppo?',"
)

# Add es
content = content.replace(
    "'action.confirm': 'Confirmar',",
    "'action.confirm': 'Confirmar',\n    'app.confirmReorderTitle': 'Confirmar Acción',\n    'app.confirmGroupAdd': '¿Estás seguro de que deseas mover la forma seleccionada a este grupo?',\n    'app.confirmGroupRemove': '¿Estás seguro de que deseas eliminar la forma seleccionada del grupo?',\n    'app.confirmExtractTitle': 'Extraer del Grupo',\n    'app.confirmExtractMessage': '¿Estás seguro de que deseas extraer la forma seleccionada del grupo?',"
)

with open('lib/translations.ts', 'w') as f:
    f.write(content)
print("SUCCESS")
