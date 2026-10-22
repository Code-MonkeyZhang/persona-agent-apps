import { ChevronLeft } from 'lucide-react'
import { useI18n } from '../i18n'

interface Props {
  title: string
  onBack: () => void
}

/** Large-title detail header with an iOS-style chevron back button. */
export function DetailHeader({ title, onBack }: Props) {
  const { t } = useI18n()
  return (
    <div className="flex items-center py-2 pb-4">
      <button
        onClick={onBack}
        aria-label={t('common.back')}
        className="press -ml-1.5 flex cursor-pointer items-center justify-center border-none bg-none p-1.5 text-primary mobile:-ml-2"
      >
        <ChevronLeft size={26} strokeWidth={2.5} />
      </button>
      <span className="text-[17px] font-semibold mobile:text-lg">{title}</span>
    </div>
  )
}
