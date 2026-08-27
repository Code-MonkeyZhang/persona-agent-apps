import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { LOCALES, type Lang, type TKey } from './locales'

const STORAGE_KEY = 'pomodoro-lang'

export type TFunc = (key: TKey, params?: Record<string, string | number>) => string

interface I18nContextValue {
  lang: Lang
  locale: string
  setLang: (lang: Lang) => void
  t: TFunc
}

const I18nContext = createContext<I18nContextValue | null>(null)

/**
 * 中英双语 Provider：语言偏好持久化到 localStorage，
 * 切换时同步 `document.documentElement.lang` 与页面标题。
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'en' ? 'en' : 'zh'
  })

  const locale = lang === 'zh' ? 'zh-CN' : 'en'

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = LOCALES[lang]._title
  }, [lang, locale])

  const t = useCallback<TFunc>(
    (key, params) => {
      let text = LOCALES[lang][key] ?? LOCALES.zh[key] ?? key
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value))
        }
      }
      return text
    },
    [lang]
  )

  const value = useMemo(
    () => ({ lang, locale, setLang, t }),
    [lang, locale, setLang, t]
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
