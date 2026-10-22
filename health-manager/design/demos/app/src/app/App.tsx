import { BrowserRouter } from 'react-router'
import { Toaster } from 'sonner'
import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <HealthApp className="app" />
      </BrowserRouter>
      <Toaster position="top-center" />
    </I18nProvider>
  )
}
