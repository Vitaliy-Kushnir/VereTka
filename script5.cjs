const fs = require('fs');
let text = fs.readFileSync('components/FormControls.tsx', 'utf8');

const dict = {
  'Усі кольори Tkinter': 'All Tkinter Colors',
  'Пошук за назвою або HEX...': 'Search by name or HEX...',
  'Очистити пошук': 'Clear search',
  'aria-label="Закрити"': 'aria-label="Close"',
  '>Сортувати:': '>Sort by:',
  'label="За групою"': 'label="By group"',
  'Сортувати за логічними групами кольорів': 'Sort by logical color groups',
  'label="За алфавітом (A-Z)"': 'label="Alphabetical (A-Z)"',
  'Сортувати за назвою в алфавітному порядку': 'Sort by name alphabetically',
  'label="За кодом (#)"': 'label="By code (#)"',
  'Сортувати за шістнадцятковим кодом': 'Sort by hexadecimal code',
  '>Вибрано:': '>Selected:',
  '>Нічого<': '>None<',
  '>Скасувати<': '>Cancel<',
  '>Застосувати<': '>Apply<',
  'HEX-код у форматі #RRGGBB або #RGB. Дозволені символи: 0-9, a-f.': 'HEX code in #RRGGBB or #RGB format. Allowed characters: 0-9, a-f.',
  "Введіть назву кольору (напр., 'Red', 'LightBlue') або HEX-код.": "Enter color name (e.g. 'Red', 'LightBlue') or HEX code.",
  ">Не знайдено<": ">Not found<",
  ">Усі кольори Tk...<": ">All Tk colors...<",
  'title="Нестандартний колір"': 'title="Non-standard color"',
  'message={`Колір "${conversionChoice.name}" не є стандартним веб-кольором. У редакторі він може відображатися чорним. Зберегти назву чи перетворити на HEX (${conversionChoice.hex}) для коректного відображення?`}': 'message={`Color "${conversionChoice.name}" is not a standard web color. It might be black in the editor. Save keeping the name or convert to HEX (${conversionChoice.hex})?`}',
  'confirmText="Перетворити на HEX"': 'confirmText="Convert to HEX"',
  'cancelText="Зберегти назву"': 'cancelText="Keep name"',
  'name: "Користувацький"': 'name: "Custom"',
  'description: "Власний стиль штрихування."': 'description: "Custom dash style."',
  'title="Вибрати готовий стиль штрихування або налаштувати власний"': 'title="Select preset dash style or configure custom"',
  "title={`Перетворити на ${convertibleTo === 'hex' ? 'HEX-код' : 'назву'}`}": "title={`Convert to ${convertibleTo === 'hex' ? 'HEX code' : 'name'}`}",
  'title="Скасувати (Esc)"': 'title="Cancel (Esc)"',
  'title="Підтвердити (Enter)"': 'title="Confirm (Enter)"'
};

for (const [k, v] of Object.entries(dict)) {
  text = text.split(k).join(v);
}

fs.writeFileSync('components/FormControls.tsx', text);
console.log('done text replace FormControls');
