import { HealthApp } from './HealthApp'
import { I18nProvider } from './i18n'

export default function MobileApp() {
  return (
    <I18nProvider>
      <HealthApp className="mobile-app" />
    </I18nProvider>
  )
}
