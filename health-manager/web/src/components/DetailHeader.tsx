interface Props {
  title: string
  onBack: () => void
}

export function DetailHeader({ title, onBack }: Props) {
  return (
    <div className="detail-header">
      <button className="back-btn" onClick={onBack} aria-label="返回">
        ‹
      </button>
      <span className="detail-title">{title}</span>
    </div>
  )
}
