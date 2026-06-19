import fs
import re

files = [
    'components/SaveCodeModal.tsx',
    'components/CheatCodeModal.tsx',
    'components/PreviewModal.tsx',
    'components/StatusBar.tsx',
    'components/WelcomeScreen.tsx',
    'components/FormControls.tsx'
]

replaces = {
  'components/SaveCodeModal.tsx': [
    ('<h2 className="text-xl font-bold text-[var(--text-primary)]">Зберегти код як...</h2>', '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\'code.saveFileAs\')}</h2>'),
    ('aria-label="Закрити"', 'aria-label={t(\'action.close\')}'),
    ('<p className="text-sm text-[var(--text-secondary)]">Задайте назву та оберіть необхідне розширення (тип) файлу.</p>', '<p className="text-sm text-[var(--text-secondary)]">{t(\'code.saveDesc\')}</p>'),
    ('<Label htmlFor="codeFileName" title="Введіть назву для вашого файлу.">Назва файлу:</Label>', '<Label htmlFor="codeFileName" title={t(\'code.fileNameDesc\')}>{t(\'code.fileName\')}</Label>'),
    ('title="Вибрати розширення файлу"', 'title={t(\'code.selectExt\')}'),
    ('label="Зберігати із номерами рядків"', 'label={t(\'code.saveLineNumbers\')}'),
    ('title="Додати номери рядків на початок кожного рядка у текстовому файлі"', 'title={t(\'code.saveLineNumbersDesc\')}'),
    ('>Скасувати<', '>{t(\'action.cancel\')}<'),
    ('>Зберегти<', '>{t(\'action.save\')}<')
  ],
  'components/CheatCodeModal.tsx': [
    ("showNotification('Усі активні чит-коди скинуто.', 'info')", "showNotification(t('cheat.reset'), 'info')"),
    ("showNotification(`Чит-код \"${trimmedValue}\" активовано!`, 'info')", "showNotification(t('cheat.activated', { code: trimmedValue }), 'info')"),
    ("showNotification(`Невірний чит-код: \"${trimmedValue}\"`, 'error')", "showNotification(t('cheat.invalid', { code: trimmedValue }), 'error')"),
    ("showNotification('Неправильний формат коду. Очікується \"#000\".', 'error')", "showNotification(t('cheat.formatError'), 'error')"),
    ('<h2 className="text-xl font-bold text-[var(--text-primary)]">Введення чит-коду</h2>', '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\'cheat.title\')}</h2>'),
    ('aria-label="Закрити"', 'aria-label={t(\'action.close\')}'),
    ('<p className="text-sm text-center text-[var(--text-tertiary)]">Введіть код у форматі #000</p>', '<p className="text-sm text-center text-[var(--text-tertiary)]">{t(\'cheat.desc\')}</p>'),
    ('>Скасувати<', '>{t(\'action.cancel\')}<'),
    ('>Активувати<', '>{t(\'cheat.activate\')}<')
  ],
  'components/PreviewModal.tsx': [
    ('title={`Попередній перегляд: ${projectName}`}', 'title={`${t(\'preview.title\')}: ${projectName}`}'),
    ('>Попередній перегляд: {projectName}<', '>{t(\'preview.title\')}: {projectName}<')
  ],
  'components/StatusBar.tsx': [
    ('title="Показувати/приховувати координати біля курсора"', 'title={t(\'status.toggleCoords\')}'),
    ('title="Координати курсора на полотні"', 'title={t(\'status.coords\')}'),
    ('title={`Масштаб: ${formattedZoom}`}', 'title={`${t(\'status.zoom\')}: ${formattedZoom}`}'),
    ('title="Натисніть, щоб змінити масштаб"', 'title={t(\'status.zoomClick\')}'),
    ('title="Показати виділений об\'єкт"', 'title={t(\'status.showSelected\')}')
  ],
  'components/WelcomeScreen.tsx': [
    ('alt={`Ескіз ${project.name}`}', 'alt={`${t(\'welcome.thumbnail\')} ${project.name}`}')
  ],
  'components/FormControls.tsx': [
    ('>Скасувати</button>', '>{t(\'action.cancel\')}</button>'),
    ('>Застосувати</button>', '>{t(\'action.apply\')}</button>'),
    ('>Усі кольори Tk...<', '>{t(\'color.allColorsShort\')}<')
  ]
}

for file, rules in replaces.items():
    try:
        with open(file, 'r', encoding='utf-8') as f:
            code = f.read()
            
        for frm, to in rules:
            code = code.replace(frm, to)

        with open(file, 'w', encoding='utf-8') as f:
            f.write(code)
    except Exception as e:
        print(f"Error processing {file}: {e}")

print("Python replace done")
