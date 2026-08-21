const fs = require('fs');

let code = fs.readFileSync('./components/mobile/MobileAlignSheet.tsx', 'utf8');

code = code.replace(
  `'Немає доступних фігур (намалюйте на полотні)'`,
  `t('mobile.align.noShapes') || 'Немає доступних фігур (намалюйте на полотні)'`
);
code = code.replace(
  `'-- Оберіть фігуру як контур --'`,
  `t('mobile.align.selectShapeContour') || '-- Оберіть фігуру як контур --'`
);
code = code.replace(
  '<span className="text-[var(--text-secondary)] text-xs">Тип орієнтації:</span>',
  `<span className="text-[var(--text-secondary)] text-xs">{t('mobile.align.orientationType') || 'Тип орієнтації:'}</span>`
);
code = code.replace(
  '<span>Кут орієнтації:</span>',
  `<span>{t('mobile.align.orientationAngle') || 'Кут орієнтації:'}</span>`
);
code = code.replace(
  '<span>Застосувати</span>',
  `<span>{t('button.apply') || 'Застосувати'}</span>`
);
code = code.replace(
  '<span>Скасувати</span>',
  `<span>{t('button.cancel') || 'Скасувати'}</span>`
);
code = code.replace(
  'База вирівнювання (Відносно чого):',
  `{t('mobile.align.base') || 'База вирівнювання (Відносно чого):'}`
);
code = code.replace(
  `{count < 2 ? '(потрібно 2+ фігури)' : \`(\${count} виділено)\`}`,
  `{count < 2 ? (t('mobile.align.need2Plus') || '(потрібно 2+ фігури)') : (t('mobile.align.selectedCount') || '({count} виділено)').replace('{count}', String(count))}`
);
code = code.replace(
  /<span>\s*ℹ️ <strong>Полотно:<\/strong>.*?<\/span>/s,
  `<span>
                                {(t('mobile.align.canvasDesc') || 'ℹ️ Полотно: Обʼєкти вирівнюються за межами або центром робочого полотна ({w}×{h}px). Працює для 1 або більше фігур.')
                                    .replace('{w}', String(canvasWidth))
                                    .replace('{h}', String(canvasHeight))}
                            </span>`
);
code = code.replace(
  /<span>\s*ℹ️ <strong>Виділення:<\/strong>.*?<\/span>/s,
  `<span>
                                {t('mobile.align.selectionDesc') || 'ℹ️ Виділення: Фігури вирівнюються одна відносно одної за крайніми координатами спільної рамки виділення.'}
                            </span>`
);
code = code.replace(
  'Вирівнювання сторін:',
  `{t('mobile.align.sideAlign') || 'Вирівнювання сторін:'}`
);
code = code.replace(
  '🎯 В центр полотна',
  `🎯 {t('tool.align.centerBothCanvas') || 'В центр полотна'}`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Зліва</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.left') || 'Зліва'}</span>`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Центр X</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.centerX') || 'Центр X'}</span>`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Справа</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.right') || 'Справа'}</span>`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Зверху</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.top') || 'Зверху'}</span>`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Центр Y</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.centerY') || 'Центр Y'}</span>`
);
code = code.replace(
  '<span className="font-semibold text-[11px] leading-tight">Знизу</span>',
  `<span className="font-semibold text-[11px] leading-tight">{t('mobile.align.bottom') || 'Знизу'}</span>`
);
code = code.replace(
  'Рівномірний розподіл інтервалів:',
  `{t('mobile.align.distributeSection') || 'Рівномірний розподіл інтервалів:'}`
);
code = code.replace(
  `{alignRelativeTo === 'canvas' ? 'Мін. 2 об\\'єкти' : 'Мін. 3 об\\'єкти'}`,
  `{alignRelativeTo === 'canvas' ? (t('mobile.align.min2Objects') || 'Мін. 2 обʼєкти') : (t('mobile.align.min3Objects') || 'Мін. 3 обʼєкти')}`
);
code = code.replace(
  '<span>Горизонтально</span>',
  `<span>{t('mobile.align.distributeH') || 'Горизонтально'}</span>`
);
code = code.replace(
  '<span>Вертикально</span>',
  `<span>{t('mobile.align.distributeV') || 'Вертикально'}</span>`
);
code = code.replace(
  `Розміщує виділені об'єкти вздовж кругового, лінійного або довільного контуру`,
  `{t('mobile.align.distributePathHint') || 'Розміщує виділені обʼєкти вздовж кругового, лінійного або довільного контуру'}`
);

fs.writeFileSync('./components/mobile/MobileAlignSheet.tsx', code, 'utf8');
console.log('Done!');
