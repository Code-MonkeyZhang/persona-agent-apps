import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'

export default function App() {
  return (
    <I18nProvider>
      <HealthApp className="app" />
    </I18nProvider>
  )
}
