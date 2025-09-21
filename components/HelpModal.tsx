import React, { useRef, useState, useEffect } from 'react';
import { XIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper hook for debouncing input to improve performance
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const contentRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    const sections = [
        { id: 'intro', title: '1. Вступ' },
        { id: 'interface', title: '2. Огляд інтерфейсу' },
        { id: 'projects', title: '3. Робота з проєктами' },
        { id: 'shapes', title: '4. Робота з об\'єктами' },
        { id: 'code-export', title: '5. Код та експорт' },
        { id: 'hotkeys', title: '6. Гарячі клавіші' },
    ];

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        e.preventDefault();
        const targetElement = contentRef.current?.querySelector(`#${targetId}`);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    // Effect to update match count and reset index when search term changes
    useEffect(() => {
        if (!contentRef.current) return;
        
        if (!debouncedSearchTerm.trim()) {
            setMatchCount(0);
            setCurrentMatchIndex(-1);
            return;
        }

        const allMarks = contentRef.current.querySelectorAll('mark');
        setMatchCount(allMarks.length);
        setCurrentMatchIndex(allMarks.length > 0 ? 0 : -1);

    }, [debouncedSearchTerm]);


    // Effect to apply active highlight and scroll.
    // It runs when the index or the search term changes.
    useEffect(() => {
        if (!contentRef.current || currentMatchIndex === -1) return;

        // Query for the currently rendered marks to ensure we have fresh nodes
        const allMarks = Array.from(contentRef.current.querySelectorAll('mark'));

        if (allMarks.length === 0) return;

        allMarks.forEach((match, index) => {
            if (index === currentMatchIndex) {
                match.classList.add('bg-orange-500', 'text-white');
                match.classList.remove('bg-yellow-400/80', 'text-black');
                match.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            } else {
                match.classList.remove('bg-orange-500', 'text-white');
                match.classList.add('bg-yellow-400/80', 'text-black');
            }
        });

    }, [currentMatchIndex, debouncedSearchTerm]);

    const handleNextMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev + 1) % matchCount);
    };

    const handlePrevMatch = () => {
        if (matchCount === 0) return;
        setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount);
    };

    const applyHighlight = (node: React.ReactNode, term: string): React.ReactNode => {
        if (typeof node === 'string') {
            if (!term.trim()) {
                return node;
            }
            const parts = node.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
            return parts.map((part, i) =>
                part.toLowerCase() === term.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-400/80 text-black px-0.5 rounded-sm">
                        {part}
                    </mark>
                ) : (
                    part
                )
            );
        }
        
        if (React.isValidElement(node)) {
            const el = node as React.ReactElement<{ children?: React.ReactNode }>;
            if (el.props.children) {
                return React.cloneElement(el, {
                    ...el.props,
                    children: React.Children.map(el.props.children, child => applyHighlight(child, term))
                });
            }
        }
        
        if (Array.isArray(node)) {
            return node.map((child, index) => <React.Fragment key={index}>{applyHighlight(child, term)}</React.Fragment>);
        }

        return node;
    };

    const SectionTitle: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
        <h2 id={id} className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--border-secondary)] scroll-mt-4">{applyHighlight(children, debouncedSearchTerm)}</h2>
    );

    const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <h3 className="text-md font-semibold text-[var(--text-primary)] mt-4 mb-2">{applyHighlight(children, debouncedSearchTerm)}</h3>
    );

    const Para: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <p className="mb-2 leading-relaxed">{applyHighlight(children, debouncedSearchTerm)}</p>
    );

    const Key: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <code className="bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)] px-1.5 py-0.5 rounded-md font-mono">{children}</code>
    );

    const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <li className="mb-2 pl-2">{applyHighlight(children, debouncedSearchTerm)}</li>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-[var(--bg-primary)] rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Довідка та інструкції</h2>
                     <div className="flex-grow mx-4 max-w-sm relative">
                        <input
                          type="search"
                          placeholder="Пошук у довідці..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none"
                        />
                         {debouncedSearchTerm.trim() && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)] pl-2">
                                {matchCount > 0 ? (
                                    <>
                                        <span className="font-mono">{currentMatchIndex + 1}/{matchCount}</span>
                                        <button onClick={handlePrevMatch} className="p-1 hover:text-[var(--text-primary)]" title="Попередній" aria-label="Попередній результат">▲</button>
                                        <button onClick={handleNextMatch} className="p-1 hover:text-[var(--text-primary)]" title="Наступний" aria-label="Наступний результат">▼</button>
                                    </>
                                ) : (
                                    <span className="px-1">Не знайдено</span>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full" aria-label="Закрити">
                        <XIcon />
                    </button>
                </header>

                <div className="flex flex-grow min-h-0">
                    {/* Navigation Sidebar */}
                    <nav className="w-64 flex-shrink-0 border-r border-[var(--border-secondary)] p-4 overflow-y-auto">
                        <ul className="space-y-1">
                            {sections.map(section => (
                                <li key={section.id}>
                                    <a 
                                        href={`#${section.id}`} 
                                        onClick={(e) => handleNavClick(e, section.id)}
                                        className="block text-sm p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <div ref={contentRef} className="flex-grow p-6 text-sm text-[var(--text-secondary)] overflow-y-auto scroll-smooth">
                        <section>
                            <SectionTitle id="intro">1. Вступ</SectionTitle>
                            <Para>
                                <strong className="text-[var(--text-primary)]">ВереTkа</strong> — це професійний веб-інструмент, розроблений для візуального створення графічних елементів та автоматичної генерації коду для бібліотеки Tkinter у Python. Редактор слугує мостом між дизайном та розробкою, дозволяючи швидко прототипувати, створювати складні сцени та отримувати чистий, готовий до використання код.
                            </Para>
                            <Para>
                                Ця інструкція допоможе вам освоїти всі можливості редактора, від базових операцій до просунутих технік.
                            </Para>
                        </section>

                        <section>
                            <SectionTitle id="interface">2. Огляд інтерфейсу</SectionTitle>
                            <Para>Інтерфейс редактора логічно поділений на функціональні зони для максимальної зручності:</Para>
                            <ul className="list-decimal list-inside space-y-3 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Головне меню:</strong> Розташоване у верхній частині, надає доступ до глобальних операцій: керування файлами (<Key>Файл</Key>), історія змін та робота з буфером обміну (<Key>Редагувати</Key>), операції над об'єктами (<Key>Об'єкт</Key>), налаштування видимості (<Key>Вигляд</Key>) та довідкова інформація (<Key>Довідка</Key>).
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Панелі інструментів:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><strong>Верхня панель:</strong> Динамічна панель, що відображає налаштування для активного інструмента (наприклад, колір заливки для прямокутника) або властивості виділеного об'єкта. Це дозволяє швидко змінювати параметри, не звертаючись до правої панелі.</li>
                                        <li><strong>Ліва панель:</strong> Основний набір інструментів для створення фігур. Згруповані за типом: примітиви, лінії та криві, багатокутники та інше.</li>
                                    </ul>
                                </ListItem>
                                 <ListItem>
                                    <strong className="text-[var(--text-primary)]">Робоча область:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><strong>Полотно (Canvas):</strong> Центральна зона для малювання. Його розмір та колір тла налаштовуються.</li>
                                        <li><strong>Лінійки (Rulers):</strong> Горизонтальна та вертикальна лінійки допомагають точно позиціонувати об'єкти.</li>
                                    </ul>
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Бічні панелі:</strong>
                                     <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><strong>Ліва панель (Код):</strong> Відображає згенерований Python код. При використанні локального генератора код оновлюється в реальному часі. Меню у заголовку панелі дозволяє налаштовувати вигляд коду, зберігати його та запускати онлайн.</li>
                                        <li><strong>Права панель (Об'єкти та Властивості):</strong>
                                            <ul>
                                                <li>- <strong>Список об'єктів:</strong> Ієрархічний перелік усіх фігур на полотні. Об'єкти у верхній частині списку знаходяться на передньому плані (вищі шари).</li>
                                                <li>- <strong>Редактор властивостей:</strong> Потужна панель, де ви можете точно налаштувати кожен аспект виділеного об'єкта: від його назви, координат та розмірів до стилів заливки, контуру та унікальних параметрів (наприклад, кутів дуги або кількості сторін багатокутника). Для контурів тут доступний редактор координат вузлів.</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Рядок стану:</strong> Внизу робочої області. Показує рівень масштабування та точні координати курсора на полотні.
                                </ListItem>
                            </ul>
                        </section>

                         <section>
                            <SectionTitle id="projects">3. Робота з проєктами</SectionTitle>
                            <Para>ВереTkа працює з проєктами, що зберігаються у файлах формату <Key>.vec.json</Key>. Цей файл містить повну інформацію про ваші об'єкти, налаштування полотна та інтерфейсу.</Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>Створення нового проєкту:</strong> Через меню <Key>Файл → Новий проєкт...</Key>. Ви можете задати назву, розміри полотна, колір тла та назву змінної для полотна у коді (напр., <Key>canvas</Key>).</ListItem>
                                <ListItem><strong>Збереження:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><Key>Файл → Зберегти</Key> (<Key>Ctrl+S</Key>): Зберігає зміни у поточний відкритий файл. Якщо проєкт новий, відкриється діалог "Зберегти як".</li>
                                        <li><Key>Файл → Зберегти як...</Key>: Дозволяє зберегти проєкт у новий файл з новою назвою.</li>
                                    </ul>
                                </ListItem>
                                <ListItem><strong>Завантаження:</strong> Використовуйте <Key>Файл → Завантажити проєкт...</Key> або виберіть проєкт зі списку "Останні проєкти" на головному екрані.</ListItem>
                            </ul>
                        </section>

                        <section>
                            <SectionTitle id="shapes">4. Робота з об\'єктами</SectionTitle>
                            
                            <SubTitle>Створення та стилізація</SubTitle>
                            <Para>
                                Виберіть інструмент на лівій панелі. На верхній панелі встановіть базові параметри: колір заливки та контуру, товщину лінії. Малювання відбувається шляхом затискання лівої кнопки миші на полотні та розтягування. Для багатьох інструментів доступні два режими малювання (перемикаються на верхній панелі): "Від кута" та "Від центру".
                            </Para>

                            <SubTitle>Виділення та трансформація</SubTitle>
                            <Para>Активуйте інструмент "Вибрати" (<Key>V</Key>).</Para>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>Виділення:</strong> Клацніть на об'єкті. Для виділення кількох об'єктів у майбутньому буде додана рамка виділення.</ListItem>
                                <ListItem><strong>Переміщення:</strong> Перетягуйте виділений об'єкт. Для точного переміщення використовуйте <Key>клавіші-стрілки</Key> (утримуючи <Key>Shift</Key> для переміщення на 10 пікселів за раз).</ListItem>
                                <ListItem><strong>Масштабування:</strong> Потягніть за квадратні маніпулятори на рамці виділення. Щоб зберегти пропорції, заблокуйте їх у редакторі властивостей (<Key>Пропорції: 🔒</Key>).</ListItem>
                                <ListItem><strong>Обертання:</strong> Потягніть за круглий маніпулятор, що з'являється над рамкою виділення. Точний кут можна встановити в редакторі властивостей.</ListItem>
                            </ul>
                            
                            <SubTitle>Просунуте редагування</SubTitle>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong>Дублювання перетягуванням:</strong> Швидко створюйте копії, перетягуючи об'єкт із затиснутою <strong>правою кнопкою миші</strong>.
                                </ListItem>
                                 <ListItem>
                                    <strong>Редагування тексту на полотні:</strong> Двічі клацніть на текстовому об'єкті, щоб почати редагування безпосередньо на полотні. Щоб завершити, клацніть поза полем або натисніть <Key>Enter</Key>.
                                </ListItem>
                                <ListItem>
                                    <strong>Редагування вузлів (<Key>A</Key>):</strong> Це потужний режим для зміни форми об'єкта. Виділіть об'єкт і перейдіть у цей режим.
                                     <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li>Переміщуйте існуючі вузли, щоб змінити контур.</li>
                                        <li>Клацніть на сегменті лінії, щоб додати новий вузол.</li>
                                        <li>Виділіть вузол (клацніть по ньому) і натисніть <Key>Delete</Key>, щоб видалити.</li>
                                        <li>Координати вузлів можна точно налаштувати в редакторі властивостей у вкладці "Вузли".</li>
                                    </ul>
                                </ListItem>
                                <ListItem><strong>Перетворення на контур:</strong> Будь-який примітив (прямокутник, еліпс, зірка) можна перетворити на полілінію для детального редагування вузлів. Для цього виділіть об'єкт і виберіть <Key>Об'єкт → Перетворити на контур</Key>. Ця дія незворотня.</ListItem>
                                <ListItem><strong>Спеціальні маніпулятори:</strong> Деякі фігури, такі як Зірка, Трапеція, Трикутник, мають додаткові маніпулятори (жовті) для керування їх унікальними властивостями (напр., внутрішній радіус зірки або зсув вершини трикутника).</ListItem>
                            </ul>
                            
                             <SubTitle>Керування у Списку об'єктів</SubTitle>
                            <Para>Права панель "Об'єкти" — це ваш центр керування шарами.</Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>Порядок (Шари):</strong> Перетягуйте об'єкти у списку для зміни їх порядку накладання. Верхні елементи списку знаходяться на передньому плані.</ListItem>
                                <ListItem><strong>Видимість:</strong> Клацніть на іконку ока, щоб тимчасово приховати об'єкт.</ListItem>
                                <ListItem><strong>Перейменування:</strong> Двічі клацніть на назві, щоб дати об'єкту змістовне ім'я, яке буде використано в коментарях до коду.</ListItem>
                                <ListItem><strong>Блокування:</strong> (Функціонал у розробці) Дозволить заблокувати об'єкт від випадкових змін.</ListItem>
                            </ul>
                            
                            <SubTitle>Панель властивостей: Точний контроль</SubTitle>
                            <Para>Коли об'єкт виділено, панель "Властивості" надає повний контроль над усіма його параметрами:</Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>Загальні:</strong> Редагуйте назву об'єкта (вона використовується в коментарях до коду), його стан (звичайний, прихований, вимкнений) та додавайте багаторядкові коментарі, які будуть включені у згенерований код.</ListItem>
                                <ListItem><strong>Геометрія:</strong> Встановлюйте точні координати (<Key>X</Key>, <Key>Y</Key>), ширину, висоту та кут обертання. Важливо розрізняти <strong className="text-[var(--text-primary)]">геометричні</strong> розміри (без урахування обертання) та <strong className="text-[var(--text-primary)]">візуальні</strong> (габаритна рамка з урахуванням обертання). Зміна геометричних розмірів відбувається відносно центру фігури.</ListItem>
                                <ListItem><strong>Заливка та Контур:</strong> Повне керування кольором, товщиною, стилем штрихування (пунктир), стилем з'єднання кутів та патернами заповнення (stipple).</ListItem>
                                <ListItem><strong>Вузли:</strong> Для поліліній, кривих та об'єктів, перетворених на контур, ця вкладка дозволяє вводити точні числові координати для кожного вузла. Координати відображаються з урахуванням обертання фігури, що відповідає їх реальній позиції на полотні.</ListItem>
                                <ListItem><strong>Унікальні властивості:</strong> Для специфічних фігур з'являються додаткові параметри, такі як кути дуги, кількість сторін багатокутника, зсув вершини трикутника, кут нахилу паралелограма тощо.</ListItem>
                            </ul>
                        </section>
                        
                        <section>
                            <SectionTitle id="code-export">5. Код та експорт</SectionTitle>
                             <SubTitle>Генерація коду</SubTitle>
                             <Para>Основна функція редактора. Налаштування генератора знаходяться в меню <Key>Налаштування → Генератор</Key>.</Para>
                              <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>Локальний генератор (рекомендовано):</strong> Генерує код миттєво, надійно та працює без інтернету. Код у лівій панелі оновлюється при кожній зміні, що ідеально для ітеративної розробки. Підтримує підсвітку коду при виділенні фігури.</ListItem>
                                <ListItem><strong>Gemini API:</strong> Використовує штучний інтелект Google для генерації. Потребує інтернет-з'єднання та ключ API. Може бути корисним для експериментів. Генерація запускається вручну кнопкою "Згенерувати код".</ListItem>
                                <ListItem><strong>Коментарі до коду:</strong> Ви можете додавати власні коментарі до кожної фігури у панелі властивостей. Також можна увімкнути опцію <strong className="text-[var(--text-primary)]">"Автоматично генерувати коментарі"</strong> у налаштуваннях генератора. Вона додасть описовий коментар до кожної фігури, для якої ви не вказали власний.</ListItem>
                            </ul>
                             <Para>Згенерований код можна скопіювати, зберегти у файл (<Key>.py</Key>) або одразу запустити в онлайн-середовищі "ЄPython" за допомогою кнопок у меню вікна коду. У цьому ж меню ви можете налаштувати видимість коментарів та номерів рядків.</Para>
                            
                             <SubTitle>Експорт</SubTitle>
                             <Para>Експортуйте вашу роботу як зображення через <Key>Файл → Експортувати як...</Key>.</Para>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><strong>SVG:</strong> Векторний формат. Ідеально для масштабування без втрати якості та подальшого редагування в інших векторних редакторах.</ListItem>
                                <ListItem><strong>PNG:</strong> Растровий формат з підтримкою прозорості. Підходить для веб-графіки.</ListItem>
                                <ListItem><strong>JPEG:</strong> Растровий формат з втратою якості. Гарний вибір для фотографій та складних градієнтів, дозволяє контролювати розмір файлу.</ListItem>
                            </ul>
                             <Para>Для PNG та JPEG можна налаштувати масштаб експорту, щоб отримати зображення вищої роздільної здатності.</Para>
                        </section>

                        <section>
                            <SectionTitle id="hotkeys">6. Гарячі клавіші</SectionTitle>
                             <Para>Гарячі клавіші працюють незалежно від поточної розкладки клавіатури (наприклад, <Key>V</Key> для вибору спрацює, навіть якщо у вас ввімкнена українська розкладка, де ця клавіша відповідає літері <Key>М</Key>).</Para>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border-b-2 border-[var(--border-secondary)] w-1/3">Комбінація</th>
                                        <th className="p-2 border-b-2 border-[var(--border-secondary)]">Дія</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Ctrl</Key> + <Key>S</Key></td>
                                        <td className="p-2">Зберегти проєкт</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Ctrl</Key> + <Key>Z</Key></td>
                                        <td className="p-2">Скасувати останню дію</td>
                                    </tr>
                                     <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Ctrl</Key> + <Key>Y</Key> (або <Key>Ctrl</Key> + <Key>Shift</Key> + <Key>Z</Key>)</td>
                                        <td className="p-2">Повернути скасовану дію</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Ctrl</Key> + <Key>D</Key></td>
                                        <td className="p-2">Дублювати виділений об'єкт</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Delete</Key> / <Key>Backspace</Key></td>
                                        <td className="p-2">Видалити виділений об'єкт або вузол</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>V</Key></td>
                                        <td className="p-2">Активувати інструмент "Вибрати"</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>A</Key></td>
                                        <td className="p-2">Активувати інструмент "Редагувати вузли"</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Стрілки</Key></td>
                                        <td className="p-2">Перемістити виділений об'єкт на 1 піксель</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Shift</Key> + <Key>Стрілки</Key></td>
                                        <td className="p-2">Перемістити виділений об'єкт на 10 пікселів</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)]">
                                        <td className="p-2"><Key>Escape</Key></td>
                                        <td className="p-2">Скасувати малювання полілінії/кривої, вийти з редагування назви або тексту на полотні</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    </div>
                </div>

                <footer className="p-4 bg-[var(--bg-app)]/50 rounded-b-lg flex justify-end flex-shrink-0">
                     <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-semibold bg-[var(--accent-primary)] text-[var(--accent-text)] hover:bg-[var(--accent-primary-hover)] transition-colors"
                    >
                        Закрити
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HelpModal;