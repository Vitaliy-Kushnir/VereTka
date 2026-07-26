import re

with open("App.tsx", "r") as f:
    text = f.read()

old_modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? (t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.").replace('.', '') + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}". Будь ласка, виберіть інший.` : ".")
                            : (t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.").replace('.', '') + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}". Будь ласка, виберіть інший.` : ".")}
                    </p>"""

new_modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? (t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.").replace('.', (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}".` : "."), 1)
                            : (t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.").replace('.', (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}".` : "."), 1)}
                    </p>"""

text = text.replace(old_modal_text, new_modal_text)

with open("App.tsx", "w") as f:
    f.write(text)
