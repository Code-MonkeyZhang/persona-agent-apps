interface Props {
  title: string
  onBack: () => void
}

export function DetailHeader({ title, onBack }: Props) {
  return (
    <div className="flex items-center py-2 pb-4">
      <button
        onClick={onBack}
        aria-label="返回"
        className="press cursor-pointer border-none bg-none pr-1.5 text-[32px] font-light leading-none text-primary mobile:pr-2.5 mobile:text-4xl"
      >
        ‹
      </button>
      <span className="text-[17px] font-semibold mobile:text-lg">{title}</span>
    </div>
  )
}
