const fs = require('fs');

const replaces = {
  'components/SaveTemplateModal.tsx': [
    ['Зберегти шаблон...', '{t(\'template.save\')}'],
    ['aria-label="Закрити"', 'aria-label={t(\'action.close\')}'],
    ['Назва шаблону:', '{t(\'template.name\')}'],
    ['Опис шаблону:', '{t(\'template.desc\')}'],
    ['Скасувати', '{t(\'action.cancel\')}'],
    ['Зберегти', '{t(\'action.save\')}']
  ],
  'components/NewProjectModal.tsx': [
    ['<h2 className="text-xl font-bold text-[var(--text-primary)]">Новий проєкт</h2>', '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\'project.new\')}</h2>'],
    ['Створити з:', '{t(\'project.createFrom\')}'],
    ['Чисте полотно', '{t(\'project.blankCanvas\')}'],
    ['Ваші шаблони', '{t(\'project.yourTemplates\')}'],
    ['об.)', '{t(\'project.shapes\')})'],
    ['Назва проєкту:', '{t(\'project.name\')}'],
    ['<h3 className="text-lg font-semibold text-[var(--text-tertiary)] pt-2">Налаштування полотна</h3>', '<h3 className="text-lg font-semibold text-[var(--text-tertiary)] pt-2">{t(\'project.canvasSettings\')}</h3>'],
    ['Ширина:', '{t(\'project.width\')}'],
    ['Висота:', '{t(\'project.height\')}'],
    ['Назва полотна:', '{t(\'project.canvasName\')}'],
    ['(Лише латинські літери, цифри та "_". Не може починатись з цифри)', '{t(\'project.idWarning\')}'],
    ['Колір тла:', '{t(\'project.bgColor\')}'],
    ['Скасувати', '{t(\'action.cancel\')}'],
    ['Створити', '{t(\'action.create\')}']
  ],
  'components/FeedbackModal.tsx': [
    ['Залишити відгук', '{t(\'feedback.title\')}'],
    ['aria-label="Закрити"', 'aria-label={t(\'action.close\')}'],
    ['Ваш відгук надзвичайно важливий для покращення редактора. Повідомлення про помилки, нові ідеї та просто враження допомагають робити "ВереTkа" кращою.', '{t(\'feedback.p1\')}'],
    ['Найзручніший спосіб поділитися думками — заповнити спеціальну Google Форму. Це займе лише кілька хвилин.', '{t(\'feedback.p2\')}'],
    ['<strong>Примітка:</strong> Дані про версію редактора, вашу ОС та браузер будуть додані до форми автоматично.', '<span dangerouslySetInnerHTML={{__html: t(\'feedback.note\')}}></span>'],
    ['<span>Перейти до форми відгуків</span>', '<span>{t(\'feedback.goto\')}</span>'],
    ['Закрити', '{t(\'action.close\')}']
  ],
  'components/AboutModal.tsx': [
    ['<h2 className="text-xl font-bold text-[var(--text-primary)]">Про редактор "ВереTkа"</h2>', '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\'about.title\')}</h2>'],
    ['aria-label="Закрити"', 'aria-label={t(\'action.close\')}'],
    ['<strong className="text-[var(--text-primary)]">ВереTkа</strong> — це простий векторний редактор, призначений для швидкого створення графічних примітивів та генерації відповідного Python коду для бібліотеки Tkinter.', '<span dangerouslySetInnerHTML={{__html: t(\'about.p1\')}}></span>'],
    ['Він використовує локальний генератор коду для миттєвого та надійного результату, а також може використовувати Google Gemini API для експериментальних можливостей.', '{t(\'about.p2\')}'],
    ['<strong className="text-[var(--text-primary)]">Ідея та розробка:</strong> Віталій Кушнір', '<span dangerouslySetInnerHTML={{__html: t(\'about.author\')}}></span>'],
    ['<strong className="text-[var(--text-primary)]">Підтримка:</strong> AI-асистент на базі Google Gemini.', '<span dangerouslySetInnerHTML={{__html: t(\'about.support\')}}></span>'],
    ['Створено за допомогою <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)]">AI Studio Google</a>, Visual Studio Code.', '<span dangerouslySetInnerHTML={{__html: t(\'about.tech\')}}></span>'],
    ['Версія {version}', '{t(\'about.version\')} {version}'],
    ['Закрити', '{t(\'action.close\')}']
  ],
  'components/HelpModal.tsx': [
    ["title: '1. Вступ'", "title: t('help.intro')"],
    ["title: '2. Огляд інтерфейсу'", "title: t('help.interface')"],
    ["title: '3. Робота з проєктами'", "title: t('help.projects')"],
    ["title: '4. Робота з шаблонами'", "title: t('help.templates')"],
    ["title: '5. Робота з об\\'єктами'", "title: t('help.shapes')"],
    ["title: '6. Код та експорт'", "title: t('help.codeExport')"],
    ["title: '7. Зворотний зв\\'язок'", "title: t('help.feedback')"],
    ["title: '8. Гарячі клавіші'", "title: t('help.hotkeys')"]
  ],
  'components/ConfirmationModal.tsx': [
    ['confirmText = "Продовжити"', 'confirmText = "Continue"'],
    ['cancelText = "Скасувати"', 'cancelText = "Cancel"'],
    ['aria-label="Закрити"', 'aria-label="Close"']
  ],
  'components/SaveAsModal.tsx': [
    ['<h2 className="text-xl font-bold text-[var(--text-primary)]">Зберегти як...</h2>', '<h2 className="text-xl font-bold text-[var(--text-primary)]">{t(\'saveAs.title\')}</h2>'],
    ['aria-label="Закрити"', 'aria-label={t(\'action.close\')}'],
    ['Назва проєкту:', '{t(\'project.name\')}'],
    ['Скасувати', '{t(\'action.cancel\')}'],
    ['Зберегти', '{t(\'action.save\')}']
  ],
  'components/Canvas.tsx': [
    ["'Текст'", "t('tool.text')"],
    ["'Зображення [імпорт]'", "t('tool.imageImport')"],
    ["'Фігуру дубльовано.'", "t('canvas.shapeDuplicated')"],
    ['title="Завершити"', 'title={t(\'canvas.finish\')}'],
    ['<span>Завершити</span>', '<span>{t(\'canvas.finish\')}</span>'],
    ['title="Замкнути контур"', 'title={t(\'canvas.closePoly\')}'],
    ['<span>Замкнути</span>', '<span>{t(\'canvas.closePoly\')}</span>'],
    ['title="Скасувати"', 'title={t(\'action.cancel\')}'],
    ['<span>Скасувати</span>', '<span>{t(\'action.cancel\')}</span>'],
    ['Дублювання', '{t(\'canvas.duplicating\')}'],
    ['Кут', '{t(\'canvas.angle\')}']
  ],
  'components/SelectionControls.tsx': [
    ['aria-label="Точка прив\'язки тексту"', 'aria-label={t(\'selection.anchorPoint\')}']
  ]
};

for (const file in replaces) {
    if(!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf8');

    // inject useLanguage
    if (!code.includes('useLanguage')) {
        if (code.includes('import React')) {
            code = code.replace("import React", "import React, {useContext} from 'react';\nimport { useLanguage } from '../LanguageContext';");
        }
    }
    
    // inject t
     let lines = code.split('\n');
     for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const ') && lines[i].includes('React.FC') && lines[i].includes('=> {')) {
            if (!lines[i + 1].includes('const { t } = useLanguage();')) {
                lines.splice(i + 1, 0, '    const { t } = useLanguage();');
            }
            break;
        }
        else if (file.includes('ConfirmationModal') && lines[i].includes('export default function ConfirmationModal')) {
             if (!lines[i + 1].includes('const { t } = useLanguage();')) {
                lines.splice(i + 1, 0, '    const { t } = useLanguage();');
            }
            break;
        }
    }
    code = lines.join('\n');

    for (const [frm, to] of replaces[file]) {
        code = code.split(frm).join(to);
    }
    fs.writeFileSync(file, code);
}
console.log('done replacing components step 4');
