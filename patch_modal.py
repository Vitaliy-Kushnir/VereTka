import re

with open("App.tsx", "r") as f:
    text = f.read()

modal_target = """          {drawingWarningModal && drawingWarningModal.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-[var(--bg-app)] border border-[var(--border-color)] p-6 rounded-lg shadow-xl w-[400px]">
                    <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">
                        {drawingWarningModal.reason === 'hidden' ? t('warning.layerHidden.title') || "Шар прихований" : t('warning.layerLocked.title') || "Шар заблокований"}
                    </h2>
                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший."
                            : t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший."}
                    </p>
                    <div className="mb-4">
                        <label className="block text-xs mb-1 text-[var(--text-tertiary)]">{t('warning.selectLayer') || "Виберіть робочий шар:"}</label>
                        <select 
                            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded p-2"
                            value={activeLayerId || ''}
                            onChange={(e) => {
                                setActiveLayer(e.target.value);
                            }}
                        >
                            {layers.map((l: any) => (
                                <option key={l.id} value={l.id} disabled={l.locked || !l.visible}>
                                    {l.name} {l.locked ? `(${t('menu.edit.lock') || 'Заблоковано'})` : ''} {!l.visible ? `(${t('list.layerHidden') || 'Прихований'})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button 
                            className="px-4 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                            onClick={() => setDrawingWarningModal(null)}
                        >
                            {t('action.cancel') || 'Скасувати'}
                        </button>
                        {drawingWarningModal.reason === 'hidden' && (
                            <button 
                                className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                                onClick={() => {
                                    setIgnoreHiddenWarningForLayer(activeLayerId);
                                    setDrawingWarningModal(null);
                                }}
                            >
                                {t('action.drawAnyway') || 'Малювати все одно'}
                            </button>
                        )}
                        <button 
                            className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-[var(--accent-text)] rounded hover:bg-[var(--accent-primary-hover)]"
                            onClick={() => setDrawingWarningModal(null)}
                        >
                            {t('action.ok') || 'ОК'}
                        </button>
                    </div>
                </div>
            </div>
          )}"""

modal_replacement = """          {drawingWarningModal && drawingWarningModal.show && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-[var(--bg-app)] border border-[var(--border-color)] p-6 rounded-lg shadow-xl w-[400px] relative">
                    <button 
                        className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        onClick={() => setDrawingWarningModal(null)}
                    >
                        <XIcon size={20} />
                    </button>
                    <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]">
                        {drawingWarningModal.reason === 'hidden' ? t('warning.layerHidden.title') || "Шар прихований" : t('warning.layerLocked.title') || "Шар заблокований"}
                    </h2>
                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший."
                            : t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший."}
                    </p>
                    <div className="mb-4">
                        <label className="block text-xs mb-1 text-[var(--text-tertiary)]">{t('warning.selectLayer') || "Виберіть робочий шар:"}</label>
                        <select 
                            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded p-2"
                            value={activeLayerId || ''}
                            onChange={(e) => {
                                setActiveLayer(e.target.value);
                            }}
                        >
                            {layers.map((l: any) => (
                                <option key={l.id} value={l.id} disabled={l.locked || !l.visible}>
                                    {l.name} {l.locked ? `(${t('menu.edit.lock') || 'Заблоковано'})` : ''} {!l.visible ? `(${t('list.layerHidden') || 'Прихований'})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button 
                            className="px-4 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                            onClick={() => setDrawingWarningModal(null)}
                        >
                            {t('action.cancel') || 'Скасувати'}
                        </button>
                        {drawingWarningModal.reason === 'hidden' && layers.find(l => l.id === activeLayerId)?.visible === false ? (
                            <button 
                                className="px-4 py-2 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                                onClick={() => {
                                    setIgnoreHiddenWarningForLayer(activeLayerId);
                                    setDrawingWarningModal(null);
                                }}
                            >
                                {t('action.drawOnHiddenLayer') || 'Малювати на прихованому шарі'}
                            </button>
                        ) : (
                            <button 
                                className="px-4 py-2 text-sm bg-[var(--accent-primary)] text-[var(--accent-text)] rounded hover:bg-[var(--accent-primary-hover)]"
                                onClick={() => setDrawingWarningModal(null)}
                            >
                                {t('action.ok') || 'ОК'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
          )}"""

if "{l.locked ? `(${t('menu.edit.lock')})` : ''}" in text:
    text = text.replace("{l.locked ? `(${t('menu.edit.lock')})` : ''}", "{l.locked ? `(${t('menu.edit.lock') || 'Заблоковано'})` : ''}")

text = text.replace(modal_target, modal_replacement)

with open("App.tsx", "w") as f:
    f.write(text)
