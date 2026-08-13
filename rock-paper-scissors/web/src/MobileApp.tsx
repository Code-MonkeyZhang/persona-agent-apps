import { Game } from './Game'

/** 触屏版：复用桌面版 Game，外层加 .mobile-app 触发移动端样式覆盖。 */
export default function MobileApp() {
  return <Game className="mobile-app" />
}
