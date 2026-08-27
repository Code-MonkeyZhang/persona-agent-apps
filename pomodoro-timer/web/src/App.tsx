import { Timer } from './Timer'
import { I18nProvider } from './i18n'

export default function App() {
  return (
    <I18nProvider>
      <Timer />
    </I18nProvider>
  )
}
