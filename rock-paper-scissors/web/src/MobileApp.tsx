import { Game } from './Game'
import { I18nProvider } from './i18n'

/** 触屏版：复用桌面版 Game，外层加 .mobile-app 触发移动端样式覆盖。 */
export default function MobileApp() {
  return (
    <I18nProvider>
      <Game className="mobile-app" />
    </I18nProvider>
  )
}
