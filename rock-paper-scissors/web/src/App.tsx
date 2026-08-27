import { Game } from './Game'
import { I18nProvider } from './i18n'

export default function App() {
  return (
    <I18nProvider>
      <Game />
    </I18nProvider>
  )
}
