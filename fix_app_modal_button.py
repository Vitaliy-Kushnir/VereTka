import re

with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace(
    "{drawingWarningModal.reason === 'hidden' && layers.find(l => l.id === activeLayerId)?.visible === false ? (",
    "{drawingWarningModal.reason === 'hidden' && layers.find((l: any) => l.id === (drawingWarningModal.layerId || activeLayerId))?.visible === false ? ("
)

text = text.replace(
    "setIgnoreHiddenWarningForLayer(activeLayerId);",
    "setIgnoreHiddenWarningForLayer(drawingWarningModal.layerId || activeLayerId);"
)

text = text.replace(
    "{drawingWarningModal.reason === 'hidden' ? t('warning.layerHidden.title') || \"Шар прихований\" : t('warning.layerLocked.title') || \"Шар заблокований\"}",
    "{drawingWarningModal.reason === 'hidden' ? t('warning.layerHidden.title') || \"Шар прихований\" : t('warning.layerLocked.title') || \"Шар заблокований\"}"
)

# And fix the text replacement we did earlier which was slightly broken
old_modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? (t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.") + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}"` : "")
                            : (t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.") + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}"` : "")}
                    </p>"""

new_modal_text = """                    <p className="mb-4 text-sm text-[var(--text-secondary)]">
                        {drawingWarningModal.reason === 'hidden' 
                            ? (t('warning.layerHidden.message') || "Ви намагаєтесь створити об'єкт на прихованому шарі. Будь ласка, виберіть інший.").replace('.', '') + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}". Будь ласка, виберіть інший.` : ".")
                            : (t('warning.layerLocked.message') || "Ви намагаєтесь створити об'єкт на заблокованому шарі. Будь ласка, виберіть інший.").replace('.', '') + (drawingWarningModal.layerId && layers.find((l: any) => l.id === drawingWarningModal.layerId) ? ` "${layers.find((l: any) => l.id === drawingWarningModal.layerId)?.name}". Будь ласка, виберіть інший.` : ".")}
                    </p>"""

text = text.replace(old_modal_text, new_modal_text)

with open("App.tsx", "w") as f:
    f.write(text)
