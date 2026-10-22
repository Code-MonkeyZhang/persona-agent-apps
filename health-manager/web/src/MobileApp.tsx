import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'
import { ENTRY_BASE } from './lib/router'

export default function MobileApp() {
  return (
    <I18nProvider>
      <BrowserRouter basename={ENTRY_BASE || '/'}>
        <HealthApp className="mobile-app" />
      </BrowserRouter>
      <Toaster position="top-center" />
    </I18nProvider>
  )
}
