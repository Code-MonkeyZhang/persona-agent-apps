import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'

export default function MobileApp() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <HealthApp className="mobile-app" />
      </BrowserRouter>
      <Toaster position="top-center" />
    </I18nProvider>
  )
}
