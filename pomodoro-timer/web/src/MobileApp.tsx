import { Timer } from './Timer'

/** 触屏版：复用桌面版 Timer，外层加 .mobile-app 触发移动端样式覆盖。 */
export default function MobileApp() {
  return <Timer className="mobile-app" />
}
