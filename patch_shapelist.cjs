const fs = require('fs');
let code = fs.readFileSync('components/ShapeList.tsx', 'utf-8');

const targetDeleteBtn = `                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>`;
const insertDeleteBtn = `                        <button onClick={(e) => { e.stopPropagation(); onDeleteShape(shape.id); }} disabled={!!distributePathState} className="p-1 ml-1 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500" title={t('list.delete')}>
                            <TrashIcon size={14} />
                        </button>`;

if (code.includes(targetDeleteBtn)) {
    code = code.replace(targetDeleteBtn, insertDeleteBtn);
    fs.writeFileSync('components/ShapeList.tsx', code);
    console.log('patched ShapeList successfully');
} else {
    console.log('Targets not found!');
}
