import { useI18n } from '../i18n'

interface Props {
  title: string
  onBack: () => void
}

export function DetailHeader({ title, onBack }: Props) {
  const { t } = useI18n()
  return (
    <div className="flex items-center py-2 pb-4">
      <button
        onClick={onBack}
        aria-label={t('common.back')}
        className="press cursor-pointer border-none bg-none pr-1.5 text-[32px] font-light leading-none text-primary mobile:pr-2.5 mobile:text-4xl"
      >
        ‹
      </button>
      <span className="text-[17px] font-semibold mobile:text-lg">{title}</span>
    </div>
  )
}
