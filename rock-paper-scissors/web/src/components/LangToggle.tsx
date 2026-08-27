import { useI18n } from '../i18n'

/** 语言切换按钮：中文态显示 EN，英文态显示中文。 */
export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <button
      onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
      aria-label="切换语言 / Switch language"
      className={`press text-xs font-medium text-muted-foreground pointer-fine:hover:text-foreground ${className}`}
    >
      {lang === 'zh' ? 'EN' : '中文'}
    </button>
  )
}
