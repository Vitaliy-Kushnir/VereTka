
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user to refresh app when a new version is available
    if (confirm('Доступна нова версія редактора. Оновити?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('Додаток готовий до роботи офлайн!')
  },
})
