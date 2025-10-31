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

    const BASE_FONT_SIZE = 0.875; // 14px
    const MIN_FONT_SIZE = BASE_FONT_SIZE * 0.75;
    const MAX_FONT_SIZE = BASE_FONT_SIZE * 2.0;
    const FONT_STEP = BASE_FONT_SIZE * 0.05;

    const [fontSize, setFontSize] = useState(BASE_FONT_SIZE);

    const sections = [
        { id: 'intro', title: '1. Вступ' },
        { id: 'interface', title: '2. Огляд інтерфейсу' },
        { id: 'projects', title: '3. Робота з проєктами' },
        { id: 'templates', title: '4. Робота з шаблонами' },
        { id: 'shapes', title: '5. Робота з об\'єктами' },
        { id: 'code-export', title: '6. Код та експорт' },
        { id: 'feedback', title: '7. Зворотний зв\'язок' },
        { id: 'hotkeys', title: '8. Гарячі клавіші' },
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

        const allMarks = contentRef.current.querySelectorAll<HTMLElement>('mark');
        setMatchCount(allMarks.length);
        setCurrentMatchIndex(allMarks.length > 0 ? 0 : -1);

    }, [debouncedSearchTerm]);


    // Effect to apply active highlight and scroll.
    // It runs when the index or the search term changes.
    useEffect(() => {
        if (!contentRef.current || currentMatchIndex === -1) return;

        // Query for the currently rendered marks to ensure we have fresh nodes
        const allMarks = Array.from(contentRef.current.querySelectorAll<HTMLElement>('mark'));

        if (allMarks.length === 0) return;

        allMarks.forEach((match: HTMLElement, index) => {
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
        <code className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded-md font-mono" style={{ fontSize: '0.9em' }}>{children}</code>
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
                <header className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] flex-shrink-0 gap-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] whitespace-nowrap">Довідка та інструкції</h2>
                     <div className="flex-grow max-w-sm relative">
                        <input
                          type="text"
                          placeholder="Пошук у довідці..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md border border-[var(--border-secondary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:outline-none pr-28"
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 h-full flex items-center gap-1 bg-[var(--bg-secondary)] pl-2">
                             {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                    title="Очистити пошук"
                                    aria-label="Очистити пошук"
                                >
                                    <XIcon size={16} />
                                </button>
                            )}
                            {debouncedSearchTerm.trim() && (
                                <>
                                    {searchTerm && <div className="w-px h-4 bg-[var(--border-secondary)]"></div>}
                                    <div className="flex items-center text-xs text-[var(--text-tertiary)]">
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
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]" title="Масштаб тексту довідки">
                        <span 
                            className="text-xs cursor-pointer hover:text-[var(--text-primary)]" 
                            title="Зменшити шрифт на 5%"
                            onClick={() => setFontSize(prev => Math.max(MIN_FONT_SIZE, prev - FONT_STEP))}
                        >А</span>
                        <input
                            id="zoom-slider"
                            type="range"
                            min={MIN_FONT_SIZE}
                            max={MAX_FONT_SIZE}
                            step="0.01"
                            value={fontSize}
                            onChange={e => setFontSize(parseFloat(e.target.value))}
                            className="w-20 h-1 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)]"
                            title="Змінити розмір шрифту довідки"
                        />
                        <span 
                            className="text-lg cursor-pointer hover:text-[var(--text-primary)]" 
                            title="Збільшити шрифт на 5%"
                            onClick={() => setFontSize(prev => Math.min(MAX_FONT_SIZE, prev + FONT_STEP))}
                        >А</span>
                        <button 
                            onClick={() => setFontSize(BASE_FONT_SIZE)}
                            className="w-12 text-center text-xs font-mono hover:text-[var(--text-primary)] transition-colors"
                            title="Скинути масштаб до 100%"
                        >
                            {Math.round((fontSize / BASE_FONT_SIZE) * 100)}%
                        </button>
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
                                        className="block p-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <div 
                        ref={contentRef} 
                        className="flex-grow p-6 text-[var(--text-secondary)] overflow-y-auto scroll-smooth allow-selection"
                        style={{ fontSize: `${fontSize}rem` }}
                    >
                        <section>
                            <SectionTitle id="intro">1. Вступ</SectionTitle>
                            <Para>
                                <strong className="text-[var(--text-primary)]">ВереTkа</strong> — це простий веб-інструмент, розроблений для візуального створення графічних елементів та автоматичної генерації коду для бібліотеки Tkinter у Python. Редактор слугує мостом між дизайном та розробкою, дозволяючи швидко прототипувати, створювати складні сцени та отримувати чистий, готовий до використання код.
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
                                    <strong className="text-[var(--text-primary)]">Головне меню:</strong> Розташоване у верхній частині, надає доступ до глобальних операцій: керування файлами (<Key>Файл</Key>), історія змін та робота з буфером обміну (<Key>Редагувати</Key>), операції над об'єктами (<Key>Об'єкт</Key>), налаштування видимості (<Key>Вигляд</Key>) та довідкова інформація (<Key>Довідка</Key>). Праворуч у меню розташовані кнопки для швидкої зміни теми, переходу в повноекранний режим та виклику вікна налаштувань.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Панелі інструментів:</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><strong>Верхня панель:</strong> Динамічна панель, що відображає налаштування для активного інструмента (наприклад, колір заливки для прямокутника) або властивості виділеного об'єкта. Це дозволяє швидко змінювати параметри, не звертаючись до правої панелі.</li>
                                        <li><strong>Ліва панель:</strong> Основний набір інструментів для створення фігур. Згруповані за типом: примітиви, лінії та криві, багатокутники та інше.</li>
                                    </ul>
                                </ListItem>
                                 <ListItem>
                                    <strong className="text-[var(--text-primary)]">Робоча область (Полотно):</strong> Центральна частина, де ви малюєте та редагуєте об'єкти. Полотно має налаштовуваний розмір та колір тла. Навколо нього можуть бути розташовані лінійки для точного позиціонування. При масштабі понад 1000% з'являється додаткова, світліша сітка з кроком в 1 піксель для надточного вирівнювання.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Панель "Код Tkinter":</strong> Знаходиться зліва під панеллю інструментів. Тут у реальному часі (при використанні локального генератора) відображається Python-код, що відповідає вашому малюнку. Має кнопки для копіювання, попереднього перегляду та оновлення коду.
                                </ListItem>
                                 <ListItem>
                                    <strong className="text-[var(--text-primary)]">Праві панелі ("Об'єкти" та "Властивості"):</strong>
                                    <ul className="list-disc list-inside space-y-1 pl-6 mt-1">
                                        <li><strong>Список об'єктів:</strong> Ієрархічний список усіх фігур на полотні. Тут ви можете змінювати їх порядок (шари), перейменовувати, приховувати та блокувати.</li>
                                        <li><strong>Редактор властивостей:</strong> Детальна панель для налаштування параметрів виділеного об'єкта: координати, розміри, кольори, товщина контуру, специфічні атрибути (наприклад, кількість сторін у багатокутника) та вузлові точки для контурів.</li>
                                    </ul>
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Рядок стану:</strong> Нижня панель, що відображає поточний рівень масштабування та координати курсора на полотні. Клацніть на відсотковому значенні масштабу, щоб вручну ввести точне значення за допомогою поля вводу та стрілок.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Вікно довідки:</strong> Має власні елементи керування у заголовку: поле для пошуку по тексту та повзунок для масштабування розміру шрифту (від 75% до 200%). Для зручності, зліва від повзунка є маленька літера 'А', а справа — велика, натискання на які змінює масштаб на 5%. Клацання на відсотковому значенні миттєво повертає масштаб до стандартних 100%.
                                </ListItem>
                            </ul>
                             <SubTitle>Повноекранний режим</SubTitle>
                            <Para>
                                Для максимального занурення в роботу ви можете увімкнути повноекранний режим через меню <Key>Вигляд</Key> → <Key>Повноекранний режим</Key> або натиснувши клавішу <Key>F11</Key>. Це приховає інтерфейс браузера, надавши більше простору для творчості.
                            </Para>
                            <Para>
                                Щоб вийти з цього режиму, натисніть <Key>F11</Key> ще раз. Клавіша <Key>Escape (Esc)</Key> повністю заблокована у повноекранному режимі, щоб запобігти випадковому виходу.
                            </Para>
                        </section>

                        <section>
                            <SectionTitle id="projects">3. Робота з проєктами</SectionTitle>
                            <SubTitle>Створення нового проєкту</SubTitle>
                            <Para>
                                Ви можете створити новий проєкт через меню <Key>Файл</Key> → <Key>Новий проєкт...</Key> або з головного екрана. У вікні створення можна налаштувати назву, розміри та колір тла полотна, а також назву змінної для Tkinter Canvas у коді.
                            </Para>
                            <SubTitle>Збереження та завантаження</SubTitle>
                            <Para>
                                Проєкти зберігаються у форматі <Key>.vec.json</Key> — це текстовий файл, що містить повну інформацію про всі об'єкти, налаштування полотна та інтерфейсу.
                            </Para>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <Key>Зберегти</Key> (<Key>Ctrl+S</Key>): Зберігає поточні зміни у відкритий файл. Якщо проєкт новий, відкриється діалог "Зберегти як...".
                                </ListItem>
                                <ListItem>
                                    <Key>Зберегти як...</Key>: Дозволяє зберегти проєкт у новий файл, можливо, з іншою назвою.
                                </ListItem>
                                 <ListItem>
                                    <Key>Завантажити проєкт...</Key>: Відкриває діалогове вікно для вибору та завантаження файлу <Key>.vec.json</Key>.
                                </ListItem>
                            </ul>
                            <Para>
                                Редактор також веде список останніх відкритих проєктів, доступний на головному екрані для швидкого доступу.
                            </Para>
                            <SubTitle>Повернення до активного проєкту</SubTitle>
                            <Para>
                                Якщо ви перейшли на головний екран, не зберігши поточний проєкт, редактор не видаляє вашу роботу. На головному екрані з'явиться кнопка <strong className="text-[var(--text-primary)]">"Повернутися до проєкту"</strong>, яка дозволить вам миттєво продовжити редагування з того місця, де ви зупинилися. Це запобігає випадковій втраті незбережених змін.
                            </Para>
                            <SubTitle>Автозбереження та відновлення</SubTitle>
                            <Para>
                                Щоб запобігти втраті роботи, редактор автоматично зберігає поточний стан вашого проєкту кожні 2 хвилини, якщо є незбережені зміни. Ця резервна копія зберігається локально у вашому браузері.
                            </Para>
                            <Para>
                                Якщо ви випадково закриєте вкладку або браузер, при наступному запуску редактора на головному екрані з'явиться банер із пропозицією відновити автозбережену сесію. Ви можете відновити роботу або відхилити пропозицію, видаливши резервну копію.
                            </Para>
                            <Para>
                                Автозбережена версія автоматично видаляється після успішного ручного збереження проєкту (<Key>Зберегти</Key>, <Key>Зберегти як...</Key>), створення нового проєкту або повного очищення полотна.
                            </Para>
                        </section>

                        <section>
                             <SectionTitle id="templates">4. Робота з шаблонами</SectionTitle>
                            <SubTitle>Призначення та переваги</SubTitle>
                            <Para>
                                Шаблони — це потужний інструмент для стандартизації та прискорення вашої роботи. Шаблон зберігає повний стан поточного проєкту: розміри та колір полотна, налаштування сітки, а також усі намальовані об'єкти.
                            </Para>
                            <Para>Використання шаблонів є корисним, якщо ви:</Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>Часто створюєте проєкти з однаковими налаштуваннями полотна.</ListItem>
                                <ListItem>Хочете мати стартовий набір об'єктів (наприклад, фірмовий логотип, рамку, сітку координат).</ListItem>
                                <ListItem>Розробляєте серію ілюстрацій в єдиному стилі.</ListItem>
                            </ul>
                             <SubTitle>Створення та використання</SubTitle>
                            <ol className="list-decimal list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Створення:</strong> Налаштуйте полотно та намалюйте потрібні об'єкти. Потім перейдіть до меню <Key>Файл</Key> → <Key>Зберегти як шаблон...</Key>. Введіть зрозумілу назву для шаблону та збережіть.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Використання:</strong> При створенні нового проєкту (<Key>Файл</Key> → <Key>Новий проєкт...</Key>) у модальному вікні з'явиться випадаючий список "Створити з:". Виберіть потрібний шаблон зі списку. Усі налаштування та об'єкти з шаблону будуть автоматично застосовані до нового проєкту.
                                </ListItem>
                            </ol>
                            <SubTitle>Керування шаблонами</SubTitle>
                            <Para>
                                Ви можете керувати вашими шаблонами у вікні налаштувань. Перейдіть до <Key>Налаштування</Key> (у правому верхньому куті) та відкрийте вкладку <Key>Шаблони</Key>. Тут ви можете перейменовувати або видаляти непотрібні шаблони.
                            </Para>
                            <SubTitle>Де зберігаються шаблони?</SubTitle>
                             <Para>
                                Шаблони зберігаються локально у вашому браузері за допомогою технології <Key>localStorage</Key>. Це означає, що вони доступні лише на тому пристрої та в тому браузері, де були створені.
                            </Para>
                             <Para>
                                <strong className="text-[var(--destructive-text)]">Увага:</strong> Якщо ви очистите дані сайту (кеш, cookies) у налаштуваннях браузера, ваші шаблони буде видалено.
                            </Para>
                        </section>
                        
                        <section>
                            <SectionTitle id="shapes">5. Робота з об'єктами</SectionTitle>
                            <SubTitle>Створення об'єктів</SubTitle>
                            <Para>
                                Виберіть інструмент на лівій панелі та клацніть на полотні, щоб почати малювати. Для більшості фігур потрібно затиснути ліву кнопку миші та потягнути, щоб визначити розмір. Інструменти, як-от <Key>Ламана</Key> та <Key>Крива Без'є</Key>, вимагають послідовних клацань для додавання вузлів.
                            </Para>
                            <Para>
                                <strong className="text-[var(--text-primary)]">Порада:</strong> Утримуйте клавішу <Key>Shift</Key> під час малювання, щоб отримати фігури з однаковими візуальними шириною та висотою (наприклад при малюванні прямокутника або еліпса, щоб створити ідеальний квадрат або коло відповідно).
                            </Para>
                            <SubTitle>Виділення та трансформація</SubTitle>
                             <Para>
                                Використовуйте інструмент <Key>Вибрати</Key> (гаряча клавіша <Key>V</Key>), щоб виділяти об'єкти. Навколо виділеного об'єкта з'явиться рамка з маніпуляторами:
                            </Para>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Переміщення:</strong> Затисніть ліву кнопку миші на самому об'єкті та перетягуйте. Утримуйте <Key>Shift</Key> під час переміщення, щоб заблокувати рух по горизонтальній або вертикальній осі. Це також працює при дублюванні об'єкта правою кнопкою миші.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Масштабування:</strong> Потягніть за квадратні маніпулятори на кутах або сторонах рамки. Утримуйте <Key>Shift</Key> для збереження пропорцій.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Обертання:</strong> Потягніть за круглий маніпулятор, що знаходиться над рамкою.
                                </ListItem>
                            </ul>
                            <SubTitle>Редагування вузлів</SubTitle>
                            <Para>
                                Для контурних об'єктів (лінії, полігони, криві) доступний режим редагування вузлів (гаряча клавіша <Key>A</Key>). У цьому режимі ви можете переміщувати окремі вузлові точки, додавати нові (клацаючи на сегменті між точками) або видаляти існуючі (<Key>Delete</Key> або <Key>Backspace</Key> на виділеному вузлі).
                            </Para>
                            <SubTitle>Вибір кольору</SubTitle>
                            <Para>
                                Редактор "ВереTkа" надає потужний та гнучкий інструмент для роботи з кольорами, який поєднує зручність та відповідність стандартам Tkinter. Елемент вибору кольору складається з кількох частин:
                            </Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Зразок кольору:</strong> Квадратик, що відображає поточний колір. Клацання по ньому відкриває стандартну системну палітру кольорів.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Поле вводу:</strong> Дозволяє вводити назву кольору (напр., <Key>Red</Key>) або його HEX-код (напр., <Key>#ff0000</Key>). Поле має валідацію, що запобігає вводу некоректних символів.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Кнопки Підтвердити (✓) та Скасувати (X):</strong> Будь-яка зміна кольору є попереднім переглядом. Щоб застосувати зміну, натисніть галочку або клавішу <Key>Enter</Key>. Щоб скасувати, натисніть хрестик або <Key>Escape</Key>.
                                </ListItem>
                            </ul>

                            <SubTitle>Списки кольорів</SubTitle>
                            <Para>
                                При фокусуванні на полі вводу з'являється випадаючий список з двома рівнями доступу до кольорів:
                            </Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Основний список:</strong> Містить набір найпоширеніших веб-кольорів, які гарантовано коректно відображаються у браузері. Поруч з назвою для зручності вказано HEX-код, вирівняний по правому краю.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Усі кольори Tkinter:</strong> Натиснувши на посилання <Key>Усі кольори Tk...</Key> внизу списку, ви відкриєте модальне вікно з повною палітрою з понад 700 кольорів, які підтримує Tkinter. У цьому вікні ви можете:
                                    <ul className="list-circle list-inside space-y-1 pl-6 mt-1">
                                        <ListItem>Переглядати зразки кольорів разом з їх назвою та HEX-кодом.</ListItem>
                                        <ListItem>Шукати колір за назвою або HEX-кодом.</ListItem>
                                        <ListItem>Сортувати список за групами (стандартний вигляд), за алфавітом або за HEX-кодом.</ListItem>
                                        <ListItem>Очищувати поле пошуку за допомогою іконки "х".</ListItem>
                                    </ul>
                                </ListItem>
                            </ul>

                            <SubTitle>Сумісність кольорів</SubTitle>
                            <Para>
                                Бібліотека Tkinter та веб-браузери підтримують різні набори іменованих кольорів. Редактор обробляє цю різницю наступним чином:
                            </Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Веб-сумісні кольори:</strong> Якщо ви обираєте колір, назва якого підтримується браузерами (наприклад, <Key>SteelBlue</Key>), редактор збереже саме назву. Вона буде відображатися в полі та використовуватиметься у згенерованому коді.
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Специфічні кольори Tkinter:</strong> Якщо ви обираєте колір, який є лише в Tkinter (напр., <Key>IndianRed4</Key>), з'явиться діалогове вікно. Воно пояснить, що цей колір може некоректно відображатися в редакторі (чорним кольором), і запропонує вибір:
                                    <ul className="list-circle list-inside space-y-1 pl-6 mt-1">
                                        <ListItem><Key>Зберегти назву</Key>: у коді Tkinter буде використано назву, але в редакторі вигляд може бути неправильним.</ListItem>
                                        <ListItem><Key>Перетворити на HEX</Key>: колір буде збережено як HEX-код, що гарантує однакове відображення всюди.</ListItem>
                                    </ul>
                                </ListItem>
                            </ul>
                            <Para>
                                Також важливо знати, що деякі базові назви (напр., <Key>Maroon</Key>, <Key>Green</Key>) мають різні HEX-коди у веб-стандарті та у Tkinter. Редактор використовує офіційні значення Tkinter для генерації коду, щоб гарантувати повну відповідність результату.
                            </Para>
                            <SubTitle>Порядок (Шари)</SubTitle>
                            <Para>
                                Усі об'єкти розташовані у списку на правій панелі. Цей список визначає порядок їх відображення: об'єкти, що знаходяться вище у списку, будуть намальовані поверх тих, що нижче. Ви можете змінювати порядок, перетягуючи елементи у списку або використовуючи іконки-стрілочки, що з'являються при наведенні.
                            </Para>
                        </section>
                        
                        <section>
                            <SectionTitle id="code-export">6. Код та експорт</SectionTitle>
                            <SubTitle>Генерація коду</SubTitle>
                            <Para>
                                Панель "Код Tkinter" автоматично оновлює код при будь-яких змінах на полотні (якщо ввімкнено локальний генератор). Якщо ви використовуєте Gemini API, натисніть кнопку "Згенерувати код", щоб надіслати запит.
                            </Para>
                            <Para>
                                Згенерований код є повністю самодостатнім Python-скриптом. Ви можете скопіювати його, зберегти у файл або одразу відкрити та запустити в онлайн-середовищі ЄPython.
                            </Para>
                            <SubTitle>Збереження коду у файл</SubTitle>
                            <Para>
                                Щоб зберегти згенерований код, скористайтеся опцією <Key>Зберегти у файл...</Key> у випадаючому меню (<Key>...</Key>) на панелі "Код Tkinter". Відкриється модальне вікно, де ви можете налаштувати збереження.
                            </Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Назва файлу та розширення:</strong> Введіть бажану назву для файлу. Праворуч від поля вводу ви можете вибрати розширення:
                                    <ul className="list-circle list-inside space-y-1 pl-6 mt-1">
                                        <ListItem><Key>.py</Key> — стандартний формат для Python-скриптів. Файл можна буде виконати. Це опція за замовчуванням.</ListItem>
                                        <ListItem><Key>.txt</Key> — звичайний текстовий файл. Корисний для перегляду коду, документування або коли виконання не потрібне.</ListItem>
                                    </ul>
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Зберігати із номерами рядків:</strong> Ця опція з'являється лише при виборі розширення <Key>.txt</Key>. Якщо її увімкнути, кожний рядок у збереженому текстовому файлі буде починатися з номера рядка та розділювача (<Key>|</Key>), що може бути зручно для аналізу або обговорення коду.
                                </ListItem>
                            </ul>
                            <SubTitle>Експорт зображень</SubTitle>
                            <Para>
                                Ви можете експортувати ваш малюнок у растрових (<Key>PNG</Key>, <Key>JPEG</Key>) або векторному (<Key>SVG</Key>) форматах. Для цього перейдіть до меню <Key>Файл</Key> → <Key>Експортувати як...</Key>. У вікні експорту можна налаштувати формат, масштаб та якість (для JPEG).
                            </Para>
                        </section>

                        <section>
                            <SectionTitle id="feedback">7. Зворотний зв'язок</SectionTitle>
                            <Para>
                                Ваш відгук є надзвичайно важливим для подальшого розвитку редактора "ВереTkа". Ви можете легко повідомити про помилку, запропонувати нову функцію або просто поділитися враженнями через спеціальну форму.
                            </Para>
                            <SubTitle>Як залишити відгук</SubTitle>
                            <Para>
                                Щоб відкрити вікно для відгуку, перейдіть до головного меню та виберіть <Key>Довідка</Key> → <Key>Залишити відгук</Key>. У модальному вікні, що з'явиться, буде кнопка для переходу до Google Форми.
                            </Para>
                            <SubTitle>Автоматична передача даних</SubTitle>
                            <Para>
                                Для того, щоб зробити процес повідомлення про помилки максимально ефективним, редактор автоматично додає до вашого відгуку деяку технічну інформацію. Це допомагає розробнику швидше зрозуміти проблему та знайти її причину.
                            </Para>
                            <Para>Автоматично передаються наступні дані:</Para>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Версія редактора:</strong> Точна версія "ВереTkа", яку ви використовуєте (напр., 1.0.3).
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Операційна система:</strong> Ваша ОС та її версія (напр., Windows 10, macOS Sonoma).
                                </ListItem>
                                <ListItem>
                                    <strong className="text-[var(--text-primary)]">Веб-браузер:</strong> Назва та версія вашого браузера (напр., Chrome 126, Firefox 127).
                                </ListItem>
                            </ul>
                            <Para>
                                <strong className="text-[var(--text-primary)]">Примітка про приватність:</strong> Ця інформація не містить жодних особистих даних і використовується виключно для технічних цілей діагностики помилок.
                            </Para>
                        </section>

                        <section>
                            <SectionTitle id="hotkeys">8. Гарячі клавіші</SectionTitle>
                            <Para>Використовуйте ці комбінації для прискорення робочого процесу.</Para>
                            
                            <SubTitle>Робота з файлами та історією</SubTitle>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><Key>Ctrl+S</Key> — Зберегти проєкт.</ListItem>
                                <ListItem><Key>Ctrl+Z</Key> — Скасувати останню дію.</ListItem>
                                <ListItem><Key>Ctrl+Y</Key> (або <Key>Ctrl+Shift+Z</Key>) — Повернути скасовану дію.</ListItem>
                            </ul>

                            <SubTitle>Інструменти та виділення</SubTitle>
                             <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem><Key>V</Key> — Активувати інструмент "Вибрати".</ListItem>
                                <ListItem><Key>A</Key> — Активувати інструмент "Редагувати вузли".</ListItem>
                                <ListItem><Key>Ctrl+D</Key> — Дублювати виділений об'єкт.</ListItem>
                                <ListItem><Key>Delete</Key> / <Key>Backspace</Key> — Видалити виділений об'єкт або вузол.</ListItem>
                                 <ListItem><Key>Стрілки</Key> — Перемістити виділений об'єкт на 1 піксель.</ListItem>
                                 <ListItem><Key>Shift + Стрілки</Key> — Перемістити виділений об'єкт на 10 пікселів.</ListItem>
                            </ul>
                            
                            <SubTitle>Навігація та Загальне</SubTitle>
                            <ul className="list-disc list-inside space-y-2 pl-2">
                                <ListItem>
                                    <Key>Коліщатко миші</Key> — Масштабування полотна.
                                </ListItem>
                                <ListItem>
                                    <Key>Середня кнопка (коліщатко) миші (натиснути й тягнути)</Key> — Панорамування полотна.
                                </ListItem>
                                 <ListItem>
                                    <Key>F11</Key> — Вхід / вихід з повноекранного режиму.
                                </ListItem>
                                <ListItem>
                                    <Key>Escape (Esc)</Key> — Скасовує поточну дію (наприклад, малювання полілінії), знімає виділення з об'єкта або закриває активні модальні вікна. У повноекранному режимі ця клавіша заблокована, щоб запобігти випадковому виходу.
                                </ListItem>
                            </ul>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;